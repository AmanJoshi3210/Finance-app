import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { 
  IndianRupee, 
  Tags, 
  Wallet, 
  FileText, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Loader2,
  CheckCircle2
} from "lucide-react";

const AddTransaction = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ✅ State for Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [form, setForm] = useState({
    type: "debit",
    method: "",
    category: "",
    amount: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeSelect = (type) => {
    setForm({ ...form, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/transactions", form);
      setOpen(true);
      setForm({
        type: "debit",
        method: "",
        category: "",
        amount: "",
        description: "",
      });
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      
      {/* ✅ Sidebar with State Props */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        
        {/* ✅ Navbar with Toggle Callback */}
        <Navbar 
          title="New Entry" 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        <div className="flex justify-center items-start pt-6 md:pt-10 px-4 md:px-8 pb-10">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden">
            
            <div className="bg-slate-50 border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-800">Add Transaction</h2>
              <p className="text-sm text-slate-500 mt-1">Record a new income or expense details below.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Transaction Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleTypeSelect("credit")}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      form.type === "credit"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold"
                        : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <ArrowDownCircle size={20} />
                    Credit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSelect("debit")}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      form.type === "debit"
                        ? "border-rose-500 bg-rose-50 text-rose-700 font-bold"
                        : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <ArrowUpCircle size={20} />
                    Debit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tags size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="e.g. Food"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Wallet size={18} className="text-slate-400" />
                  </div>
                  <select
                    name="method"
                    value={form.method}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (Optional)</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText size={18} className="text-slate-400" />
                  </div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Add notes..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                    form.type === 'credit' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Save Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setOpen(false)}
            sx={{ width: "100%", borderRadius: 2 }}
          >
            Transaction added successfully!
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default AddTransaction;