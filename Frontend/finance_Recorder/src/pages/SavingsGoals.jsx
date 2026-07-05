// src/pages/SavingsGoals.jsx
import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SavingsGoalFormModal from "../components/SavingsGoalFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { Loader2, PiggyBank, Calendar, Pencil, Trash2, Plus, PlusCircle } from "lucide-react";

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [contributingId, setContributingId] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributing, setContributing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/savings-goals");
      setGoals(res.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  const handleSaved = () => {
    setShowForm(false);
    setEditingGoal(null);
    fetchGoals();
  };

  const performDelete = async (id) => {
    setDeletingId(id);
    setConfirmDialog((prev) => (prev ? { ...prev, loading: true } : prev));
    try {
      await axiosInstance.delete(`/api/savings-goals/${id}`);
      setConfirmDialog(null);
      fetchGoals();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert(error.response?.data?.message || "Could not delete savings goal.");
      }
      setConfirmDialog(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      title: "Delete savings goal?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => performDelete(id),
    });
  };

  const handleContribute = async (id) => {
    if (Number(contributionAmount) <= 0) return;
    setContributing(true);
    try {
      await axiosInstance.put(`/api/savings-goals/${id}/contribute`, { amount: Number(contributionAmount) });
      setContributingId(null);
      setContributionAmount("");
      fetchGoals();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert(error.response?.data?.message || "Could not add contribution.");
      }
    } finally {
      setContributing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="Savings Goals" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-6xl mx-auto p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Savings Goals</h1>
              <p className="text-slate-500 text-sm mt-1">Track progress toward what you're saving up for.</p>
            </div>

            <button
              onClick={() => {
                setEditingGoal(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus size={18} />
              Add Goal
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading savings goals...</p>
            </div>
          )}

          {!loading && goals.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PiggyBank className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No savings goals yet</h3>
              <p className="text-slate-500 mt-2">Add a goal to start tracking your progress.</p>
            </div>
          )}

          {!loading && goals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const percentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                const isComplete = goal.currentAmount >= goal.targetAmount;

                return (
                  <div key={goal._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{goal.name}</h3>
                        {goal.deadline && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar size={12} /> {formatDate(goal.deadline)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGoal(goal);
                            setShowForm(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label="Edit goal"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(goal._id)}
                          disabled={deletingId === goal._id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          aria-label="Delete goal"
                        >
                          {deletingId === goal._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between text-sm font-medium text-slate-600 mb-1.5">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span className="text-slate-400">of {formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${isComplete ? "bg-emerald-500" : "bg-indigo-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">{Math.round(percentage)}% complete</p>

                      {contributingId === goal._id ? (
                        <div className="mt-4 flex gap-2">
                          <input
                            type="number"
                            min="1"
                            autoFocus
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            placeholder="Amount"
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <button
                            onClick={() => handleContribute(goal._id)}
                            disabled={contributing}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-70"
                          >
                            {contributing ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                          </button>
                          <button
                            onClick={() => {
                              setContributingId(null);
                              setContributionAmount("");
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setContributingId(goal._id)}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-lg transition-colors"
                        >
                          <PlusCircle size={16} /> Add Contribution
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SavingsGoalFormModal
          mode={editingGoal ? "edit" : "add"}
          goal={editingGoal}
          onClose={() => {
            setShowForm(false);
            setEditingGoal(null);
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
