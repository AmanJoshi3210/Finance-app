// src/pages/AddTransaction.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const AddTransaction = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    type: "",
    method: "",
    category: "",
    amount: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/api/transactions", form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOpen(true);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate("/login");
      else alert("Failed to add transaction. Try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar title="Add Transaction" />

        {/* Page Content */}
        <div className="flex justify-center items-center flex-1 p-6">
          <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              Add Transaction
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block mb-1 text-gray-700">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Type</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>

              {/* Method */}
              <div>
                <label className="block mb-1 text-gray-700">Method</label>
                <select
                  name="method"
                  value={form.method}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Method</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block mb-1 text-gray-700">Category</label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Food, Bills, Salary"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block mb-1 text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter details (optional)"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button variant="contained" type="submit" fullWidth
                sx={{
                  // py: 1.2,
                  borderRadius: "0.5rem",
                  backgroundColor: "#2563eb", // blue-600
                  "&:hover": {
                    backgroundColor: "#1d4ed8", // blue-700
                  },
                }}
              >Add Transaction</Button>
            </form>
          </div>
        </div>
        <Snackbar
                  open={open}
                  autoHideDuration={3000}
                  onClose={() => setOpen(false)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                  <Alert
                    severity="success"
                    onClose={() => setOpen(false)}
                    sx={{ width: "100%" }}
                  >
                    Transaction added successfully!
                  </Alert>
                </Snackbar>
      </div>
    </div>
  );
};

export default AddTransaction;
