import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { 
  Loader2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ArrowRight,
  Plus,
  MoreHorizontal,
  Flame,
  Sparkles,
  AlertTriangle
} from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  
  // ✅ Added State for Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [userData, setUserData] = useState({ totalCredit: 0, totalDebit: 0, monthlyLimit: 0 });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDailySpendingStreak = (items) => {
    const debitDates = [...new Set(
      items
        .filter((item) => item.type !== "credit")
        .map((item) => new Date(item.date).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    if (!debitDates.length) return 0;

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const day of debitDates) {
      const txDate = new Date(day);
      txDate.setHours(0, 0, 0, 0);

      const diff = Math.round((cursor - txDate) / (1000 * 60 * 60 * 24));
      if (diff === streak) {
        streak += 1;
      } else if (diff > streak) {
        break;
      }
    }

    return streak;
  };

  const getTopExpenseCategory = (items) => {
    const categoryTotals = items
      .filter((item) => item.type !== "credit")
      .reduce((acc, item) => {
        const key = item.category || "Other";
        acc[key] = (acc[key] || 0) + Number(item.amount || 0);
        return acc;
      }, {});

    const ranked = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    return ranked[0] || ["None yet", 0];
  };

  useEffect(() => {
    if (authLoading || !user) return; 

    const fetchDashboardData = async () => {
      try {
        const [userRes, txRes] = await Promise.all([
          axiosInstance.get("/api/userdata"),
          axiosInstance.get("/api/transactions"),
        ]);

        setUserData(userRes.data);

        // Sort by Date Descending (Newest First) then take top 5
        const sortedTransactions = txRes.data.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });

        setTransactions(sortedTransactions.slice(0, 5));
        
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

  const [topCategory, topCategorySpend] = getTopExpenseCategory(transactions);
  const spendingStreak = getDailySpendingStreak(transactions);
  const savingsRate = userData.totalCredit > 0
    ? Math.max((((userData.totalCredit - userData.totalDebit) / userData.totalCredit) * 100), 0)
    : 0;
  const monthlyTarget = userData.monthlyLimit > 0 ? userData.monthlyLimit : (userData.totalDebit || 0);
  const projectedSpend = monthlyTarget > 0 ? (userData.totalDebit || 0) * 1.15 : 0;
  const isOverspendingRisk = projectedSpend > monthlyTarget && monthlyTarget > 0;

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your financial overview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      
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
              <h2 className="text-2xl font-bold text-slate-800">
                Hello, {user?.name?.split(" ")[0] || "User"} 👋
              </h2>
              <p className="text-slate-500 mt-1">Here's what's happening with your wallet today.</p>
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
              textColor="text-emerald-600"
            />

            {/* Card 3: Expenses */}
            <StatCard 
              title="Total Expenses" 
              amount={formatCurrency(userData?.totalDebit || 0)} 
              icon={<TrendingDown size={22} className="text-white" />}
              iconBg="bg-rose-500"
              subtext="Debits this month"
              textColor="text-rose-600"
            />

            {/* Card 4: Budget Limit */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">Monthly Budget</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    {formatCurrency(userData?.monthlyLimit || 0)}
                  </h3>
                </div>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Target size={22} className="text-indigo-600" />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                  <span>Used: {Math.round(budgetPercentage)}%</span>
                  <span>{formatCurrency((userData.monthlyLimit || 0) - (userData.totalDebit || 0))} left</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
              <Link to="/transactions" className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight size={16} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <div key={t._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        t.type === "credit" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      }`}>
                        {t.type === "credit" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{t.category || "Uncategorized"}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(t.date).toLocaleDateString('en-IN', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
                          })} • {t.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold whitespace-nowrap ${
                      t.type === "credit" ? "text-emerald-600" : "text-slate-800"
                    }`}>
                      {t.type === "credit" ? "+" : "-"} {formatCurrency(t.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-500">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MoreHorizontal className="text-slate-400" />
                  </div>
                  <p>No transactions recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl p-6 shadow-lg shadow-indigo-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Finance Personality</h3>
                <Sparkles size={18} />
              </div>
              <p className="text-2xl font-bold">
                {savingsRate > 35 ? "Wealth Builder" : savingsRate > 15 ? "Balanced Planner" : "Growth Starter"}
              </p>
              <p className="text-sm text-indigo-100 mt-2">
                You are saving {savingsRate.toFixed(1)}% of your income. Keep this pace to improve long-term stability.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Top Spend Zone</h3>
                <Flame size={18} className="text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{topCategory}</p>
              <p className="text-sm text-slate-500 mt-2">
                {formatCurrency(topCategorySpend)} spent in this category. Spending streak: <strong>{spendingStreak} day(s)</strong>.
              </p>
            </div>

            <div className={`rounded-2xl p-6 shadow-sm border ${isOverspendingRisk ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${isOverspendingRisk ? "text-red-700" : "text-emerald-700"}`}>Budget Forecast</h3>
                <AlertTriangle size={18} className={isOverspendingRisk ? "text-red-600" : "text-emerald-600"} />
              </div>
              <p className={`text-2xl font-bold ${isOverspendingRisk ? "text-red-700" : "text-emerald-700"}`}>
                {isOverspendingRisk ? "At Risk" : "On Track"}
              </p>
              <p className={`text-sm mt-2 ${isOverspendingRisk ? "text-red-600" : "text-emerald-600"}`}>
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
function StatCard({ title, amount, icon, iconBg, subtext, textColor = "text-slate-800" }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${textColor}`}>{amount}</h3>
        </div>
        <div className={`p-2.5 rounded-lg shadow-sm ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3 font-medium">{subtext}</p>
    </div>
  );
}
