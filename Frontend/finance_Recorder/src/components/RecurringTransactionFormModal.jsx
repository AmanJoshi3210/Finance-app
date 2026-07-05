// src/components/RecurringTransactionFormModal.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import {
  IndianRupee,
  Tags,
  Wallet,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Repeat,
  CalendarClock,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";

const toDateInputValue = (date) => (date ? new Date(date).toISOString().slice(0, 10) : "");

const emptyForm = {
  type: "debit",
  method: "",
  category: "",
  amount: "",
  description: "",
  frequency: "monthly",
  nextRunDate: "",
};

// Shared add/edit form for recurring transaction rules, modeled directly on
// TransactionFormModal — same layout conventions, plus frequency/nextRunDate.
export default function RecurringTransactionFormModal({ mode = "add", recurring = null, onClose, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && recurring) {
      setForm({
        type: recurring.type || "debit",
        method: recurring.method || "",
        category: recurring.category || "",
        amount: recurring.amount ?? "",
        description: recurring.description || "",
        frequency: recurring.frequency || "monthly",
        nextRunDate: toDateInputValue(recurring.nextRunDate),
      });
    }
  }, [mode, recurring]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleTypeSelect = (type) => setForm({ ...form, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Number(form.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!form.nextRunDate) {
      setError("Please choose a next run date");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (mode === "edit") {
        response = await axiosInstance.put(`/api/recurring-transactions/${recurring._id}`, form);
      } else {
        response = await axiosInstance.post("/api/recurring-transactions", form);
      }
      onSaved?.(response.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {mode === "edit" ? "Edit Recurring Transaction" : "Add Recurring Transaction"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Automatically record this transaction on a repeating schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Transaction Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeSelect("credit")}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  form.type === "credit"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold"
                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <ArrowDownCircle size={20} />
                Credit
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect("debit")}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  form.type === "debit"
                    ? "border-rose-500 bg-rose-50 text-rose-700 font-bold"
                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <ArrowUpCircle size={20} />
                Debit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee size={18} className="text-slate-400" />
                </div>
                <input
                  type="number"
                  name="amount"
                  min="1"
                  step="1"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tags size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Rent"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Repeat size={18} className="text-slate-400" />
                </div>
                <select
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Next Run Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarClock size={18} className="text-slate-400" />
                </div>
                <input
                  type="date"
                  name="nextRunDate"
                  value={form.nextRunDate}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Wallet size={18} className="text-slate-400" />
              </div>
              <select
                name="method"
                value={form.method}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value="">Select Method</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (Optional)</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText size={18} className="text-slate-400" />
              </div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add notes..."
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          <div className="pt-2 flex gap-3 flex-row-reverse">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  {mode === "edit" ? "Save Changes" : "Save Rule"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
