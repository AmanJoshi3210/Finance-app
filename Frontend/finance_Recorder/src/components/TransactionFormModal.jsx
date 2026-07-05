// src/components/TransactionFormModal.jsx
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
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";

const emptyForm = {
  type: "debit",
  method: "",
  category: "",
  amount: "",
  description: "",
};

// Shared add/edit form. Renders inline (embedded in a page) by default, or as
// a centered overlay dialog when `overlay` is true (used for editing rows).
export default function TransactionFormModal({
  mode = "add",
  transaction = null,
  overlay = false,
  onClose,
  onSaved,
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && transaction) {
      setForm({
        type: transaction.type || "debit",
        method: transaction.method || "",
        category: transaction.category || "",
        amount: transaction.amount ?? "",
        description: transaction.description || "",
      });
    }
  }, [mode, transaction]);

  const resetForm = () => setForm(emptyForm);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleTypeSelect = (type) => setForm({ ...form, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Number(form.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (mode === "edit") {
        response = await axiosInstance.put(`/api/transactions/${transaction._id}`, form);
      } else {
        response = await axiosInstance.post("/api/transactions", form);
        resetForm();
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

  const formCard = (
    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {mode === "edit" ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === "edit"
              ? "Update the details for this record."
              : "Record a new income or expense details below."}
          </p>
        </div>
        {overlay && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Transaction Type
          </label>
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

        {/* Amount & Category */}
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
                placeholder="e.g. Food"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Method */}
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description (Optional)
          </label>
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
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className={`pt-2 flex gap-3 ${overlay ? "flex-row-reverse" : ""}`}>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
              form.type === "credit"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
            } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                {mode === "edit" ? "Save Changes" : "Save Transaction"}
              </>
            )}
          </button>

          {overlay && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );

  if (!overlay) return formCard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      {formCard}
    </div>
  );
}
