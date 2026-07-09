import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getUserTransactions,
  getRecentTransactions,
  getMonthlyTrend,
  addOrUpdateMonthlyLimit,
  getMonthlyLimit,
  getUserCategories,
  exportTransactionsCsv,
  bulkAddTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/", authMiddleware, addTransaction);                       // Add new transaction
router.get("/", authMiddleware, getUserTransactions);                   // Get a paginated page of transactions
router.get("/export", authMiddleware, exportTransactionsCsv);           // Download transactions as a CSV attachment
router.post("/bulk", authMiddleware, bulkAddTransactions);              // Bulk-insert imported transactions (CSV import)
router.get("/recent", authMiddleware, getRecentTransactions);           // Get last N transactions (dashboard preview)
router.get("/monthly-trend", authMiddleware, getMonthlyTrend);          // Get credit/debit totals grouped by month
router.get("/monthly-limit", authMiddleware, getMonthlyLimit);          // Get monthly limit
router.put("/monthly-limit", authMiddleware, addOrUpdateMonthlyLimit);  // Update monthly limit
router.get("/categories", authMiddleware, getUserCategories);           // Get distinct categories used by the user

// Keep these below the literal routes above so "/monthly-limit" never matches ":id"
router.put("/:id", authMiddleware, updateTransaction);                  // Update transaction
router.delete("/:id", authMiddleware, deleteTransaction);               // Delete transaction

export default router;
