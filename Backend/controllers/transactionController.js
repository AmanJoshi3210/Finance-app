import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Transaction from "../Models/Transactions.js";
import UserData from "../Models/UserData.js";
import User from "../Models/User.js";
import MonthlySummary from "../Models/MonthlySummary.js";
import Account from "../Models/Account.js";
import { checkOverallBudget, checkCategoryBudget, checkUnusualActivity } from "../services/notificationService.js";

// Minimum months of MonthlySummary history before trusting a trend line over
// a same-month pace projection — matches the threshold the old (removed)
// TensorFlow prototype used, which independently arrived at the same number.
const FORECAST_TREND_MIN_MONTHS = 3;

// Ordinary least squares over (0, y0), (1, y1), ... — projects one step past
// the last known point. Clamped at 0 by the caller, same defensive floor
// applyUserDataDelta already uses for running totals.
const linearForecastNext = (values) => {
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  return slope * n + intercept; // predict at x = n (one past the last index, n-1)
};

// Applies a delta to UserData's running totals inside the caller's
// transaction, clamping each total at 0 with an aggregation-pipeline update
// so a delete/edit reversal can never drive it negative (e.g. totals drifted
// out of sync with the ledger, or two edits race on the same transaction).
// Returns the updated document so callers can react to the new totals (e.g.
// budget-threshold notifications) without a second round-trip.
const applyUserDataDelta = async (userId, { creditDelta = 0, debitDelta = 0 }, session) => {
  if (!creditDelta && !debitDelta) return UserData.findOne({ userId }).session(session);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  return UserData.findOneAndUpdate(
    { userId: userObjectId },
    [
      {
        $set: {
          userId: userObjectId,
          monthlyLimit: { $ifNull: ["$monthlyLimit", 0] },
          totalCredit: {
            $max: [{ $add: [{ $ifNull: ["$totalCredit", 0] }, creditDelta] }, 0],
          },
          totalDebit: {
            $max: [{ $add: [{ $ifNull: ["$totalDebit", 0] }, debitDelta] }, 0],
          },
          updatedAt: "$$NOW",
        },
      },
    ],
    { upsert: true, new: true, session }
  );
};

// Runs the real-time notification checks (overall/category budget thresholds,
// unusual-activity heuristic) for a debit/withdrawal, gated by the user's
// notification preferences. Shared by add and update so both paths behave
// identically.
const runNotificationChecks = async ({ userId, category, date, transaction, newDebit, monthlyLimit, session }) => {
  const user = await User.findById(userId).select("notificationPreferences email").session(session);
  const prefs = user?.notificationPreferences || {};
  const userEmail = user?.email;

  if (prefs.budgetAlerts !== false) {
    await checkOverallBudget({ userId, newDebit, monthlyLimit, date, session, userEmail });
    await checkCategoryBudget({ userId, category, date, session, userEmail });
  }

  if (prefs.unusualActivity) {
    await checkUnusualActivity({ userId, transaction, session, userEmail });
  }
};

// Lowercased/trimmed/deduped so tag filtering can stay a simple $in match
// instead of per-tag regex.
const normalizeTags = (tags) =>
  Array.isArray(tags)
    ? [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))]
    : [];

// Same lazy self-healing idiom used elsewhere in this codebase (e.g. the
// recurring-bill due-date rollforward): find the user's default account, or
// create one on first use. This is what lets every transaction-creating call
// site keep working unchanged now that accounts exist.
export const getOrCreateDefaultAccount = async (userId, session) => {
  let account = await Account.findOne({ userId, isDefault: true, archived: false }).session(session);
  if (!account) {
    [account] = await Account.create(
      [{ userId, name: "General", type: "other", openingBalance: 0, balance: 0, isDefault: true }],
      { session }
    );
  }
  return account;
};

// Resolves a caller-supplied accountId (must belong to the user and not be
// archived) or falls back to `fallbackAccountId` resolution — used by both
// "create" (fallback = default account) and "update" (fallback = the
// transaction's existing account, itself defaulting if it had none).
const resolveAccount = async (userId, accountId, session) => {
  if (accountId) {
    const account = await Account.findOne({ _id: accountId, userId, archived: false }).session(session);
    if (account) return account;
  }
  return getOrCreateDefaultAccount(userId, session);
};

