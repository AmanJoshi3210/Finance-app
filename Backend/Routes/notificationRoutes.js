import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getNotifications, markNotificationRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);          // List notifications + unread count
router.put("/:id/read", authMiddleware, markNotificationRead); // Mark a notification as read

export default router;
