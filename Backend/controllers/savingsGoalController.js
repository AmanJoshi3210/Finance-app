import SavingsGoal from "../Models/SavingsGoal.js";

// ➕ Create a savings goal
export const createSavingsGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, targetAmount, deadline } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Goal name is required" });
    }
    if (targetAmount === undefined || Number(targetAmount) <= 0) {
      return res.status(400).json({ message: "Please provide a valid target amount" });
    }

    const goal = await SavingsGoal.create({
      userId,
      name: name.trim(),
      targetAmount: Number(targetAmount),
      deadline,
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error("Create Savings Goal Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📄 List a user's savings goals
export const getSavingsGoals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error("Get Savings Goals Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔁 Update a savings goal's name/target/deadline
export const updateSavingsGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, targetAmount, deadline } = req.body;

    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: id, userId },
      {
        name,
        targetAmount: targetAmount !== undefined ? Number(targetAmount) : undefined,
        deadline,
      },
      { new: true, omitUndefined: true }
    );

    if (!goal) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    res.json(goal);
  } catch (error) {
    console.error("Update Savings Goal Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete a savings goal
export const deleteSavingsGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const goal = await SavingsGoal.findOneAndDelete({ _id: id, userId });

    if (!goal) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    res.json({ message: "Savings goal deleted successfully" });
  } catch (error) {
    console.error("Delete Savings Goal Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 💰 Contribute an amount toward a savings goal (atomic increment)
export const contributeSavingsGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount } = req.body;

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ message: "Please provide a valid contribution amount" });
    }

    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: id, userId },
      { $inc: { currentAmount: Number(amount) } },
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    res.json(goal);
  } catch (error) {
    console.error("Contribute Savings Goal Error:", error);
    res.status(500).json({ message: error.message });
  }
};
