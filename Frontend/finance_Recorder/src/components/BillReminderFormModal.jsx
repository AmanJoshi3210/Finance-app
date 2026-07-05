// src/components/BillReminderFormModal.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { IndianRupee, FileText, Calendar, BellRing, Loader2, CheckCircle2, X } from "lucide-react";

const toDateInputValue = (date) => (date ? new Date(date).toISOString().slice(0, 10) : "");

const emptyForm = { name: "", amount: "", dueDate: "", recurring: false, notifyDaysBefore: 3 };

export default function BillReminderFormModal({ mode = "add", reminder = null, onClose, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && reminder) {
      setForm({
        name: reminder.name || "",
        amount: reminder.amount ?? "",
        dueDate: toDateInputValue(reminder.dueDate),
        recurring: Boolean(reminder.recurring),
        notifyDaysBefore: reminder.notifyDaysBefore ?? 3,
      });
    }
  }, [mode, reminder]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter a bill name");
      return;
    }
    if (Number(form.amount) < 0) {
      setError("Amount cannot be negative");
      return;
    }
    if (!form.dueDate) {
      setError("Please choose a due date");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (mode === "edit") {
        response = await axiosInstance.put(`/api/bill-reminders/${reminder._id}`, form);
      } else {
        response = await axiosInstance.post("/api/bill-reminders", form);
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
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{mode === "edit" ? "Edit Bill Reminder" : "Add Bill Reminder"}</h2>
            <p className="text-sm text-slate-500 mt-1">Get a heads-up before a bill is due.</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bill Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Electricity Bill"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
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
                  min="0"
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-slate-400" />
                </div>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notify Days Before</label>
            <div className="relative max-w-[10rem]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BellRing size={18} className="text-slate-400" />
              </div>
              <input
                type="number"
                name="notifyDaysBefore"
                min="0"
                value={form.notifyDaysBefore}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              name="recurring"
              checked={form.recurring}
              onChange={handleChange}
              className="w-4 h-4 accent-blue-600"
            />
            <div>
              <span className="font-medium text-slate-800">Recurring monthly</span>
              <p className="text-xs text-slate-500 mt-0.5">Automatically rolls to next month once it's past due.</p>
            </div>
          </label>

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
                  {mode === "edit" ? "Save Changes" : "Save Reminder"}
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
