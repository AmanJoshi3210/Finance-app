import mongoose from "mongoose";
import Transaction from "../Models/Transactions.js";
import UserData from "../Models/UserData.js";
// import User from "../Models/User.js"; // if you need to verify user existence

// Applies a delta to UserData's running totals inside the caller's
// transaction, clamping each total at 0 with an aggregation-pipeline update
// so a delete/edit reversal can never drive it negative (e.g. totals drifted
// out of sync with the ledger, or two edits race on the same transaction).
const applyUserDataDelta = async (userId, { creditDelta = 0, debitDelta = 0 }, session) => {
  if (!creditDelta && !debitDelta) return;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  await UserData.findOneAndUpdate(
    { userId: userObjectId },
    [
      {
        $set: {
          userId: userObjectId,
          monthlyLimit: { $ifNull: ["$monthlyLimit", 0] },
          totalCredit: {
            $max: [{ $add: [{ $ifNull: ["$totalCredit", 0] }, creditDelta] }, 0],
          },
          totalDebit: {
            $max: [{ $add: [{ $ifNull: ["$totalDebit", 0] }, debitDelta] }, 0],
          },
          updatedAt: "$$NOW",
        },
      },
    ],
    { upsert: true, session }
  );
};

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
      const creditDelta = type === "credit" ? numericAmount : 0;
      const debitDelta = type === "debit" || type === "withdrawal" ? numericAmount : 0;

      await applyUserDataDelta(userId, { creditDelta, debitDelta }, session);
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

      // Net delta: reverse the old contribution, apply the new one, in one atomic update.
      const creditDelta =
        (type === "credit" ? numericAmount : 0) -
        (existingTransaction.type === "credit" ? existingTransaction.amount : 0);
      const debitDelta =
        (type === "debit" || type === "withdrawal" ? numericAmount : 0) -
        (existingTransaction.type === "debit" || existingTransaction.type === "withdrawal"
          ? existingTransaction.amount
          : 0);

      await applyUserDataDelta(userId, { creditDelta, debitDelta }, session);

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

      const creditDelta = transaction.type === "credit" ? -transaction.amount : 0;
      const debitDelta =
        transaction.type === "debit" || transaction.type === "withdrawal" ? -transaction.amount : 0;

      await applyUserDataDelta(userId, { creditDelta, debitDelta }, session);
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

// 📄 Get a page of transactions for a user (filterable by type/search)
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const { type, search } = req.query;

    const filter = { userId };
    if (type && type !== "all") {
      filter.type = type;
    }
    if (search && search.trim()) {
      // Escape regex metacharacters so user input can't break/DoS the pattern
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ category: regex }, { description: regex }, { method: regex }];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 Get only the most recent N transactions (lightweight, for dashboard preview)
export const getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(limit);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📈 Get credit/debit totals grouped by month, for the spending trend chart
export const getMonthlyTrend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const trend = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          credit: {
            $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] },
          },
          debit: {
            $sum: {
              $cond: [{ $in: ["$type", ["debit", "withdrawal"]] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id",
          credit: 1,
          debit: 1,
        },
      },
    ]);

    res.json(trend);
  } catch (error) {
    console.error("Error fetching monthly trend:", error);
    res.status(500).json({ message: "Server error fetching monthly trend" });
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

