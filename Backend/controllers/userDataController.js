import UserData from "../Models/UserData.js";
// ➕ Add or Create UserData (initial setup)
export const addUserData = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT
    const { monthlyLimit, totalBalance } = req.body;

    const existing = await UserData.findOne({ userId });
    if (existing) {
      return res.status(400).json({ message: "UserData already exists" });
    }

    const newData = await UserData.create({ userId, monthlyLimit, totalBalance });
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔁 Update UserData (limit or balance)
export const updateUserData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { monthlyLimit, totalBalance } = req.body;

    const updatedData = await UserData.findOneAndUpdate(
      { userId },
      { monthlyLimit, totalBalance, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedData) {
      return res.status(404).json({ message: "UserData not found" });
    }

    res.json(updatedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 Get current user data
//
// A user has no UserData document until their first transaction upserts one
// (or they set a monthly limit), so "missing" is the normal state for a
// freshly-verified account — not an error. Returning zeroed totals instead of
// a 404 keeps the dashboard's Promise.all from rejecting and blanking every
// other panel on the very first visit. Mirrors how getMonthlyLimit already
// treats the empty case.
export const getUserData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = await UserData.findOne({ userId });

    if (!data) {
      return res.json({ userId, monthlyLimit: 0, totalCredit: 0, totalDebit: 0 });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
