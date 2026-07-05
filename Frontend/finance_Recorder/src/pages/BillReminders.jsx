// src/pages/BillReminders.jsx
import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import BillReminderFormModal from "../components/BillReminderFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { Loader2, BellRing, Calendar, Repeat, Pencil, Trash2, Plus } from "lucide-react";

const STATUS_STYLES = {
  overdue: "bg-red-100 text-red-700",
  "due-soon": "bg-amber-100 text-amber-700",
  upcoming: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS = {
  overdue: "Overdue",
  "due-soon": "Due Soon",
  upcoming: "Upcoming",
};

export default function BillReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/bill-reminders");
      setReminders(res.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  const handleSaved = () => {
    setShowForm(false);
    setEditingReminder(null);
    fetchReminders();
  };

  const performDelete = async (id) => {
    setDeletingId(id);
    setConfirmDialog((prev) => (prev ? { ...prev, loading: true } : prev));
    try {
      await axiosInstance.delete(`/api/bill-reminders/${id}`);
      setConfirmDialog(null);
      fetchReminders();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert(error.response?.data?.message || "Could not delete bill reminder.");
      }
      setConfirmDialog(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      title: "Delete bill reminder?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => performDelete(id),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="Bill Reminders" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-5xl mx-auto p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Bill Reminders</h1>
              <p className="text-slate-500 text-sm mt-1">Stay ahead of upcoming and overdue bills.</p>
            </div>

            <button
              onClick={() => {
                setEditingReminder(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus size={18} />
              Add Reminder
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading bill reminders...</p>
            </div>
          )}

          {!loading && reminders.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellRing className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No bill reminders yet</h3>
              <p className="text-slate-500 mt-2">Add a reminder so you never miss a due date.</p>
            </div>
          )}

          {!loading && reminders.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {reminders.map((reminder) => (
                  <div
                    key={reminder._id}
                    className="group p-5 hover:bg-slate-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full shrink-0 bg-blue-100 text-blue-600">
                        <BellRing size={20} />
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 text-base">{reminder.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[reminder.status]}`}>
                            {STATUS_LABELS[reminder.status]}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar size={12} /> {formatDate(reminder.dueDate)}
                          </span>
                          {reminder.recurring && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              <Repeat size={11} /> Monthly
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-lg font-bold tracking-tight text-slate-800">{formatCurrency(reminder.amount)}</span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReminder(reminder);
                            setShowForm(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label="Edit reminder"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(reminder._id)}
                          disabled={deletingId === reminder._id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          aria-label="Delete reminder"
                        >
                          {deletingId === reminder._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <BillReminderFormModal
          mode={editingReminder ? "edit" : "add"}
          reminder={editingReminder}
          onClose={() => {
            setShowForm(false);
            setEditingReminder(null);
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
