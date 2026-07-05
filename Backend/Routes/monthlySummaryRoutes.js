import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMonthlySummaries } from "../controllers/monthlySummaryController.js";

const router = express.Router();

router.get("/", authMiddleware, getMonthlySummaries);

export default router;
