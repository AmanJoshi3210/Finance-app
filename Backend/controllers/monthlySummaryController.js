import MonthlySummary from "../Models/MonthlySummary.js";
import { runMonthlySnapshot, getPreviousMonthString } from "./monthlySnapshotController.js";

export const getMonthlySummaries = async (req, res) => {
  try {
    const userId = req.user.userId;
    const lastMonth = getPreviousMonthString();

    // Self-heal: if the scheduled cron never ran (missed deploy, no ops
    // monitoring), snapshot lazily on read so history doesn't silently gap.
    const existing = await MonthlySummary.findOne({ userId, month: lastMonth });
    if (!existing) {
      await runMonthlySnapshot(lastMonth);
    }

    const summaries = await MonthlySummary.find({ userId }).sort({ month: -1 });
    res.json(summaries);
  } catch (error) {
    console.error("Get Monthly Summaries Error:", error);
    res.status(500).json({ message: error.message });
  }
};
