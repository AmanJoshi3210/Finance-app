import Account from "../Models/Account.js";
import Transaction from "../Models/Transactions.js";

const ACCOUNT_TYPES = ["bank", "credit_card", "cash", "wallet", "investment", "other"];

// ➕ Create an account. Setting isDefault:true atomically unsets any prior
// default in the same write (the schema's partial unique index would reject
// two defaults existing at once otherwise).
export const createAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, type, openingBalance, isDefault } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Account name is required" });
    }
    if (type !== undefined && !ACCOUNT_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const balance = openingBalance !== undefined ? Number(openingBalance) : 0;
    if (!Number.isFinite(balance)) {
      return res.status(400).json({ message: "Opening balance must be a number" });
    }

    if (isDefault) {
      await Account.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
    }

    // First account a user creates becomes the default automatically, even
    // if not explicitly requested, so there's always exactly one to fall
    // back to.
    const hasAnyAccount = await Account.exists({ userId });

    const account = await Account.create({
      userId,
      name: name.trim(),
      type: type || "other",
      openingBalance: balance,
      balance,
      isDefault: Boolean(isDefault) || !hasAnyAccount,
    });

    res.status(201).json(account);
  } catch (error) {
    console.error("Create Account Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📄 List a user's accounts (excludes archived ones unless requested).
export const getAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filter = { userId };
    if (req.query.includeArchived !== "true") {
      filter.archived = false;
    }

    const accounts = await Account.find(filter).sort({ isDefault: -1, createdAt: 1 });
    res.json(accounts);
  } catch (error) {
    console.error("Get Accounts Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔁 Update an account's name/type/default flag. openingBalance is
// intentionally immutable after creation — changing it after transactions
// have already posted against the account would require recomputing
// `balance` from scratch to stay consistent.
export const updateAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, type, isDefault } = req.body;

    if (type !== undefined && !ACCOUNT_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    if (isDefault) {
      await Account.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
    }

    const account = await Account.findOneAndUpdate(
      { _id: id, userId },
      { name, type, isDefault },
      { new: true, omitUndefined: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(account);
  } catch (error) {
    console.error("Update Account Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Archive (or, if it has no transactions, hard-delete) an account.
// Blocks removing the current default rather than silently auto-promoting
// another account — the user should choose the new default explicitly.
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const account = await Account.findOne({ _id: id, userId });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.isDefault) {
      return res.status(400).json({
        message: "Can't remove the default account. Set a different account as default first.",
      });
    }

    const hasTransactions = await Transaction.exists({ accountId: account._id });

    if (hasTransactions) {
      account.archived = true;
      await account.save();
      return res.json({ message: "Account archived successfully", account });
    }

    await account.deleteOne();
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: error.message });
  }
};
