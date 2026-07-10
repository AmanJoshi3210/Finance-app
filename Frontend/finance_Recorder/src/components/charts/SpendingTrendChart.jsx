import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const CREDIT_COLOR = "#10b981"; // emerald-500 — matches income styling app-wide
const DEBIT_COLOR = "#f43f5e"; // rose-500 — matches expense styling app-wide

// Recharts draws raw SVG, so grid/tick/legend colors can't follow Tailwind's
// dark: classes — they switch with the theme here instead.
const CHART_COLORS = {
  light: { grid: "#e1e0d9", tick: "#898781", axis: "#c3c2b7", legend: "#52514e", dotStroke: "#fff" },
  dark: { grid: "#334155", tick: "#94a3b8", axis: "#475569", legend: "#cbd5e1", dotStroke: "#0f172a" },
};

const monthLabel = (ym) => {
  const [year, month] = ym.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
};

const compactCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

function ChartTooltip({ active, payload, label, formatCurrency }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{monthLabel(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600 dark:text-slate-300">
            {entry.dataKey === "credit" ? "Income" : "Expense"}: {formatCurrency(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function SpendingTrendChart({ data, formatCurrency }) {
  const hasData = Array.isArray(data) && data.length > 0;
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme] || CHART_COLORS.light;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Spending Trend</h3>
        <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={monthLabel}
              tick={{ fill: colors.tick, fontSize: 12 }}
              axisLine={{ stroke: colors.axis }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={compactCurrency}
              tick={{ fill: colors.tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} />} />
            <Legend
              formatter={(value) => (value === "credit" ? "Income" : "Expense")}
              wrapperStyle={{ fontSize: 13, color: colors.legend }}
            />
            <Line
              type="monotone"
              dataKey="credit"
              stroke={CREDIT_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: CREDIT_COLOR, stroke: colors.dotStroke, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="debit"
              stroke={DEBIT_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: DEBIT_COLOR, stroke: colors.dotStroke, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
          Not enough history yet to chart a trend.
        </div>
      )}
    </div>
  );
}
