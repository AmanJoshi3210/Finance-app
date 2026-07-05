// src/pages/Transactions.jsx
import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import TransactionFormModal from "../components/TransactionFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Calendar,
  Wallet,
  SlidersHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

const PAGE_SIZE = 5;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // ✅ State for Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(handle);
  }, [query]);

  // Filters changed → the current page of results is no longer valid, restart at page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, typeFilter]);

  const fetchTransactions = useCallback(
    async (targetPage) => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/api/transactions", {
          params: {
            page: targetPage,
            limit: PAGE_SIZE,
            type: typeFilter === "all" ? undefined : typeFilter,
            search: debouncedQuery || undefined,
          },
        });

        setTransactions(res.data.transactions);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);
        return res.data.transactions.length;
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [navigate, typeFilter, debouncedQuery]
  );

  useEffect(() => {
    fetchTransactions(page);
  }, [fetchTransactions, page]);

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString("en-IN", options);
  };

  const handleEditSaved = (updatedTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t._id === updatedTransaction._id ? updatedTransaction : t))
    );
    setEditingTransaction(null);
  };

  const performDelete = async (id) => {
    setDeletingId(id);
    setConfirmDialog((prev) => (prev ? { ...prev, loading: true } : prev));
    try {
      await axiosInstance.delete(`/api/transactions/${id}`);
      setConfirmDialog(null);

      // Re-fetch so pagination/totals stay accurate; back up a page if the
      // deleted row was the last one on a page beyond the first.
      const remaining = await fetchTransactions(page);
      if (remaining === 0 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert(error.response?.data?.message || "Could not delete transaction. Please try again.");
      }
      setConfirmDialog(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      title: "Delete transaction?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => performDelete(id),
    });
  };

  const handleEditClick = (transaction) => {
    setConfirmDialog({
      title: "Edit transaction?",
      message: "You're about to edit this transaction's details.",
      confirmLabel: "Edit",
      danger: false,
      onConfirm: () => {
        setEditingTransaction(transaction);
        setConfirmDialog(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="Transaction History" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-5xl mx-auto p-6 md:p-8">
          {/* Header & Filter Placeholder */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Recent Transactions</h1>
              <p className="text-slate-500 text-sm mt-1">View and manage your financial records.</p>
            </div>

            <div className="w-full md:w-auto flex gap-2">
              {/* Search Input */}
              <div className="relative w-full md:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="all">All</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading records...</p>
            </div>
          )}

          {/* No Data State */}
          {!loading && transactions.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No matching transactions</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters or add a new credit/debit record.</p>
            </div>
          )}

          {/* Transactions List */}
          {!loading && transactions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {transactions.map((t) => {
                  const isCredit = t.type === "credit";

                  return (
                    <div
                      key={t._id}
                      className="group p-5 hover:bg-slate-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left: Icon & Description */}
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${isCredit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                          {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-800 text-base">{t.category || "General"}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-xs font-medium border border-slate-200">{t.type}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="line-clamp-1">{t.description || "No description provided"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount, Date & Actions */}
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right flex flex-row sm:flex-col justify-between items-center sm:items-end gap-2 sm:gap-0">
                          <span className={`text-lg font-bold tracking-tight ${isCredit ? "text-emerald-600" : "text-slate-800"}`}>
                            {isCredit ? "+" : "-"} {formatCurrency(t.amount)}
                          </span>

                          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-1">
                            <Calendar size={12} />
                            {formatDate(t.date)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditClick(t)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label="Edit transaction"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t._id)}
                            disabled={deletingId === t._id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            aria-label="Delete transaction"
                          >
                            {deletingId === t._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && transactions.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      {editingTransaction && (
        <TransactionFormModal
          mode="edit"
          transaction={editingTransaction}
          overlay
          onClose={() => setEditingTransaction(null)}
          onSaved={handleEditSaved}
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
