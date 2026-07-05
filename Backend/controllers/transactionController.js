import mongoose from "mongoose";
import Transaction from "../Models/Transactions.js";
import UserData from "../Models/UserData.js";
// import User from "../Models/User.js"; // if you need to verify user existence

export const addTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const userId = req.user.userId;
    const { type, method, category, amount, description } = req.body;
    const numericAmount = Number(amount);

    let transaction;
    await session.withTransaction(async () => {
      // Create new transaction
      [transaction] = await Transaction.create(
        [{ userId, type, method, category, amount: numericAmount, description }],
        { session }
      );

      // Atomically increment the matching total so this can't be lost to a
      // race or interrupted mid-write (a stale read-modify-save previously
      // let one field's update silently disappear under concurrent requests).
      const inc = {};
      if (type === "credit") inc.totalCredit = numericAmount;
      else if (type === "debit" || type === "withdrawal") inc.totalDebit = numericAmount;

      if (Object.keys(inc).length) {
        await UserData.findOneAndUpdate(
          { userId },
          { $inc: inc, $setOnInsert: { userId } },
          { upsert: true, setDefaultsOnInsert: true, session }
        );
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Add Transaction Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};


// 🔁 Update a transaction
export const updateTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { type, method, category, amount, description } = req.body;
    const numericAmount = Number(amount);

    let transaction;
    let notFound = false;

    await session.withTransaction(async () => {
      const existingTransaction = await Transaction.findOne({ _id: id, userId }).session(session);

      if (!existingTransaction) {
        notFound = true;
        return;
      }

      // Net delta: reverse the old contribution, apply the new one, in one atomic $inc.
      const creditDelta =
        (type === "credit" ? numericAmount : 0) -
        (existingTransaction.type === "credit" ? existingTransaction.amount : 0);
      const debitDelta =
        (type === "debit" || type === "withdrawal" ? numericAmount : 0) -
        (existingTransaction.type === "debit" || existingTransaction.type === "withdrawal"
          ? existingTransaction.amount
          : 0);

      if (creditDelta || debitDelta) {
        await UserData.findOneAndUpdate(
          { userId },
          { $inc: { totalCredit: creditDelta, totalDebit: debitDelta }, $set: { updatedAt: Date.now() } },
          { upsert: true, setDefaultsOnInsert: true, session }
        );
      }

      existingTransaction.type = type;
      existingTransaction.method = method;
      existingTransaction.category = category;
      existingTransaction.amount = numericAmount;
      existingTransaction.description = description;
      await existingTransaction.save({ session });

      transaction = existingTransaction;
    });

    if (notFound) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Update Transaction Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

// 🗑️ Delete a transaction
export const deleteTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    let notFound = false;

    await session.withTransaction(async () => {
      const transaction = await Transaction.findOneAndDelete({ _id: id, userId }).session(session);

      if (!transaction) {
        notFound = true;
        return;
      }

      const dec = {};
      if (transaction.type === "credit") dec.totalCredit = -transaction.amount;
      else if (transaction.type === "debit" || transaction.type === "withdrawal") dec.totalDebit = -transaction.amount;

      if (Object.keys(dec).length) {
        await UserData.findOneAndUpdate(
          { userId },
          { $inc: dec, $set: { updatedAt: Date.now() } },
          { session }
        );
      }
    });

    if (notFound) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

// 📄 Get all transactions for a user
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addOrUpdateMonthlyLimit = async (req, res) => {
  try {
    const { monthlyLimit } = req.body;
    const userId = req.user?.userId; 

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: userId missing from token" });
    }

    if (!monthlyLimit || monthlyLimit < 0) {
      return res.status(400).json({ message: "Please provide a valid monthly limit" });
    }

    const userData = await UserData.findOneAndUpdate(
      { userId },
      { $set: { monthlyLimit, updatedAt: Date.now() }, $setOnInsert: { userId } },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );

    res.status(200).json({
      message: "Monthly limit updated successfully",
      monthlyLimit: userData.monthlyLimit,
    });
  } catch (error) {
    console.error("Error updating monthly limit:", error);
    res.status(500).json({ message: "Server error while updating monthly limit" });
  }
};

export const getMonthlyLimit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userData = await UserData.findOne({ userId });

    if (!userData) {
      return res.status(200).json({ monthlyLimit: 0 });
    }

    res.status(200).json({ monthlyLimit: userData.monthlyLimit });
  } catch (error) {
    console.error("Error fetching monthly limit:", error);
    res.status(500).json({ message: "Server error fetching monthly limit" });
  }
};

