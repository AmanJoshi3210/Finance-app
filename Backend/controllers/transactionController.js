import { log } from "console";
import Transaction from "../Models/Transactions.js";
import UserData from "../Models/UserData.js";
// import User from "../Models/User.js"; // if you need to verify user existence

export const addTransaction = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const userId = req.user.userId;
    const { type, method, category, amount, description } = req.body;
    const numericAmount = Number(amount);

    // Create new transaction
    const transaction = await Transaction.create({
      userId,
      type,
      method,
      category,
      amount: numericAmount,
      description,
    });

    // Update or create UserData
    let existing = await UserData.findOne({ userId });

    if (existing) {
      if (type === "credit") {
        existing.totalCredit += numericAmount;
      } else if (type === "debit" || type === "withdrawal") {
        existing.totalDebit += numericAmount;
      }
      await existing.save();
    } else {
      const newUserData = await UserData.create({
        userId,
        totalCredit: type === "credit" ? numericAmount : 0,
        totalDebit: type === "debit" || type === "withdrawal" ? numericAmount : 0,
      });
      //console.log("Created new UserData:", newUserData);
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Add Transaction Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// 🔁 Update a transaction
export const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { type, method, category, amount, description } = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { type, method, category, amount, description },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Find or create UserData
    let userData = await UserData.findOne({ userId });

    if (!userData) {
      userData = new UserData({ userId, monthlyLimit });
    } else {
      userData.monthlyLimit = monthlyLimit;
      userData.updatedAt = Date.now();
    }

    await userData.save();

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

