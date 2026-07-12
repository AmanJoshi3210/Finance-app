import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
} from "../controllers/accountController.js";

const router = express.Router();

router.post("/", authMiddleware, createAccount);        // Create an account
router.get("/", authMiddleware, getAccounts);            // List accounts
router.put("/:id", authMiddleware, updateAccount);       // Update an account
router.delete("/:id", authMiddleware, deleteAccount);    // Archive or delete an account

export default router;
