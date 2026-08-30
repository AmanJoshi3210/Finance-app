import mongoose from "mongoose";
import UserData from "../Models/UserData.js";
import MonthlySummary from "../Models/MonthlySummary.js";
import Transaction from "../Models/Transactions.js";

// "YYYY-MM" for the calendar month before `date` (the month that just ended).
// Formatted from local date parts — toISOString() converts to UTC first, which
// mislabels the month on any server ahead of UTC (e.g. IST) since local
// "1st of month 00:00" is still the previous month in UTC.
export const getPreviousMonthString = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const currentMonthString = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

// [start, end) for a "YYYY-MM" key, in UTC — the same month convention used
// by notificationService's budget checks and getSpendingInsights.
const monthRange = (month) => {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
};

// Credit/debit totals for one user over one month, computed from the ledger
// rather than read off UserData's live counters.
//
// This is what makes the job safe to run late. UserData's totals are a
// month-to-date counter, so if the snapshot misses the boundary and runs on
// the 15th, those counters already contain the *current* month's spending —
// filing them as last month's summary and zeroing them would both fabricate
// history and destroy live data. The ledger always knows which month a
// transaction belongs to.
const ledgerTotalsForMonth = async (userId, month) => {
  const { start, end } = monthRange(month);

  const [row] = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        totalCredit: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } },
        totalDebit: {
          $sum: { $cond: [{ $in: ["$type", ["debit", "withdrawal"]] }, "$amount", 0] },
        },
      },
    },
  ]);

  return { totalCredit: row?.totalCredit || 0, totalDebit: row?.totalDebit || 0 };
};

// Snapshots a single user's `month` into MonthlySummary and re-bases their
// live totals onto the current month. Idempotent: an existing summary for
// {userId, month} is returned untouched.
//
// Returns null if `month` hasn't finished yet — an in-progress month is not
// history, and writing it would let a mislabelled month key freeze a partial
// total into the record.
export const runMonthlySnapshotForUser = async (userData, month) => {
  const { end } = monthRange(month);
  if (end > new Date()) return null;

  const existing = await MonthlySummary.findOne({ userId: userData.userId, month });
  if (existing) return existing;

  const totals = await ledgerTotalsForMonth(userData.userId, month);

  const summary = await MonthlySummary.findOneAndUpdate(
    { userId: userData.userId, month },
    {
      $setOnInsert: {
        userId: userData.userId,
        month,
        totalCredit: totals.totalCredit,
        totalDebit: totals.totalDebit,
        monthlyLimit: userData.monthlyLimit || 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Re-base rather than zero. UserData's totals track the *current* month, so
  // recomputing them from the ledger is correct whether this runs at the
  // boundary or days late, and it self-heals any drift between the counters
  // and the ledger. Account.balance is a true cumulative running balance and
  // is deliberately left alone — see applyAccountBalanceDelta.
  const currentTotals = await ledgerTotalsForMonth(userData.userId, currentMonthString());
  userData.totalCredit = currentTotals.totalCredit;
  userData.totalDebit = currentTotals.totalDebit;
  userData.updatedAt = Date.now();
  await userData.save();

  return summary;
};

// Cron entry point: snapshots every user for the month that just ended.
//
// Only the scheduled job may fan out across all users. Request handlers must
// use runMonthlySnapshotForUser for the caller alone — a per-user read path
// that rolled over every account in the database would let one user's page
// view rewrite everyone else's totals.
export const runMonthlySnapshot = async (month = getPreviousMonthString()) => {
  const allUsersData = await UserData.find();
  const summaries = [];

  for (const userData of allUsersData) {
    const summary = await runMonthlySnapshotForUser(userData, month);
    if (summary) summaries.push(summary);
  }

  return summaries;
};
