import express from "express";
import { runMonthlySnapshot } from "../controllers/monthlySnapshotController.js";

const router = express.Router();

// Hit by an external scheduler (e.g. Render Cron Job). Guarded by a shared
// secret instead of authMiddleware since there is no user JWT available here.
router.get("/monthly-snapshot", async (req, res) => {
  try {
    const secret = req.headers["x-cron-secret"];

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const summaries = await runMonthlySnapshot();
    res.json({ message: "Monthly snapshot complete", count: summaries.length });
  } catch (error) {
    console.error("Monthly Snapshot Cron Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
