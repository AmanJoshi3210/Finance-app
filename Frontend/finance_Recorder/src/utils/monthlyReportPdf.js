// src/utils/monthlyReportPdf.js
// Client-side monthly report PDF, built with jsPDF from the data the
// Previous Months Summary page already fetches (monthly summaries + trend).
import { jsPDF } from "jspdf";

// Series colors match the app's charts (emerald income / rose expense).
// Pair validated for colorblind separation on a white surface; the emerald
// fill is low-contrast against white, which is acceptable here only because
// the table below the chart carries the exact values.
const INCOME_RGB = [16, 185, 129];
const EXPENSE_RGB = [244, 63, 94];
const INK = [30, 41, 59]; // slate-800 — primary text
const MUTED = [100, 116, 139]; // slate-500 — secondary text
const GRID = [226, 232, 240]; // slate-200 — recessive gridlines
const BASELINE = [203, 213, 225]; // slate-300 — chart baseline
const BRAND = [37, 99, 235]; // blue-600 — FinTrack logo color

const PAGE = { width: 595.28, height: 841.89, margin: 48 }; // A4 portrait, pt

// jsPDF's built-in Helvetica has no ₹ glyph, so amounts use an "Rs" prefix.
const formatAmount = (value) =>
  `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0)}`;

// Indian-style compact axis labels (K / L / Cr).
const formatCompact = (value) => {
  if (value >= 1e7) return `${+(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `${+(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `${+(value / 1e3).toFixed(1)}K`;
  return String(Math.round(value));
};

const monthDate = (ym) => {
  const [year, month] = ym.split("-");
  return new Date(Number(year), Number(month) - 1, 1);
};

const monthLong = (ym) =>
  monthDate(ym).toLocaleDateString("en-IN", { year: "numeric", month: "long" });

const monthShort = (ym) =>
  monthDate(ym).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

// Round the axis max up to a 1/2/5 × 10^n "nice" number so gridline labels are round.
const niceMax = (value) => {
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
};

// Bar with a rounded top and a square bottom (rounded rect, then square off
// the bottom corners), so bars sit flush on the baseline.
const drawBar = (doc, x, y, w, h, rgb) => {
  if (h <= 0.1) return;
  doc.setFillColor(...rgb);
  const r = Math.min(2, w / 2, h / 2);
  doc.roundedRect(x, y, w, h, r, r, "F");
  if (h > r) doc.rect(x, y + h - r, w, r, "F");
};

// Grouped income/expense bars for the last 6 months. Returns the y where
// content below the chart should continue.
const drawTrendChart = (doc, trend, x, y, width) => {
  const data = trend.slice(-6);
  const plotHeight = 160;
  const axisWidth = 44; // room for y tick labels
  const plotX = x + axisWidth;
  const plotWidth = width - axisWidth;

  // Legend (2 series → always shown), in muted ink with color swatches.
  const legendY = y;
  let lx = plotX;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  [
    ["Income", INCOME_RGB],
    ["Expense", EXPENSE_RGB],
  ].forEach(([label, rgb]) => {
    doc.setFillColor(...rgb);
    doc.roundedRect(lx, legendY - 7, 8, 8, 2, 2, "F");
    doc.setTextColor(...MUTED);
    doc.text(label, lx + 12, legendY);
    lx += 12 + doc.getTextWidth(label) + 16;
  });

  const plotTop = y + 14;
  const baselineY = plotTop + plotHeight;
  const max = niceMax(Math.max(...data.flatMap((d) => [d.credit || 0, d.debit || 0]), 1));

  // Recessive horizontal gridlines with compact tick labels.
  const steps = 4;
  doc.setLineWidth(0.5);
  for (let i = 0; i <= steps; i++) {
    const value = (max / steps) * i;
    const gy = baselineY - (plotHeight * i) / steps;
    doc.setDrawColor(...(i === 0 ? BASELINE : GRID));
    doc.line(plotX, gy, plotX + plotWidth, gy);
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(formatCompact(value), plotX - 6, gy + 2.5, { align: "right" });
  }

  // Grouped bars: thin marks, 2pt surface gap inside each pair.
  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(16, groupWidth * 0.26);
  const pairGap = 2;

  data.forEach((d, i) => {
    const centerX = plotX + groupWidth * i + groupWidth / 2;
    const creditH = (plotHeight * (d.credit || 0)) / max;
    const debitH = (plotHeight * (d.debit || 0)) / max;

    drawBar(doc, centerX - barWidth - pairGap / 2, baselineY - creditH, barWidth, creditH, INCOME_RGB);
    drawBar(doc, centerX + pairGap / 2, baselineY - debitH, barWidth, debitH, EXPENSE_RGB);

    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text(monthShort(d.month), centerX, baselineY + 14, { align: "center" });
  });

  return baselineY + 32;
};

const TABLE_COLUMNS = [
  { header: "Month", width: 130, align: "left" },
  { header: "Income", width: 100, align: "right" },
  { header: "Expense", width: 100, align: "right" },
  { header: "Limit", width: 90, align: "right" },
  { header: "Status", width: 79, align: "right" },
];

const drawTableHeader = (doc, x, y, width) => {
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(x, y, width, 22, "F");
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.5);
  doc.line(x, y + 22, x + width, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);

  let colX = x;
  TABLE_COLUMNS.forEach((col) => {
    const tx = col.align === "right" ? colX + col.width - 10 : colX + 10;
    doc.text(col.header.toUpperCase(), tx, y + 14, { align: col.align });
    colX += col.width;
  });

  return y + 22;
};

const drawTable = (doc, summaries, x, startY, width) => {
  const rowHeight = 24;
  const bottomLimit = PAGE.height - PAGE.margin - 30;
  let y = drawTableHeader(doc, x, startY, width);

  const cell = (text, colIndex, rowY, { bold = false, color = INK } = {}) => {
    const colX = x + TABLE_COLUMNS.slice(0, colIndex).reduce((s, c) => s + c.width, 0);
    const col = TABLE_COLUMNS[colIndex];
    const tx = col.align === "right" ? colX + col.width - 10 : colX + 10;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...color);
    doc.text(text, tx, rowY + 15.5, { align: col.align });
  };

  summaries.forEach((s) => {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = drawTableHeader(doc, x, PAGE.margin, width);
    }

    const hasLimit = s.monthlyLimit > 0;
    const overLimit = hasLimit && s.totalDebit > s.monthlyLimit;

    cell(monthLong(s.month), 0, y, { bold: true });
    cell(formatAmount(s.totalCredit), 1, y);
    cell(formatAmount(s.totalDebit), 2, y);
    cell(hasLimit ? formatAmount(s.monthlyLimit) : "—", 3, y, { color: MUTED });
    if (hasLimit) {
      cell(overLimit ? "Over limit" : "Under limit", 4, y, {
        bold: true,
        color: overLimit ? [220, 38, 38] : [5, 150, 105],
      });
    } else {
      cell("No limit", 4, y, { color: MUTED });
    }

    doc.setDrawColor(241, 245, 249); // slate-100 row divider
    doc.setLineWidth(0.5);
    doc.line(x, y + rowHeight, x + width, y + rowHeight);
    y += rowHeight;
  });

  // Totals row across all listed months.
  if (y + rowHeight > bottomLimit) {
    doc.addPage();
    y = PAGE.margin;
  }
  const totalCredit = summaries.reduce((sum, s) => sum + (s.totalCredit || 0), 0);
  const totalDebit = summaries.reduce((sum, s) => sum + (s.totalDebit || 0), 0);
  cell("Total", 0, y, { bold: true });
  cell(formatAmount(totalCredit), 1, y, { bold: true });
  cell(formatAmount(totalDebit), 2, y, { bold: true });

  return y + rowHeight;
};

const sectionTitle = (doc, text, x, y) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(text, x, y);
  return y + 16;
};

export default function generateMonthlyReportPdf({ summaries, trend }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const x = PAGE.margin;
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const generatedOn = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.text("FinTrack", x, PAGE.margin + 8);

  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text("Monthly Financial Report", x, PAGE.margin + 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Generated on ${generatedOn}`, x, PAGE.margin + 44);

  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.75);
  doc.line(x, PAGE.margin + 54, x + contentWidth, PAGE.margin + 54);

  let y = PAGE.margin + 80;

  // Trend chart (skipped gracefully if there's no trend history yet)
  if (Array.isArray(trend) && trend.length > 0) {
    y = sectionTitle(doc, "Income vs Expense — last 6 months", x, y);
    y = drawTrendChart(doc, trend, x, y + 6, contentWidth);
    y += 16;
  }

  // Summary table
  y = sectionTitle(doc, "Monthly history", x, y);
  drawTable(doc, summaries, x, y + 2, contentWidth);

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Generated by FinTrack", x, PAGE.height - 24);
    doc.text(`Page ${i} of ${pageCount}`, x + contentWidth, PAGE.height - 24, { align: "right" });
  }

  doc.save(`fintrack-monthly-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
