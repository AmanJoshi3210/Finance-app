// src/pages/Transactions.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Calendar,
  Wallet,
  FileText
} from "lucide-react";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axiosInstance.get("/api/transactions");

        setTransactions(
          [...res.data].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )
        );
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [navigate]);


  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Sidebar Wrapper - Fixed on Desktop */}
      <div className="hidden md:block fixed h-full z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="Transaction History" />

        <div className="max-w-5xl mx-auto p-6 md:p-8">

          {/* Header & Filter Placeholder */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Recent Transactions</h1>
              <p className="text-slate-500 text-sm mt-1">
                View and manage your financial records.
              </p>
            </div>

            {/* Search Input (Visual only for now) */}
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
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
              <h3 className="text-lg font-semibold text-slate-700">No transactions found</h3>
              <p className="text-slate-500 mt-2">Start by adding a new credit or debit record.</p>
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
                        <div className={`p-3 rounded-full shrink-0 ${isCredit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                          }`}>
                          {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-800 text-base">
                            {t.category || "General"}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-xs font-medium border border-slate-200">
                              {t.type}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="line-clamp-1">{t.description || "No description provided"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Date */}
                      <div className="text-right flex flex-row sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                        <span className={`text-lg font-bold tracking-tight ${isCredit ? "text-emerald-600" : "text-slate-800"
                          }`}>
                          {isCredit ? "+" : "-"} {formatCurrency(t.amount)}
                        </span>

                        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-1">
                          <Calendar size={12} />
                          {formatDate(t.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination / Footer info (Static for now) */}
          {!loading && transactions.length > 0 && (
            <div className="mt-4 text-center text-xs text-slate-400">
              Showing all {transactions.length} records
            </div>
          )}
        </div>
      </div>
    </div>
  );
}