// Plain atomic increment — deliberately NOT clamped at 0 like
// applyUserDataDelta's totals. An account balance is a single signed running
// total that must legitimately go negative (an overdrawn account, money owed
// on a credit card); clamping here would silently break debt tracking.
const applyAccountBalanceDelta = async (accountId, signedDelta, session) => {
  if (!accountId || !signedDelta) return;
  await Account.findOneAndUpdate({ _id: accountId }, { $inc: { balance: signedDelta } }, { session });
};

// Shared by the HTTP add-transaction handler and the recurring-transaction
// job, so both paths create a transaction and update UserData totals
// identically instead of duplicating the logic.
export const createTransactionRecord = async (userId, { type, method, category, amount, description, tags, accountId }, session) => {
  const numericAmount = Number(amount);
  const account = await resolveAccount(userId, accountId, session);

  const [transaction] = await Transaction.create(
    [{ userId, type, method, category, amount: numericAmount, description, tags: normalizeTags(tags), accountId: account._id }],
    { session }
  );

  const creditDelta = type === "credit" ? numericAmount : 0;
  const debitDelta = type === "debit" || type === "withdrawal" ? numericAmount : 0;
  const signedDelta = type === "credit" ? numericAmount : -numericAmount;

  const userData = await applyUserDataDelta(userId, { creditDelta, debitDelta }, session);
  await applyAccountBalanceDelta(account._id, signedDelta, session);

  if (debitDelta > 0) {
    await runNotificationChecks({
      userId,
      category,
      date: transaction.date,
      transaction,
      newDebit: userData.totalDebit,
      monthlyLimit: userData.monthlyLimit,
      session,
    });
  }

  return transaction;
};

