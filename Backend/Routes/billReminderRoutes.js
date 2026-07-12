import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createBillReminder,
  getBillReminders,
  updateBillReminder,
  deleteBillReminder,
  payBillReminder,
} from "../controllers/billReminderController.js";

const router = express.Router();

router.post("/", authMiddleware, createBillReminder);   // Create a bill reminder
router.get("/", authMiddleware, getBillReminders);        // List bill reminders (self-heals recurring due dates)
router.post("/:id/pay", authMiddleware, payBillReminder); // Mark a bill paid (records debit, rolls/removes reminder)
router.put("/:id", authMiddleware, updateBillReminder);  // Update a bill reminder
router.delete("/:id", authMiddleware, deleteBillReminder); // Delete a bill reminder

export default router;
