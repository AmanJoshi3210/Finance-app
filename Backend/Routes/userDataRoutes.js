import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addUserData, updateUserData, getUserData } from "../controllers/userDataController.js";

const router = express.Router();

router.post("/", authMiddleware, addUserData);      // Add user data
router.put("/", authMiddleware, updateUserData);    // Update user data
router.get("/", authMiddleware, getUserData);       // Fetch current user's data

export default router;
