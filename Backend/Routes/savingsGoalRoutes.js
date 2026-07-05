import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  deleteSavingsGoal,
  contributeSavingsGoal,
} from "../controllers/savingsGoalController.js";

const router = express.Router();

router.post("/", authMiddleware, createSavingsGoal);               // Create a savings goal
router.get("/", authMiddleware, getSavingsGoals);                   // List savings goals
router.put("/:id", authMiddleware, updateSavingsGoal);              // Update a savings goal
router.delete("/:id", authMiddleware, deleteSavingsGoal);           // Delete a savings goal
router.put("/:id/contribute", authMiddleware, contributeSavingsGoal); // Contribute toward a goal

export default router;
