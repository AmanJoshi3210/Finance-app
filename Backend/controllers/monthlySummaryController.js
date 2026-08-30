import MonthlySummary from "../Models/MonthlySummary.js";
import UserData from "../Models/UserData.js";
import { runMonthlySnapshotForUser, getPreviousMonthString } from "./monthlySnapshotController.js";

export const getMonthlySummaries = async (req, res) => {
  try {
    const userId = req.user.userId;
    const lastMonth = getPreviousMonthString();

    // Self-heal: if the scheduled cron never ran (missed deploy, no ops
    // monitoring), snapshot lazily on read so history doesn't silently gap.
    //
    // Scoped to the caller. This used to call runMonthlySnapshot(), which
    // walks every UserData document — so one user opening this page rolled
    // over and re-based *every* account in the database.
    const existing = await MonthlySummary.findOne({ userId, month: lastMonth });
    if (!existing) {
      const userData = await UserData.findOne({ userId });
      if (userData) {
        await runMonthlySnapshotForUser(userData, lastMonth);
      }
    }

    const summaries = await MonthlySummary.find({ userId }).sort({ month: -1 });
    res.json(summaries);
  } catch (error) {
    console.error("Get Monthly Summaries Error:", error);
    res.status(500).json({ message: error.message });
  }
};
