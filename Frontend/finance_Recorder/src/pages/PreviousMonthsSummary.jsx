// src/pages/PreviousMonthsSummary.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { Loader2, History, TrendingUp, TrendingDown } from "lucide-react";

export default function PreviousMonthsSummary() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await axiosInstance.get("/api/monthly-summary");
        setSummaries(res.data);
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatMonth = (month) => {
    const [year, monthNum] = month.split("-");
    return new Date(Number(year), Number(monthNum) - 1, 1).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="Previous Months Summary" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-5xl mx-auto p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Monthly History</h1>
            <p className="text-slate-500 text-sm mt-1">
              Review how your income, spending, and budget compared each month.
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading history...</p>
            </div>
          )}

          {!loading && summaries.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No history yet</h3>
              <p className="text-slate-500 mt-2">
                Once a month completes, its summary will show up here.
              </p>
            </div>
          )}

          {!loading && summaries.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                      <th className="text-left font-semibold px-6 py-3">Month</th>
                      <th className="text-right font-semibold px-6 py-3">Credit</th>
                      <th className="text-right font-semibold px-6 py-3">Debit</th>
                      <th className="text-right font-semibold px-6 py-3">Limit</th>
                      <th className="text-right font-semibold px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaries.map((s) => {
                      const overLimit = s.monthlyLimit > 0 && s.totalDebit > s.monthlyLimit;
                      const hasLimit = s.monthlyLimit > 0;

                      return (
                        <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {formatMonth(s.month)}
                          </td>
                          <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                            {formatCurrency(s.totalCredit)}
                          </td>
                          <td className="px-6 py-4 text-right text-rose-600 font-medium">
                            {formatCurrency(s.totalDebit)}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {hasLimit ? formatCurrency(s.monthlyLimit) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {hasLimit ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  overLimit
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {overLimit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {overLimit ? "Over" : "Under"}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">No limit set</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
