import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Flame } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Fixed categorical order (validated for CVD separation) — never cycled or reassigned by rank.
const CATEGORY_COLORS = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];
const MAX_SLICES = CATEGORY_COLORS.length;

function ChartTooltip({ active, payload, formatCurrency }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.payload.fill }} />
        {entry.name}
      </p>
      <p className="text-slate-500 dark:text-slate-400">{formatCurrency(entry.value)}</p>
    </div>
  );
}

// Groups a raw {category -> total} map into the top MAX_SLICES-1 categories, folding
// the remainder into "Other" so a 9th+ category never invents an ungoverned hue.
function buildSlices(categoryTotals) {
  const ranked = Object.entries(categoryTotals)
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length <= MAX_SLICES) {
    return ranked.map(([name, value]) => ({ name, value }));
  }

  const top = ranked.slice(0, MAX_SLICES - 1);
  const rest = ranked.slice(MAX_SLICES - 1);
  const otherTotal = rest.reduce((sum, [, value]) => sum + value, 0);

  return [...top.map(([name, value]) => ({ name, value })), { name: "Other", value: otherTotal }];
}

export default function CategoryBreakdownChart({ categoryTotals, categoryBudgets, formatCurrency }) {
  const slices = buildSlices(categoryTotals || {});
  const hasData = slices.length > 0;
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const { theme } = useTheme();
  // Recharts draws raw SVG — slice separators/legend follow the theme here,
  // matching the card background (white / slate-900).
  const isDark = theme === "dark";
  const sliceStroke = isDark ? "#0f172a" : "#fff";
  const legendColor = isDark ? "#cbd5e1" : "#52514e";

  const budgetedCategories = Object.entries(categoryBudgets || {}).filter(([, limit]) => limit > 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Category Breakdown</h3>
        <Flame size={18} className="text-orange-500" />
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke={sliceStroke}
              strokeWidth={2}
            >
              {slices.map((slice, index) => (
                <Cell key={slice.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} />} />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 12, color: legendColor }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
          No spending yet to break down.
        </div>
      )}

      {hasData && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">
          Total spent: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(total)}</span>
        </p>
      )}

      {budgetedCategories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {budgetedCategories.map(([category, limit]) => {
            const spent = categoryTotals?.[category] || 0;
            const percentage = Math.min(Math.round((spent / limit) * 100), 999);
            const isOver = percentage >= 90;

            return (
              <div key={category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{category}</span>
                  <span className={`font-medium ${isOver ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {formatCurrency(spent)} / {formatCurrency(limit)}
                    {isOver && " ⚠"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
