import mongoose from "mongoose";
import RecurringTransaction from "../Models/RecurringTransaction.js";
import { createTransactionRecord } from "./transactionController.js";

// Advances a date by one period of `frequency`. Uses native Date rollover
// (JS normalizes e.g. Jan 31 + 1 month into a valid date) rather than a
// date library, matching the rest of this codebase's dependency-light style.
const advanceDate = (date, frequency) => {
  const next = new Date(date);
  if (frequency === "daily") next.setDate(next.getDate() + 1);
  else if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  return next;
};

// ➕ Create a recurring transaction rule
export const createRecurringTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, method, category, amount, description, frequency, nextRunDate, active } = req.body;

    if (!type || !frequency || !nextRunDate || amount === undefined) {
      return res.status(400).json({ message: "type, amount, frequency and nextRunDate are required" });
    }

    const recurring = await RecurringTransaction.create({
      userId,
      type,
      method,
      category,
      amount: Number(amount),
      description,
      frequency,
      nextRunDate,
      active: active !== undefined ? active : true,
    });

    res.status(201).json(recurring);
  } catch (error) {
    console.error("Create Recurring Transaction Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📄 List a user's recurring transaction rules
export const getRecurringTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recurringTransactions = await RecurringTransaction.find({ userId }).sort({ nextRunDate: 1 });
    res.json(recurringTransactions);
  } catch (error) {
    console.error("Get Recurring Transactions Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔁 Update a recurring transaction rule
export const updateRecurringTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { type, method, category, amount, description, frequency, nextRunDate, active } = req.body;

    const recurring = await RecurringTransaction.findOneAndUpdate(
      { _id: id, userId },
      { type, method, category, amount: amount !== undefined ? Number(amount) : undefined, description, frequency, nextRunDate, active },
      { new: true, omitUndefined: true }
    );

    if (!recurring) {
      return res.status(404).json({ message: "Recurring transaction not found" });
    }

    res.json(recurring);
  } catch (error) {
    console.error("Update Recurring Transaction Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete a recurring transaction rule
export const deleteRecurringTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const recurring = await RecurringTransaction.findOneAndDelete({ _id: id, userId });

    if (!recurring) {
      return res.status(404).json({ message: "Recurring transaction not found" });
    }

    res.json({ message: "Recurring transaction deleted successfully" });
  } catch (error) {
    console.error("Delete Recurring Transaction Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Called from the cron route. Posts a Transaction (via the same path as
// addTransaction) for every recurring rule that is due, catching up on
// missed periods (e.g. server was down) with a bounded loop per record.
export const runDueRecurringTransactions = async () => {
  const now = new Date();
  const dueRecords = await RecurringTransaction.find({ active: true, nextRunDate: { $lte: now } });

  let createdCount = 0;

  for (const record of dueRecords) {
    const session = await mongoose.startSession();
    try {
      let iterations = 0;
      while (record.nextRunDate <= now && iterations < 366) {
        await session.withTransaction(async () => {
          await createTransactionRecord(
            record.userId,
            {
              type: record.type,
              method: record.method,
              category: record.category,
              amount: record.amount,
              description: record.description,
            },
            session
          );
        });

        record.nextRunDate = advanceDate(record.nextRunDate, record.frequency);
        await record.save();

        createdCount++;
        iterations++;
      }
    } finally {
      await session.endSession();
    }
  }

  return createdCount;
};
