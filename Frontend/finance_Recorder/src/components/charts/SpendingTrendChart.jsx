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

const CREDIT_COLOR = "#10b981"; // emerald-500 — matches income styling app-wide
const DEBIT_COLOR = "#f43f5e"; // rose-500 — matches expense styling app-wide

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
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{monthLabel(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600">
            {entry.dataKey === "credit" ? "Income" : "Expense"}: {formatCurrency(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function SpendingTrendChart({ data, formatCurrency }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Spending Trend</h3>
        <TrendingUp size={18} className="text-blue-600" />
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#e1e0d9" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={monthLabel}
              tick={{ fill: "#898781", fontSize: 12 }}
              axisLine={{ stroke: "#c3c2b7" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={compactCurrency}
              tick={{ fill: "#898781", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} />} />
            <Legend
              formatter={(value) => (value === "credit" ? "Income" : "Expense")}
              wrapperStyle={{ fontSize: 13, color: "#52514e" }}
            />
            <Line
              type="monotone"
              dataKey="credit"
              stroke={CREDIT_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: CREDIT_COLOR, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="debit"
              stroke={DEBIT_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: DEBIT_COLOR, stroke: "#fff", strokeWidth: 2 }}
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
