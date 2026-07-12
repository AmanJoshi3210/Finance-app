// src/pages/Accounts.jsx
import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AccountFormModal from "../components/AccountFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { Loader2, Wallet, Landmark, CreditCard, Banknote, TrendingUp, Star, Pencil, Trash2, Plus } from "lucide-react";

const TYPE_ICONS = {
  bank: Landmark,
  credit_card: CreditCard,
  cash: Banknote,
  wallet: Wallet,
  investment: TrendingUp,
  other: Wallet,
};

const TYPE_LABELS = {
  bank: "Bank",
  credit_card: "Credit Card",
  cash: "Cash",
  wallet: "Wallet",
  investment: "Investment",
  other: "Other",
};

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/accounts");
      setAccounts(res.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount || 0);

  const handleSaved = () => {
    setShowForm(false);
    setEditingAccount(null);
    fetchAccounts();
  };

  const performDelete = async (id) => {
    setDeletingId(id);
    setConfirmDialog((prev) => (prev ? { ...prev, loading: true } : prev));
    try {
      await axiosInstance.delete(`/api/accounts/${id}`);
      setConfirmDialog(null);
      fetchAccounts();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert(error.response?.data?.message || "Could not remove account.");
      }
      setConfirmDialog(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (account) => {
    setConfirmDialog({
      title: "Remove account?",
      message: account.isDefault
        ? "This is your default account and can't be removed until another account is set as default."
        : "Accounts with existing transactions are archived (kept in history) instead of deleted outright.",
      confirmLabel: "Remove",
      danger: true,
      onConfirm: () => performDelete(account._id),
    });
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="Accounts" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-6xl mx-auto p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Accounts</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Total across accounts: <span className="font-semibold">{formatCurrency(totalBalance)}</span>
              </p>
            </div>

            <button
              onClick={() => {
                setEditingAccount(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus size={18} />
              Add Account
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Loading accounts...</p>
            </div>
          )}

          {!loading && accounts.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No accounts yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Add an account to start splitting transactions across your bank, cards, and cash.</p>
            </div>
          )}

          {!loading && accounts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => {
                const Icon = TYPE_ICONS[account.type] || Wallet;
                const isNegative = (account.balance || 0) < 0;

                return (
                  <div
                    key={account._id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6 flex flex-col ${
                      account.archived ? "border-slate-200 dark:border-slate-800 opacity-60" : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{account.name}</h3>
                            {account.isDefault && <Star size={14} className="text-amber-500 fill-amber-500" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {TYPE_LABELS[account.type] || "Other"}
                            {account.archived ? " • Archived" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAccount(account);
                            setShowForm(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          aria-label="Edit account"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(account)}
                          disabled={deletingId === account._id}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                          aria-label="Remove account"
                        >
                          {deletingId === account._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <p className={`text-2xl font-bold tracking-tight ${isNegative ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>
                        {formatCurrency(account.balance)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Current balance</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <AccountFormModal
          mode={editingAccount ? "edit" : "add"}
          account={editingAccount}
          onClose={() => {
            setShowForm(false);
            setEditingAccount(null);
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
