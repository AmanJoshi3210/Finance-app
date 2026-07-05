// src/pages/RecurringTransactions.jsx
import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import RecurringTransactionFormModal from "../components/RecurringTransactionFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  CalendarClock,
  Pencil,
  Trash2,
  Plus,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

export default function RecurringTransactions() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/recurring-transactions");
      setRules(res.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  const handleSaved = () => {
    setShowForm(false);
    setEditingRule(null);
    fetchRules();
  };

  const handleToggleActive = async (rule) => {
    try {
      await axiosInstance.put(`/api/recurring-transactions/${rule._id}`, { active: !rule.active });
      fetchRules();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate("/login");
    }
  };

  const performDelete = async (id) => {
    setDeletingId(id);
    setConfirmDialog((prev) => (prev ? { ...prev, loading: true } : prev));
    try {
      await axiosInstance.delete(`/api/recurring-transactions/${id}`);
      setConfirmDialog(null);
      fetchRules();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert(error.response?.data?.message || "Could not delete recurring transaction.");
      }
      setConfirmDialog(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      title: "Delete recurring transaction?",
      message: "This won't remove transactions already created — only stops future ones.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => performDelete(id),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="Recurring Transactions" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-5xl mx-auto p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Recurring Transactions</h1>
              <p className="text-slate-500 text-sm mt-1">Automate bills and income that repeat on a schedule.</p>
            </div>

            <button
              onClick={() => {
                setEditingRule(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus size={18} />
              Add Rule
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading recurring rules...</p>
            </div>
          )}

          {!loading && rules.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Repeat className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No recurring transactions yet</h3>
              <p className="text-slate-500 mt-2">Add a rule to automatically record rent, subscriptions, or salary.</p>
            </div>
          )}

          {!loading && rules.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {rules.map((rule) => {
                  const isCredit = rule.type === "credit";
                  return (
                    <div
                      key={rule._id}
                      className={`group p-5 hover:bg-slate-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        !rule.active ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-full shrink-0 ${
                            isCredit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-800 text-base">{rule.category || "General"}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 flex-wrap">
                            <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-xs font-medium border border-slate-200">
                              {rule.frequency}
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                              <CalendarClock size={12} /> Next: {formatDate(rule.nextRunDate)}
                            </span>
                            {!rule.active && (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                                Paused
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className={`text-lg font-bold tracking-tight ${isCredit ? "text-emerald-600" : "text-slate-800"}`}>
                          {isCredit ? "+" : "-"} {formatCurrency(rule.amount)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(rule)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label={rule.active ? "Pause rule" : "Resume rule"}
                          >
                            {rule.active ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRule(rule);
                              setShowForm(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label="Edit rule"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rule._id)}
                            disabled={deletingId === rule._id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            aria-label="Delete rule"
                          >
                            {deletingId === rule._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <RecurringTransactionFormModal
          mode={editingRule ? "edit" : "add"}
          recurring={editingRule}
          onClose={() => {
            setShowForm(false);
            setEditingRule(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          danger={confirmDialog.danger}
          loading={confirmDialog.loading}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
