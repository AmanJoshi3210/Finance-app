// src/pages/Transactions.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axiosInstance.get("http://localhost:5000/api/transactions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setTransactions(res.data.reverse());
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="Transactions" />

        <div className="p-6 space-y-4">
          {/* Loading State */}
          {loading && (
            <p className="text-center text-gray-500">Loading transactions...</p>
          )}

          {/* No Data */}
          {!loading && transactions.length === 0 && (
            <p className="text-gray-500 text-center">No transactions found</p>
          )}

          {/* Transactions List */}
          {!loading &&
            transactions.length > 0 &&
            transactions.map((t) => (
              <div
                key={t._id}
                className="bg-white shadow-md rounded-xl p-5 border border-gray-100 hover:shadow-lg transition duration-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t.category || "Uncategorized"}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      t.type === "credit"
                        ? "bg-green-100 text-green-600"
                        : t.type === "debit"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {t.type.toUpperCase()}
                  </span>
                </div>

                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Amount:</span> ₹{t.amount}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Description:</span>{" "}
                  {t.description || "No description"}
                </p>
                <p className="text-gray-500 text-sm">
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(t.date).toLocaleString()}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