export const addTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const userId = req.user.userId;
    const { type, method, category, amount, description, tags, accountId } = req.body;

    let transaction;
    await session.withTransaction(async () => {
      // Atomically increment the matching total so this can't be lost to a
      // race or interrupted mid-write (a stale read-modify-save previously
      // let one field's update silently disappear under concurrent requests).
      transaction = await createTransactionRecord(userId, { type, method, category, amount, description, tags, accountId }, session);
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Add Transaction Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};


// 🔁 Update a transaction
export const updateTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { type, method, category, amount, description, tags, accountId } = req.body;
    const numericAmount = Number(amount);

    let transaction;
    let notFound = false;

    await session.withTransaction(async () => {
      const existingTransaction = await Transaction.findOne({ _id: id, userId }).session(session);

      if (!existingTransaction) {
        notFound = true;
        return;
      }

      // Net delta: reverse the old contribution, apply the new one, in one atomic update.
      const creditDelta =
        (type === "credit" ? numericAmount : 0) -
        (existingTransaction.type === "credit" ? existingTransaction.amount : 0);
      const debitDelta =
        (type === "debit" || type === "withdrawal" ? numericAmount : 0) -
        (existingTransaction.type === "debit" || existingTransaction.type === "withdrawal"
          ? existingTransaction.amount
          : 0);

      const userData = await applyUserDataDelta(userId, { creditDelta, debitDelta }, session);

      // Account balance: if accountId wasn't sent, keep the existing account
      // (or self-heal onto the default one if this transaction predates
      // accounts) rather than defaulting away from an explicitly-set account.
      const oldAccountId = existingTransaction.accountId ? String(existingTransaction.accountId) : null;
      const targetAccountId = accountId !== undefined ? accountId : existingTransaction.accountId;
      const newAccount = await resolveAccount(userId, targetAccountId, session);
      const newAccountId = String(newAccount._id);

      const oldSigned = existingTransaction.type === "credit" ? existingTransaction.amount : -existingTransaction.amount;
      const newSigned = type === "credit" ? numericAmount : -numericAmount;

      if (oldAccountId === newAccountId) {
        await applyAccountBalanceDelta(newAccount._id, newSigned - oldSigned, session);
      } else {
        if (oldAccountId) {
          await applyAccountBalanceDelta(oldAccountId, -oldSigned, session);
        }
        await applyAccountBalanceDelta(newAccount._id, newSigned, session);
      }

      existingTransaction.type = type;
      existingTransaction.method = method;
      existingTransaction.category = category;
      existingTransaction.amount = numericAmount;
      existingTransaction.description = description;
      existingTransaction.tags = normalizeTags(tags);
      existingTransaction.accountId = newAccount._id;
      await existingTransaction.save({ session });

      if (type === "debit" || type === "withdrawal") {
        await runNotificationChecks({
          userId,
          category,
          date: existingTransaction.date,
          transaction: existingTransaction,
          newDebit: userData.totalDebit,
          monthlyLimit: userData.monthlyLimit,
          session,
        });
      }

      transaction = existingTransaction;
    });

    if (notFound) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Update Transaction Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

// 🗑️ Delete a transaction
export const deleteTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    let notFound = false;

    await session.withTransaction(async () => {
      const transaction = await Transaction.findOneAndDelete({ _id: id, userId }).session(session);

      if (!transaction) {
        notFound = true;
        return;
      }

      const creditDelta = transaction.type === "credit" ? -transaction.amount : 0;
      const debitDelta =
        transaction.type === "debit" || transaction.type === "withdrawal" ? -transaction.amount : 0;

      await applyUserDataDelta(userId, { creditDelta, debitDelta }, session);

      // Only reverse if this transaction actually had an account — a legacy
      // transaction with none never contributed to any account's balance.
      if (transaction.accountId) {
        const signedAmount = transaction.type === "credit" ? transaction.amount : -transaction.amount;
        await applyAccountBalanceDelta(transaction.accountId, -signedAmount, session);
      }
    });

    if (notFound) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

// Builds the Mongo filter for a user's transaction list. Shared by the
// paginated list view and the CSV/Excel export so both honor the same
// type/search/date-range/tags query params.
const buildTransactionFilter = (userId, { type, search, from, to, tags, accountId } = {}) => {
  const filter = { userId };
  if (type && type !== "all") {
    filter.type = type;
  }
  if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
    filter.accountId = accountId;
  }
  if (search && search.trim()) {
    // Escape regex metacharacters so user input can't break/DoS the pattern
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    // A regex condition against an array field (tags) matches if any element matches.
    filter.$or = [{ category: regex }, { description: regex }, { method: regex }, { tags: regex }];
  }

  // Optional tag filter: comma-separated list, OR semantics (matches any
  // listed tag) — suits a checkbox-style filter UI. Tags are stored
  // lowercased/trimmed, so normalize the same way here.
  if (tags && tags.trim()) {
    const tagList = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (tagList.length > 0) filter.tags = { $in: tagList };
  }

  // Optional date range: `from`/`to` as YYYY-MM-DD. `to` is inclusive of the
  // whole day, so the range covers [from 00:00, to 24:00). Invalid dates are
  // ignored rather than erroring, matching how the other params behave.
  const dateFilter = {};
  if (from) {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    if (!Number.isNaN(fromDate.getTime())) dateFilter.$gte = fromDate;
  }
  if (to) {
    const toDate = new Date(`${to}T00:00:00.000Z`);
    if (!Number.isNaN(toDate.getTime())) {
      toDate.setUTCDate(toDate.getUTCDate() + 1);
      dateFilter.$lt = toDate;
    }
  }
  if (Object.keys(dateFilter).length > 0) {
    filter.date = dateFilter;
  }

  return filter;
};

// 📄 Get a page of transactions for a user (filterable by type/search)
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const filter = buildTransactionFilter(userId, req.query);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Quotes a CSV field per RFC 4180 (embedded quotes doubled) so commas,
// quotes, and newlines in user data can't break the row structure.
const csvField = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// 📤 Download the user's transactions as a CSV attachment. Accepts the same
// type/search params as the list view so the export matches what's on screen.
export const exportTransactionsCsv = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filter = buildTransactionFilter(userId, req.query);

    const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();

    const header = ["Date", "Type", "Category", "Method", "Amount", "Description", "Tags"];
    const rows = transactions.map((t) =>
      [
        t.date ? new Date(t.date).toISOString() : "",
        t.type,
        t.category || "",
        t.method || "",
        t.amount,
        t.description || "",
        (t.tags || []).join("; "),
      ]
        .map(csvField)
        .join(",")
    );

    const csv = [header.join(","), ...rows].join("\r\n");
    const filename = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export Transactions Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📤 Download the user's transactions as an Excel (.xlsx) attachment — same
