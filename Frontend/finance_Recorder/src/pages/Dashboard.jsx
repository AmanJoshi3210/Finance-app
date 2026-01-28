import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import TransactionCard from "../components/TransactionCard";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (loading || !user) return; // wait until auth is loaded

    const fetchDashboardData = async () => {
      try {
        // Fetch user data and last transactions
        const [userRes, txRes] = await Promise.all([
          axiosInstance.get("/api/userdata"),
          axiosInstance.get("/api/transactions"),
        ]);

        setUserData(userRes.data);
        setTransactions(txRes.data.slice(-5).reverse()); // show last 5
      } catch (err) {
        console.error("Dashboard fetch error:", err.response || err.message);
      }
    };

    fetchDashboardData();
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 text-lg">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="Dashboard" />
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Welcome, {user?.name || "User"} 👋
          </h2>

          {/* Dashboard cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white shadow rounded-xl p-4">
              <p className="text-gray-500">Monthly Credits</p>
              <h3 className="text-2xl font-semibold text-green-600">
                ₹{userData?.totalCredit || 0}
              </h3>
            </div>
            <div className="bg-white shadow rounded-xl p-4">
              <p className="text-gray-500">Monthly Debits</p>
              <h3 className="text-2xl font-semibold text-red-600">
                ₹{userData?.totalDebit || 0}
              </h3>
            </div>
            <div className="bg-white shadow rounded-xl p-4">
              <p className="text-gray-500">Monthly Limit</p>
              <h3 className="text-2xl font-semibold text-blue-600">
                ₹{userData?.monthlyLimit || 0}
              </h3>
            </div>
          </div>

          {/* Recent Transactions */}
          <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((t) => <TransactionCard key={t._id} {...t} />)
            ) : (
              <p className="text-gray-500">No transactions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
