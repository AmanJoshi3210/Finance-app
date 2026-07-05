import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createRecurringTransaction,
  getRecurringTransactions,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "../controllers/recurringTransactionController.js";

const router = express.Router();

router.post("/", authMiddleware, createRecurringTransaction);   // Create a recurring transaction rule
router.get("/", authMiddleware, getRecurringTransactions);       // List recurring transaction rules
router.put("/:id", authMiddleware, updateRecurringTransaction);  // Update a recurring transaction rule
router.delete("/:id", authMiddleware, deleteRecurringTransaction); // Delete a recurring transaction rule

export default router;