// filter params and row set as the CSV export, generated server-side (rather
// than from whatever page happens to be loaded client-side) so the export
// always covers the full filtered dataset, not just one paginated screen.
export const exportTransactionsXlsx = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filter = buildTransactionFilter(userId, req.query);

    const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Transactions");

    sheet.columns = [
      { header: "Date", key: "date", width: 22 },
      { header: "Type", key: "type", width: 12 },
      { header: "Category", key: "category", width: 18 },
      { header: "Method", key: "method", width: 14 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Description", key: "description", width: 32 },
      { header: "Tags", key: "tags", width: 24 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const t of transactions) {
      sheet.addRow({
        date: t.date ? new Date(t.date).toISOString() : "",
        type: t.type,
        category: t.category || "",
        method: t.method || "",
        amount: t.amount,
        description: t.description || "",
        tags: (t.tags || []).join(", "),
      });
    }
    sheet.getColumn("amount").numFmt = "#,##0.00";

    const filename = `transactions-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Transactions Xlsx Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Matches the client-side chunk size in ImportTransactions.jsx, with headroom.
const BULK_MAX_ROWS = 500;

// 📥 Bulk-insert imported transactions (CSV import). Validates every row up
// front (all-or-nothing, so a partial batch can't leave totals half-applied),
// inserts in one insertMany, and applies the summed credit/debit delta to
// UserData once at the end instead of per-row. Deliberately skips the
// real-time notification checks: imports are historical data and would fire
// spurious budget/unusual-activity alerts.
export const bulkAddTransactions = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.userId;
    const rows = req.body?.transactions;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "transactions must be a non-empty array" });
    }
    if (rows.length > BULK_MAX_ROWS) {
      return res.status(400).json({ message: `Too many rows; send at most ${BULK_MAX_ROWS} per request` });
    }

    const docs = [];
    for (let i = 0; i < rows.length; i++) {
      const { type, method, category, amount, description, date } = rows[i] || {};

      if (!["credit", "debit", "withdrawal"].includes(type)) {
        return res.status(400).json({ message: `Row ${i + 1}: invalid type "${type}"` });
      }

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: `Row ${i + 1}: amount must be a positive number` });
      }

      let parsedDate;
      if (date !== undefined && date !== null && date !== "") {
        parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: `Row ${i + 1}: invalid date "${date}"` });
        }
      }

      docs.push({
        userId,
        type,
        method: method || "Other",
        category: category || "Other",
        amount: numericAmount,
        description: typeof description === "string" ? description : "",
        ...(parsedDate ? { date: parsedDate } : {}),
      });
    }

    const creditDelta = docs.reduce((sum, d) => sum + (d.type === "credit" ? d.amount : 0), 0);
    const debitDelta = docs.reduce((sum, d) => sum + (d.type === "credit" ? 0 : d.amount), 0);
    // No per-row account mapping in the import UI — the whole batch lands on
    // one account, resolved once rather than per row.
    const accountSignedTotal = docs.reduce((sum, d) => sum + (d.type === "credit" ? d.amount : -d.amount), 0);

    let inserted = 0;
    await session.withTransaction(async () => {
      const account = await getOrCreateDefaultAccount(userId, session);
      for (const doc of docs) doc.accountId = account._id;

      const created = await Transaction.insertMany(docs, { session });
      inserted = created.length;
      await applyUserDataDelta(userId, { creditDelta, debitDelta }, session);
      await applyAccountBalanceDelta(account._id, accountSignedTotal, session);
    });

    res.status(201).json({ inserted });
  } catch (error) {
    console.error("Bulk Add Transactions Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

// 📄 Get only the most recent N transactions (lightweight, for dashboard preview)
export const getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(limit);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📈 Get credit/debit totals grouped by month, for the spending trend chart
export const getMonthlyTrend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const trend = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          credit: {
            $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] },
          },
          debit: {
            $sum: {
              $cond: [{ $in: ["$type", ["debit", "withdrawal"]] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id",
          credit: 1,
          debit: 1,
        },
      },
    ]);

    res.json(trend);
  } catch (error) {
    console.error("Error fetching monthly trend:", error);
    res.status(500).json({ message: "Server error fetching monthly trend" });
  }
};

// 💡 Spending insights for the dashboard: current vs previous month totals,
// month-over-month change, top spending category, and average daily spend.
// Computed from the ledger with UTC month boundaries, matching the month
// convention used by the budget checks in notificationService.
export const getSpendingInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [monthTotals, topCategories] = await Promise.all([
      // credit/debit totals for the current and previous month in one pass
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            date: { $gte: previousMonthStart, $lt: nextMonthStart },
          },
        },
        {
          $group: {
            _id: {
              month: {
                $cond: [{ $gte: ["$date", currentMonthStart] }, "current", "previous"],
              },
            },
            credit: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } },
            debit: {
              $sum: { $cond: [{ $in: ["$type", ["debit", "withdrawal"]] }, "$amount", 0] },
            },
          },
        },
      ]),
      // top debit category of the current month
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: { $in: ["debit", "withdrawal"] },
            date: { $gte: currentMonthStart, $lt: nextMonthStart },
          },
        },
        { $group: { _id: { $ifNull: ["$category", "Other"] }, total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const totalsByMonth = { current: { credit: 0, debit: 0 }, previous: { credit: 0, debit: 0 } };
    for (const row of monthTotals) {
      totalsByMonth[row._id.month] = { credit: row.credit, debit: row.debit };
    }

    const { current, previous } = totalsByMonth;
    const changePct =
      previous.debit > 0
        ? Math.round(((current.debit - previous.debit) / previous.debit) * 100)
        : null;

    const daysElapsed = now.getUTCDate();
    const avgDailySpend = daysElapsed > 0 ? current.debit / daysElapsed : 0;

    // Next-month spend forecast: a real trend line once there's enough
    // history, falling back to a pace-based projection of the current month
    // otherwise. monthsOfHistory is surfaced so the frontend can label which
    // method produced the number instead of presenting a guess as certain.
    const history = await MonthlySummary.find({ userId }).sort({ month: 1 }).lean();
    let forecast;
    if (history.length >= FORECAST_TREND_MIN_MONTHS) {
      const projected = linearForecastNext(history.map((h) => h.totalDebit));
      forecast = {
        method: "trend",
        projectedSpend: Math.max(projected, 0),
        monthsOfHistory: history.length,
      };
    } else {
      const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
      forecast = {
        method: "pace",
        projectedSpend: avgDailySpend * daysInMonth,
        monthsOfHistory: history.length,
      };
    }

    res.json({
      currentMonth: current,
      previousMonth: previous,
      changePct,
      topCategory: topCategories[0]
        ? { name: topCategories[0]._id, amount: topCategories[0].total }
        : null,
      avgDailySpend,
      forecast,
    });
  } catch (error) {
    console.error("Spending Insights Error:", error);
    res.status(500).json({ message: "Server error fetching spending insights" });
  }
};

export const addOrUpdateMonthlyLimit = async (req, res) => {
  try {
    const { monthlyLimit } = req.body;
    const userId = req.user?.userId; 

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: userId missing from token" });
    }

    if (!monthlyLimit || monthlyLimit < 0) {
      return res.status(400).json({ message: "Please provide a valid monthly limit" });
    }

    const userData = await UserData.findOneAndUpdate(
      { userId },
      { $set: { monthlyLimit, updatedAt: Date.now() }, $setOnInsert: { userId } },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );

    res.status(200).json({
      message: "Monthly limit updated successfully",
      monthlyLimit: userData.monthlyLimit,
    });
  } catch (error) {
    console.error("Error updating monthly limit:", error);
    res.status(500).json({ message: "Server error while updating monthly limit" });
  }
};

// Distinct categories the user has actually used, for suggesting per-category
// budget rows in Settings without inventing a separate category-list source.
export const getUserCategories = async (req, res) => {
  try {
    const userId = req.user.userId;
    const categories = await Transaction.distinct("category", { userId });
    res.json(categories.filter(Boolean));
  } catch (error) {
    console.error("Get User Categories Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Distinct tags the user has actually used, for powering a tag-filter
// checklist instead of requiring free-text entry.
export const getUserTags = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tags = await Transaction.distinct("tags", { userId });
    res.json(tags.filter(Boolean).sort());
  } catch (error) {
    console.error("Get User Tags Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyLimit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userData = await UserData.findOne({ userId });

    if (!userData) {
      return res.status(200).json({ monthlyLimit: 0 });
    }

    res.status(200).json({ monthlyLimit: userData.monthlyLimit });
  } catch (error) {
    console.error("Error fetching monthly limit:", error);
    res.status(500).json({ message: "Server error fetching monthly limit" });
  }
};

