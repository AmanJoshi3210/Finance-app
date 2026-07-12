import mongoose from "mongoose";
import User from "../Models/User.js";
import Transaction from "../Models/Transactions.js";
import { createNotificationOnce } from "../services/notificationService.js";

// "YYYY-MM-DD" for the Monday of the week containing `date` — used as a
// dedupe key so a scheduler retrigger within the same week is a no-op,
// without the year-boundary edge cases of true ISO week numbering.
const mondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Called from the cron route. Emails each opted-in user a digest of their
// trailing 7 days of activity, deduped per (userId, week) so a scheduler
// retrigger in the same week never sends a duplicate.
export const runWeeklySummaryEmails = async () => {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 7);
  const weekKey = mondayOfWeek(now);

  const users = await User.find({ "notificationPreferences.weeklySummary": { $ne: false } }).select("email _id");
  let sentCount = 0;

  for (const user of users) {
    if (!user.email) continue;

    const userObjectId = new mongoose.Types.ObjectId(user._id);

    const [totals, topCategory] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: userObjectId, date: { $gte: windowStart, $lt: now } } },
        {
          $group: {
            _id: null,
            credit: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } },
            debit: { $sum: { $cond: [{ $in: ["$type", ["debit", "withdrawal"]] }, "$amount", 0] } },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: { $in: ["debit", "withdrawal"] },
            date: { $gte: windowStart, $lt: now },
          },
        },
        { $group: { _id: { $ifNull: ["$category", "Other"] }, total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const { credit = 0, debit = 0 } = totals[0] || {};
    if (credit === 0 && debit === 0) continue; // nothing happened this week, skip the noise

    const topCategoryLine = topCategory[0]
      ? ` Your top spending category was "${topCategory[0]._id}" at ₹${topCategory[0].total}.`
      : "";
    const message = `This week: ₹${credit} in, ₹${debit} out (net ₹${credit - debit}).${topCategoryLine}`;

    const created = await createNotificationOnce({
      userId: user._id,
      type: "weekly_summary",
      message,
      dedupeKey: `weekly:${user._id}:${weekKey}`,
      userEmail: user.email,
      subject: "Your weekly spending summary",
    });

    if (created) sentCount++;
  }

  return sentCount;
};
