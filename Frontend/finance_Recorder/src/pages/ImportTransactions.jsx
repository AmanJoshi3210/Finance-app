// src/pages/ImportTransactions.jsx
import React, { useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Papa from "papaparse";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";

// Server caps a bulk request at 500 rows; stay well under that (and under the
// default express.json body limit) by sending the import in chunks.
const CHUNK_SIZE = 200;

// App fields a CSV column can be mapped onto. Amount is the only hard
// requirement; everything else has a sensible default server-side.
const FIELDS = [
  { key: "amount", label: "Amount", required: true },
  { key: "date", label: "Date", required: false },
  { key: "category", label: "Category", required: false },
  { key: "method", label: "Method", required: false },
  { key: "description", label: "Description", required: false },
];

// Common ways bank exports spell the transaction type.
const TYPE_ALIASES = {
  credit: "credit",
  cr: "credit",
  deposit: "credit",
  income: "credit",
  in: "credit",
  debit: "debit",
  dr: "debit",
  expense: "debit",
  out: "debit",
  payment: "debit",
  withdrawal: "withdrawal",
  withdraw: "withdrawal",
  atm: "withdrawal",
};

// Best-effort guess of which CSV column belongs to which app field, so most
// users only have to confirm the mapping instead of building it from scratch.
const guessMapping = (columns) => {
  const find = (...candidates) =>
    columns.find((col) => {
      const normalized = col.toLowerCase().replace(/[^a-z]/g, "");
      return candidates.some((c) => normalized.includes(c));
    }) || "";

  return {
    amount: find("amount", "amt", "value"),
    date: find("date", "txntime", "time"),
    type: find("type", "drcr", "crdr"),
    category: find("category"),
    method: find("method", "mode", "paymode", "channel"),
    description: find("description", "narration", "particulars", "details", "remarks", "note"),
  };
};

// Strip currency symbols / thousands separators so "₹1,234.50" parses.
const parseAmount = (value) => {
  const cleaned = String(value ?? "").replace(/[^0-9.+-]/g, "");
  if (!cleaned) return NaN;
  return Number(cleaned);
};

// Strict day/month/year parse in the user-selected order, validated against a
// real calendar date so "31/02/2024" doesn't silently roll over.
const parseDateParts = (value, order) => {
  const parts = String(value).trim().split(/[/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return null;

  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;

  let day, month, year;
  if (order === "dmy") [day, month, year] = nums;
  else if (order === "mdy") [month, day, year] = nums;
  else [year, month, day] = nums;

  if (year < 100) year += 2000;
  const d = new Date(year, month - 1, day);
  const valid = d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  return valid ? d : null;
};

// Try the selected format first, then fall back to the native parser so ISO
// timestamps (e.g. re-importing our own CSV export) still work.
const parseDate = (value, order) => {
  const fromParts = parseDateParts(value, order);
  if (fromParts) return fromParts;
  const native = new Date(value);
  return Number.isNaN(native.getTime()) ? null : native;
};

const resolveType = (row, mapping, typeMode, amount) => {
  if (typeMode === "credit" || typeMode === "debit") return typeMode;
  if (typeMode === "sign") {
    if (amount > 0) return "credit";
    if (amount < 0) return "debit";
    return null;
  }
  // typeMode === "column"
  const raw = String(row[mapping.type] ?? "").trim().toLowerCase();
  return TYPE_ALIASES[raw] || null;
};

export default function ImportTransactions() {
  const [step, setStep] = useState("upload"); // upload → map → done
  const [fileName, setFileName] = useState("");
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [mapping, setMapping] = useState({});
  const [typeMode, setTypeMode] = useState("sign");
  const [dateOrder, setDateOrder] = useState("dmy");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [importError, setImportError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (file) => {
    if (!file) return;
    setParseError("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: ({ data, meta }) => {
        const cols = (meta.fields || []).filter(Boolean);
        if (!cols.length || !data.length) {
          setParseError("Couldn't find any data rows in that file. Is it a CSV with a header row?");
          return;
        }

        const guessed = guessMapping(cols);
        setFileName(file.name);
        setColumns(cols);
        setRows(data);
        setMapping(guessed);
        setTypeMode(guessed.type ? "column" : "sign");
        setResult(null);
        setImportError("");
        setStep("map");
      },
      error: (err) => {
        console.error(err);
        setParseError("Could not read that file. Please try a different CSV.");
      },
    });
  };

  // Normalize every parsed row through the current mapping. Recomputed live so
  // the preview and valid/skipped counts react to mapping changes.
  const normalized = useMemo(() => {
    if (step !== "map") return { valid: [], invalid: [] };

    const valid = [];
    const invalid = [];

    rows.forEach((row, index) => {
      const reject = (reason) => invalid.push({ index: index + 1, reason });

      const rawAmount = parseAmount(row[mapping.amount]);
      if (!Number.isFinite(rawAmount) || rawAmount === 0) {
        return reject(`invalid amount "${row[mapping.amount] ?? ""}"`);
      }

      const type = resolveType(row, mapping, typeMode, rawAmount);
      if (!type) {
        return reject(
          typeMode === "column"
            ? `unrecognized type "${row[mapping.type] ?? ""}"`
            : "could not determine type"
        );
      }

      let date;
      if (mapping.date) {
        const parsed = parseDate(row[mapping.date], dateOrder);
        if (!parsed) return reject(`invalid date "${row[mapping.date] ?? ""}"`);
        date = parsed.toISOString();
      }

      valid.push({
        type,
        amount: Math.abs(rawAmount),
        ...(date ? { date } : {}),
        category: mapping.category ? String(row[mapping.category] ?? "").trim() : "",
        method: mapping.method ? String(row[mapping.method] ?? "").trim() : "",
        description: mapping.description ? String(row[mapping.description] ?? "").trim() : "",
      });
    });

    return { valid, invalid };
  }, [step, rows, mapping, typeMode, dateOrder]);

  const handleImport = async () => {
    if (!normalized.valid.length) return;

    setImporting(true);
    setImportError("");
    setProgress({ sent: 0, total: normalized.valid.length });

    let inserted = 0;
    try {
      for (let i = 0; i < normalized.valid.length; i += CHUNK_SIZE) {
        const chunk = normalized.valid.slice(i, i + CHUNK_SIZE);
        const res = await axiosInstance.post("/api/transactions/bulk", { transactions: chunk });
        inserted += res.data.inserted;
        setProgress({
          sent: Math.min(i + CHUNK_SIZE, normalized.valid.length),
          total: normalized.valid.length,
        });
      }
      setResult({ inserted, skipped: normalized.invalid.length });
      setStep("done");
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }
      setImportError(
        `${error.response?.data?.message || "Import failed."}` +
          (inserted > 0 ? ` (${inserted} transactions were already imported before the error.)` : "")
      );
    } finally {
      setImporting(false);
    }
  };

  const resetToUpload = () => {
    setStep("upload");
    setFileName("");
    setColumns([]);
    setRows([]);
    setParseError("");
    setImportError("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const previewRows = normalized.valid.slice(0, 5);

  const selectClass =
    "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="Import Transactions" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-5xl mx-auto p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Import from CSV</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Upload a bank statement or exported CSV, match its columns, and import your history in one go.
            </p>
          </div>

          {/* Step 1: upload */}
          {step === "upload" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Choose a CSV file</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                The first row should contain column headers (e.g. Date, Amount, Description).
              </p>

              <label className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
                <Upload size={16} />
                Select file
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>

              {parseError && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> {parseError}
                </p>
              )}
            </div>
          )}

          {/* Step 2: map columns + preview */}
          {step === "map" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Match columns</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{fileName}</span> — {rows.length} rows found.
                      Tell us which CSV column holds each detail.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetToUpload}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                    aria-label="Choose a different file"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <select
                        value={mapping[field.key] || ""}
                        onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="">{field.required ? "— select a column —" : "— not in file —"}</option>
                        {columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Transaction type</label>
                    <select value={typeMode} onChange={(e) => setTypeMode(e.target.value)} className={selectClass}>
                      <option value="column">From a CSV column</option>
                      <option value="sign">From amount sign (negative = expense)</option>
                      <option value="credit">All rows are income (credit)</option>
                      <option value="debit">All rows are expenses (debit)</option>
                    </select>
                  </div>

                  {typeMode === "column" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                        Type column<span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        value={mapping.type || ""}
                        onChange={(e) => setMapping((m) => ({ ...m, type: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="">— select a column —</option>
                        {columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {mapping.date && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Date format</label>
                      <select value={dateOrder} onChange={(e) => setDateOrder(e.target.value)} className={selectClass}>
                        <option value="dmy">DD/MM/YYYY</option>
                        <option value="mdy">MM/DD/YYYY</option>
                        <option value="ymd">YYYY-MM-DD</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Preview</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 size={15} /> {normalized.valid.length} ready
                    </span>
                    {normalized.invalid.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                        <AlertTriangle size={15} /> {normalized.invalid.length} will be skipped
                      </span>
                    )}
                  </div>
                </div>

                {previewRows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                          <th className="text-left font-semibold px-6 py-3">Date</th>
                          <th className="text-left font-semibold px-6 py-3">Type</th>
                          <th className="text-left font-semibold px-6 py-3">Category</th>
                          <th className="text-left font-semibold px-6 py-3">Method</th>
                          <th className="text-right font-semibold px-6 py-3">Amount</th>
                          <th className="text-left font-semibold px-6 py-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewRows.map((row, i) => (
                          <tr key={i}>
                            <td className="px-6 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {row.date ? new Date(row.date).toLocaleDateString("en-IN") : "Today"}
                            </td>
                            <td className="px-6 py-3">
                              <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700">
                                {row.type}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{row.category || "Other"}</td>
                            <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{row.method || "Other"}</td>
                            <td
                              className={`px-6 py-3 text-right font-semibold ${
                                row.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100"
                              }`}
                            >
                              {formatCurrency(row.amount)}
                            </td>
                            <td className="px-6 py-3 text-slate-500 dark:text-slate-400 max-w-[240px] truncate">
                              {row.description || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                    No rows are valid with the current mapping. Check the Amount column
                    {typeMode === "column" ? " and Type column" : ""} above.
                  </p>
                )}

                {normalized.invalid.length > 0 && (
                  <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-100 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
                    Skipping row{normalized.invalid.length > 1 ? "s" : ""}{" "}
                    {normalized.invalid
                      .slice(0, 3)
                      .map((r) => `${r.index} (${r.reason})`)
                      .join(", ")}
                    {normalized.invalid.length > 3 && ` and ${normalized.invalid.length - 3} more`}.
                  </div>
                )}
              </div>

              {importError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  {importError}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={resetToUpload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-sm"
                >
                  <ArrowLeft size={16} />
                  Different file
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || normalized.valid.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importing {progress.sent}/{progress.total}…
                    </>
                  ) : (
                    <>
                      Import {normalized.valid.length} transaction{normalized.valid.length === 1 ? "" : "s"}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: done */}
          {step === "done" && result && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Import complete</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                {result.inserted} transaction{result.inserted === 1 ? "" : "s"} imported
                {result.skipped > 0 && `, ${result.skipped} row${result.skipped === 1 ? "" : "s"} skipped`}.
              </p>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetToUpload}
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-sm"
                >
                  Import another file
                </button>
                <Link
                  to="/transactions"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  View transactions
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
