import CategoryBudget from "../Models/CategoryBudget.js";

const currentMonthString = () => new Date().toISOString().slice(0, 7);

// 📄 Get all category budgets for a user for a given month (defaults to current)
export const getCategoryBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const month = req.query.month || currentMonthString();

    const budgets = await CategoryBudget.find({ userId, month });
    res.json(budgets);
  } catch (error) {
    console.error("Get Category Budgets Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔁 Create or update the limit for a category in a given month
export const upsertCategoryBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, limit, month } = req.body;

    if (!category || !category.trim()) {
      return res.status(400).json({ message: "Category is required" });
    }
    if (limit === undefined || limit === null || Number(limit) < 0) {
      return res.status(400).json({ message: "Please provide a valid limit" });
    }

    const resolvedMonth = month || currentMonthString();

    const budget = await CategoryBudget.findOneAndUpdate(
      { userId, category: category.trim(), month: resolvedMonth },
      { $set: { limit: Number(limit) }, $setOnInsert: { userId, category: category.trim(), month: resolvedMonth } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(budget);
  } catch (error) {
    console.error("Upsert Category Budget Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete a category budget
export const deleteCategoryBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const budget = await CategoryBudget.findOneAndDelete({ _id: id, userId });

    if (!budget) {
      return res.status(404).json({ message: "Category budget not found" });
    }

    res.json({ message: "Category budget deleted successfully" });
  } catch (error) {
    console.error("Delete Category Budget Error:", error);
    res.status(500).json({ message: error.message });
  }
};
