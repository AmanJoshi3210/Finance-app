import UserData from "../Models/UserData.js";
import MonthlySummary from "../Models/MonthlySummary.js";

// "YYYY-MM" for the calendar month before `date` (the month that just ended)
export const getPreviousMonthString = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return d.toISOString().slice(0, 7);
};

// Snapshots every user's current totals into MonthlySummary under `month`,
// then resets totals so the new month starts from zero. Idempotent: if a
// summary already exists for {userId, month}, that user is left untouched.
export const runMonthlySnapshot = async (month = getPreviousMonthString()) => {
  const allUsersData = await UserData.find();
  const summaries = [];

  for (const userData of allUsersData) {
    const existing = await MonthlySummary.findOne({ userId: userData.userId, month });

    if (existing) {
      summaries.push(existing);
      continue;
    }

    const summary = await MonthlySummary.create({
      userId: userData.userId,
      month,
      totalCredit: userData.totalCredit,
      totalDebit: userData.totalDebit,
      monthlyLimit: userData.monthlyLimit,
    });

    userData.totalCredit = 0;
    userData.totalDebit = 0;
    userData.updatedAt = Date.now();
    await userData.save();

    summaries.push(summary);
  }

  return summaries;
};
