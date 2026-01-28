// src/components/TransactionCard.jsx
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import React from "react";
export default function TransactionCard({ title, amount, date, type }) {
  const isCredit = type === "credit";

  return (
    <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${
            isCredit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isCredit ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
        </div>
        <div>
          <h3 className="text-gray-800 font-medium">{title}</h3>
          <p className="text-gray-500 text-sm">{new Date(date).toLocaleDateString()}</p>
        </div>
      </div>

      <div
        className={`text-lg font-semibold ${
          isCredit ? "text-green-600" : "text-red-500"
        }`}
      >
        {isCredit ? `+₹${amount}` : `-₹${amount}`}
      </div>
    </div>
  );
}
