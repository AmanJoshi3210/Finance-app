import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import SpendingTrendChart from "../components/charts/SpendingTrendChart";
import CategoryBreakdownChart from "../components/charts/CategoryBreakdownChart";
import { Loader2, CalendarRange } from "lucide-react";

const MAX_PAGES = 10; // safety cap: 10 x 100 expenses per month

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// Returns { from, to } as YYYY-MM-DD for the given YYYY-MM (to = last day).
const monthRange = (ym) => {
  const [year, month] = ym.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { from: `${ym}-01`, to: `${ym}-${String(lastDay).padStart(2, "0")}` };
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export default function MonthlyTracker() {
  const [month, setMonth] = useState(currentMonth);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Trend and budgets are month-independent — load once.
  useEffect(() => {
    const loadStatic = async () => {
      const [trendRes, budgetsRes] = await Promise.allSettled([
        axiosInstance.get("/api/transactions/monthly-trend"),
        axiosInstance.get("/api/category-budgets"),
      ]);
      if (trendRes.status === "fulfilled") setMonthlyTrend(trendRes.value.data);
      if (budgetsRes.status === "fulfilled") {
        setCategoryBudgets(
          budgetsRes.value.data.reduce((acc, b) => ({ ...acc, [b.category]: b.limit }), {})
        );
      }
    };
    loadStatic();
  }, []);

  // Category breakdown follows the selected month.
  useEffect(() => {
    if (!month) return;
    let cancelled = false;

    const loadMonth = async () => {
      setLoading(true);
      setError("");
      try {
        const { from, to } = monthRange(month);
        const totals = {};
        let page = 1;
        let totalPages = 1;
        do {
          const { data } = await axiosInstance.get("/api/transactions", {
            params: { page, limit: 100, type: "debit", from, to },
          });
          (data.transactions || []).forEach((t) => {
            const key = t.category || "Other";
            totals[key] = (totals[key] || 0) + Number(t.amount || 0);
          });
          totalPages = data.totalPages || 1;
          page += 1;
        } while (page <= totalPages && page <= MAX_PAGES);

        if (!cancelled) setCategoryTotals(totals);
      } catch (err) {
        console.error("Monthly tracker fetch error:", err.response || err.message);
        if (!cancelled) setError("Could not load this month's data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMonth();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const monthTotal = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarRange size={24} className="text-blue-600 dark:text-blue-400" />
            Monthly Tracker
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track spending over time and see where a month's money went.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="tracker-month" className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Month
          </label>
          <input
            id="tracker-month"
            type="month"
            value={month}
            max={currentMonth()}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrendChart data={monthlyTrend} formatCurrency={formatCurrency} />
        {loading ? (
          <div className="flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : (
          <CategoryBreakdownChart
            categoryTotals={categoryTotals}
            categoryBudgets={categoryBudgets}
            formatCurrency={formatCurrency}
          />
        )}
      </div>

      {!loading && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Total spent in selected month: <span className="font-semibold">{formatCurrency(monthTotal)}</span>
        </p>
      )}
    </div>
  );
}
