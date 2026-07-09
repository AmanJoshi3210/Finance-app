import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import SpendingTrendChart from "../components/charts/SpendingTrendChart";
import CategoryBreakdownChart from "../components/charts/CategoryBreakdownChart";
import {
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  Plus,
  MoreHorizontal,
  AlertTriangle
} from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  
  // ✅ Added State for Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [userData, setUserData] = useState({ totalCredit: 0, totalDebit: 0, monthlyLimit: 0 });
  const [transactions, setTransactions] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const getCategoryTotals = (items) =>
    items
      .filter((item) => item.type !== "credit")
      .reduce((acc, item) => {
        const key = item.category || "Other";
        acc[key] = (acc[key] || 0) + Number(item.amount || 0);
        return acc;
      }, {});

  useEffect(() => {
    if (authLoading || !user) return; 

    const fetchDashboardData = async () => {
      try {
        // Dashboard only needs the aggregate totals (from the UserData
        // summary collection) plus a small preview of recent activity —
        // never the full transaction history. The trend/category charts
        // pull their own slices (a monthly aggregation, and a wider-but-still-
        // capped page for category totals) alongside that.
        const [userRes, txRes, trendRes, categoryRes, categoryBudgetsRes] = await Promise.all([
          axiosInstance.get("/api/userdata"),
          axiosInstance.get("/api/transactions/recent", { params: { limit: 5 } }),
          axiosInstance.get("/api/transactions/monthly-trend"),
          axiosInstance.get("/api/transactions", { params: { page: 1, limit: 100 } }),
          axiosInstance.get("/api/category-budgets"),
        ]);

        setUserData(userRes.data);
        setTransactions(txRes.data);
        setMonthlyTrend(trendRes.data);
        setCategoryTotals(getCategoryTotals(categoryRes.data.transactions || []));
        setCategoryBudgets(
          categoryBudgetsRes.data.reduce((acc, b) => ({ ...acc, [b.category]: b.limit }), {})
        );

      } catch (err) {
        console.error("Dashboard fetch error:", err.response || err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading]);

  // Helper: Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper: Calculate Balance
  const netBalance = (userData.totalCredit || 0) - (userData.totalDebit || 0);
  
  // Helper: Calculate Budget Percentage
  const budgetPercentage = userData.monthlyLimit > 0 
    ? Math.min(((userData.totalDebit || 0) / userData.monthlyLimit) * 100, 100)
    : 0;

  // Only tease a couple of entries here — the Transactions page (with
  // pagination) is the place to browse full history.
  const recentTransactionsPreview = transactions.slice(0, 2);
  const monthlyTarget = userData.monthlyLimit > 0 ? userData.monthlyLimit : (userData.totalDebit || 0);
  const projectedSpend = monthlyTarget > 0 ? (userData.totalDebit || 0) * 1.15 : 0;
  const isOverspendingRisk = projectedSpend > monthlyTarget && monthlyTarget > 0;

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading your financial overview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative">
      
      {/* ✅ Sidebar with State Props */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        
        {/* ✅ Navbar with Toggle Callback */}
        <Navbar 
          title="Dashboard" 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Hello, {user?.name?.split(" ")[0] || "User"} 👋
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your wallet today.</p>
            </div>
            <Link 
              to="/add" 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus size={18} />
              Add Transaction
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Card 1: Net Balance */}
            <StatCard 
              title="Net Balance" 
              amount={formatCurrency(netBalance)} 
              icon={<Wallet size={22} className="text-white" />}
              iconBg="bg-blue-600"
              subtext="Available funds"
            />

            {/* Card 2: Income */}
            <StatCard 
              title="Total Income" 
              amount={formatCurrency(userData?.totalCredit || 0)} 
              icon={<TrendingUp size={22} className="text-white" />}
              iconBg="bg-emerald-500"
              subtext="Credits this month"
              textColor="text-emerald-600 dark:text-emerald-400"
            />

            {/* Card 3: Expenses */}
            <StatCard 
              title="Total Expenses" 
              amount={formatCurrency(userData?.totalDebit || 0)} 
              icon={<TrendingDown size={22} className="text-white" />}
              iconBg="bg-rose-500"
              subtext="Debits this month"
              textColor="text-rose-600 dark:text-rose-400"
            />

            {/* Card 4: Budget Limit */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Budget</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {formatCurrency(userData?.monthlyLimit || 0)}
                  </h3>
                </div>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 rounded-lg">
                  <Target size={22} className="text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Used: {Math.round(budgetPercentage)}%</span>
                  <span>{formatCurrency((userData.monthlyLimit || 0) - (userData.totalDebit || 0))} left</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      budgetPercentage > 90 ? "bg-red-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${budgetPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Transactions</h3>
              <Link to="/transactions" className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                View All <ArrowRight size={16} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactionsPreview.length > 0 ? (
                recentTransactionsPreview.map((t) => (
                  <div key={t._id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        t.type === "credit" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                      }`}>
                        {t.type === "credit" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{t.category || "Uncategorized"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(t.date).toLocaleDateString('en-IN', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
                          })} • {t.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold whitespace-nowrap ${
                      t.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100"
                    }`}>
                      {t.type === "credit" ? "+" : "-"} {formatCurrency(t.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MoreHorizontal className="text-slate-400" />
                  </div>
                  <p>No transactions recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <SpendingTrendChart data={monthlyTrend} formatCurrency={formatCurrency} />
            <CategoryBreakdownChart categoryTotals={categoryTotals} categoryBudgets={categoryBudgets} formatCurrency={formatCurrency} />
          </div>

          <div className="grid grid-cols-1 gap-6 mt-6">
            <div className={`rounded-2xl p-6 shadow-sm border ${isOverspendingRisk ? "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${isOverspendingRisk ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>Budget Forecast</h3>
                <AlertTriangle size={18} className={isOverspendingRisk ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"} />
              </div>
              <p className={`text-2xl font-bold ${isOverspendingRisk ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                {isOverspendingRisk ? "At Risk" : "On Track"}
              </p>
              <p className={`text-sm mt-2 ${isOverspendingRisk ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                Projected spend is {formatCurrency(projectedSpend)} vs target {formatCurrency(monthlyTarget)}.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ title, amount, icon, iconBg, subtext, textColor = "text-slate-800 dark:text-slate-100" }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${textColor}`}>{amount}</h3>
        </div>
        <div className={`p-2.5 rounded-lg shadow-sm ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">{subtext}</p>
    </div>
  );
}
