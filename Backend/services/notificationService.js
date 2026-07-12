import mongoose from "mongoose";
import Notification from "../Models/Notification.js";
import Transaction from "../Models/Transactions.js";
import CategoryBudget from "../Models/CategoryBudget.js";
import { sendEmail } from "./emailService.js";

// Check 100% before 90% so only the strongest applicable threshold notifies.
const THRESHOLDS = [1, 0.9];

const monthKey = (date) => new Date(date).toISOString().slice(0, 7);

// Creates a notification for a given (userId, dedupeKey) condition exactly
// once — a later call for the same condition is a silent no-op instead of a
// duplicate row. Returns true if a new notification was actually inserted.
//
// Optional userEmail/subject email the same message on a first-time create.
// This is deliberately fire-and-forget (not awaited) rather than returned as
// a promise the caller awaits: callers that run inside session.withTransaction
// can have this whole function retried on a write conflict, and an awaited
// send here would risk emailing twice for one logical event even though the
// dedupe key keeps the DB itself consistent.
export const createNotificationOnce = async ({ userId, type, message, dedupeKey, session, userEmail, subject }) => {
  try {
    const result = await Notification.findOneAndUpdate(
      { userId, dedupeKey },
      { $setOnInsert: { userId, type, message, dedupeKey, read: false, createdAt: new Date() } },
      { upsert: true, session, setDefaultsOnInsert: true, includeResultMetadata: true }
    );
    const created = Boolean(result.lastErrorObject?.upserted);

    if (created && userEmail) {
      sendEmail({ to: userEmail, subject: subject || "Finance Recorder Alert", text: message });
    }

    return created;
  } catch (error) {
    if (error.code === 11000) return false; // raced another request creating the same alert
    throw error;
  }
};

// Overall monthly-limit check, fired once per threshold crossing per month.
export const checkOverallBudget = async ({ userId, newDebit, monthlyLimit, date, session, userEmail }) => {
  if (!monthlyLimit || monthlyLimit <= 0) return;

  const month = monthKey(date);

  for (const threshold of THRESHOLDS) {
    if (newDebit >= monthlyLimit * threshold) {
      const label = threshold === 1 ? "exceeded" : `reached ${threshold * 100}% of`;
      await createNotificationOnce({
        userId,
        type: "budget_alert",
        message: `You have ${label} your monthly budget of ₹${monthlyLimit}.`,
        dedupeKey: `budget:overall:${month}:${threshold * 100}`,
        session,
        userEmail,
        subject: "Budget alert",
      });
      return;
    }
  }
};

// Per-category budget check. There's no running counter for category spend,
// so this recomputes the category's month-to-date debit total from the
// ledger itself before comparing it against the CategoryBudget limit.
export const checkCategoryBudget = async ({ userId, category, date, session, userEmail }) => {
  const month = monthKey(date);
  const budget = await CategoryBudget.findOne({ userId, category, month }).session(session);
  if (!budget || budget.limit <= 0) return;

  const monthStart = new Date(`${month}-01T00:00:00.000Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const results = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        category,
        type: { $in: ["debit", "withdrawal"] },
        date: { $gte: monthStart, $lt: monthEnd },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).session(session);

  const newTotal = results[0]?.total || 0;

  for (const threshold of THRESHOLDS) {
    if (newTotal >= budget.limit * threshold) {
      const label = threshold === 1 ? "exceeded" : `reached ${threshold * 100}% of`;
      await createNotificationOnce({
        userId,
        type: "budget_alert",
        message: `You have ${label} your "${category}" budget of ₹${budget.limit}.`,
        dedupeKey: `budget:category:${category}:${month}:${threshold * 100}`,
        session,
        userEmail,
        subject: "Category budget alert",
      });
      return;
    }
  }
};

// Heuristic (not ML): flag a debit/withdrawal whose amount is more than 2x
// the trailing-30-day average for that category. Requires a little history
// first so a category's first couple of transactions never trivially "spike".
export const checkUnusualActivity = async ({ userId, transaction, session, userEmail }) => {
  if (transaction.type !== "debit" && transaction.type !== "withdrawal") return;

  const windowStart = new Date(transaction.date);
  windowStart.setDate(windowStart.getDate() - 30);

  const results = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        category: transaction.category,
        type: { $in: ["debit", "withdrawal"] },
        date: { $gte: windowStart, $lt: transaction.date },
      },
    },
    { $group: { _id: null, avg: { $avg: "$amount" }, count: { $sum: 1 } } },
  ]).session(session);

  const { avg = 0, count = 0 } = results[0] || {};
  if (count < 3 || avg <= 0) return;

  if (transaction.amount > avg * 2) {
    await createNotificationOnce({
      userId,
      type: "unusual_activity",
      message: `Unusual spending detected: ₹${transaction.amount} on "${transaction.category}" is more than double your recent average.`,
      dedupeKey: `unusual:${transaction._id}`,
      session,
      userEmail,
      subject: "Unusual activity detected",
    });
  }
};
