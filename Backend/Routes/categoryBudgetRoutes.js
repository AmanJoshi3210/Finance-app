import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getCategoryBudgets,
  upsertCategoryBudget,
  deleteCategoryBudget,
} from "../controllers/categoryBudgetController.js";

const router = express.Router();

router.get("/", authMiddleware, getCategoryBudgets);       // Get budgets for a month (?month=YYYY-MM)
router.put("/", authMiddleware, upsertCategoryBudget);      // Create or update a category's limit
router.delete("/:id", authMiddleware, deleteCategoryBudget); // Delete a category budget

export default router;
