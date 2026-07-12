import mongoose from "mongoose";
import BillReminder from "../Models/BillReminder.js";
import User from "../Models/User.js";
import { createNotificationOnce } from "../services/notificationService.js";
import { createTransactionRecord } from "./transactionController.js";

// Rolls a recurring reminder's dueDate forward by whole months until it's in
// the future — same lazy self-healing convention as the monthly summary job,
// so no separate cron is needed just to keep recurring bills current.
const rollForwardIfPast = (reminder, now) => {
  if (!reminder.recurring) return false;

  let rolled = false;
  const dueDate = new Date(reminder.dueDate);
  let iterations = 0;

  while (dueDate < now && iterations < 120) {
    dueDate.setMonth(dueDate.getMonth() + 1);
    rolled = true;
    iterations++;
  }

  if (rolled) {
    reminder.dueDate = dueDate;
  }

  return rolled;
};

const deriveStatus = (reminder, now) => {
  const msUntilDue = new Date(reminder.dueDate) - now;
  const daysUntilDue = msUntilDue / (1000 * 60 * 60 * 24);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= reminder.notifyDaysBefore) return "due-soon";
  return "upcoming";
};

// ➕ Create a bill reminder
export const createBillReminder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, amount, dueDate, recurring, notifyDaysBefore } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Bill name is required" });
    }
    if (amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ message: "Please provide a valid amount" });
    }
    if (!dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }

    const reminder = await BillReminder.create({
      userId,
      name: name.trim(),
      amount: Number(amount),
      dueDate,
      recurring: Boolean(recurring),
      notifyDaysBefore: notifyDaysBefore !== undefined ? Number(notifyDaysBefore) : undefined,
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error("Create Bill Reminder Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📄 List a user's bill reminders, self-healing overdue recurring ones and
// annotating each with a derived status.
export const getBillReminders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const reminders = await BillReminder.find({ userId });

    for (const reminder of reminders) {
      if (rollForwardIfPast(reminder, now)) {
        await reminder.save();
      }
    }

    reminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json(reminders.map((reminder) => ({ ...reminder.toObject(), status: deriveStatus(reminder, now) })));
  } catch (error) {
    console.error("Get Bill Reminders Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔁 Update a bill reminder
export const updateBillReminder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, amount, dueDate, recurring, notifyDaysBefore } = req.body;

    const reminder = await BillReminder.findOneAndUpdate(
      { _id: id, userId },
      {
        name,
        amount: amount !== undefined ? Number(amount) : undefined,
        dueDate,
        recurring,
        notifyDaysBefore: notifyDaysBefore !== undefined ? Number(notifyDaysBefore) : undefined,
      },
      { new: true, omitUndefined: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: "Bill reminder not found" });
    }

    res.json(reminder);
  } catch (error) {
    console.error("Update Bill Reminder Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Called from the cron route. Rolls recurring reminders forward the same way
// getBillReminders does, then notifies users about any reminder due within
// its notifyDaysBefore window — deduped per (reminder, dueDate) so a
// recurring bill gets a fresh notification each cycle instead of a repeat.
export const runBillReminderChecks = async () => {
  const now = new Date();
  const reminders = await BillReminder.find({});
  let notifiedCount = 0;

  // Batch-fetch emails once instead of a per-reminder lookup — bills are
  // user-opted-in by having created the reminder, so unlike budget/unusual-
  // activity alerts this fires unconditionally with no preference gate.
  const userIds = [...new Set(reminders.map((r) => String(r.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select("email");
  const emailByUserId = new Map(users.map((u) => [String(u._id), u.email]));

  for (const reminder of reminders) {
    if (rollForwardIfPast(reminder, now)) {
      await reminder.save();
    }

    const daysUntilDue = (new Date(reminder.dueDate) - now) / (1000 * 60 * 60 * 24);
    if (daysUntilDue < 0 || daysUntilDue > reminder.notifyDaysBefore) continue;

    const dueDateKey = new Date(reminder.dueDate).toISOString().slice(0, 10);
    const created = await createNotificationOnce({
      userId: reminder.userId,
      type: "bill_reminder",
      message: `"${reminder.name}" (₹${reminder.amount}) is due on ${dueDateKey}.`,
      dedupeKey: `bill:${reminder._id}:${dueDateKey}`,
      userEmail: emailByUserId.get(String(reminder.userId)),
      subject: "Bill reminder",
    });

    if (created) notifiedCount++;
  }

  return notifiedCount;
};

// ✅ Mark a bill as paid: records the payment as a debit transaction through
// the same path as a manual add (so UserData totals and budget notifications
// stay consistent), then advances a recurring bill to its next due date or
// removes a one-time bill entirely.
export const payBillReminder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    let result;
    let notFound = false;

    await session.withTransaction(async () => {
      const reminder = await BillReminder.findOne({ _id: id, userId }).session(session);

      if (!reminder) {
        notFound = true;
        return;
      }

      let transaction = null;
      if (reminder.amount > 0) {
        transaction = await createTransactionRecord(
          userId,
          {
            type: "debit",
            method: "Other",
            category: "Bills",
            amount: reminder.amount,
            description: `Paid bill: ${reminder.name}`,
          },
          session
        );
      }

      if (reminder.recurring) {
        const nextDue = new Date(reminder.dueDate);
        nextDue.setMonth(nextDue.getMonth() + 1);
        reminder.dueDate = nextDue;
        await reminder.save({ session });
        result = { transaction, reminder };
      } else {
        await reminder.deleteOne({ session });
        result = { transaction, reminder: null };
      }
    });

    if (notFound) {
      return res.status(404).json({ message: "Bill reminder not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Pay Bill Reminder Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

// 🗑️ Delete a bill reminder
export const deleteBillReminder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const reminder = await BillReminder.findOneAndDelete({ _id: id, userId });

    if (!reminder) {
      return res.status(404).json({ message: "Bill reminder not found" });
    }

    res.json({ message: "Bill reminder deleted successfully" });
  } catch (error) {
    console.error("Delete Bill Reminder Error:", error);
    res.status(500).json({ message: error.message });
  }
};
