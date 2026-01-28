import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addTransaction,
  updateTransaction,
  getUserTransactions,
  addOrUpdateMonthlyLimit,
  getMonthlyLimit,
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/", authMiddleware, addTransaction);              // Add new transaction
// router.put("/:id", authMiddleware, updateTransaction);         // Update transaction
router.get("/", authMiddleware, getUserTransactions);
router.get("/monthly-limit", authMiddleware, getMonthlyLimit);          // Get all transactions
router.put("/monthly-limit", authMiddleware, addOrUpdateMonthlyLimit);          // Get all transactions

export default router;
