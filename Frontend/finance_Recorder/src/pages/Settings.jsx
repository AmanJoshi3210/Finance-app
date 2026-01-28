import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { 
  Target, 
  IndianRupee, 
  Save, 
  Loader2, 
  CreditCard,
  Shield,
  Bell,
  User
} from "lucide-react";

export default function Settings() {
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // State for save button loading
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  // ✅ State for Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosInstance.get("/api/transactions/monthly-limit");
        setMonthlyLimit(res.data.monthlyLimit || "");
      } catch (error) {
        if (error.response?.status === 401) navigate("/login");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put("/api/transactions/monthly-limit", {
        monthlyLimit,
      });
      setOpen(true);
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Error updating monthly limit:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading settings...</p>
      </div>
    );

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
          title="Settings" 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        <div className="max-w-4xl mx-auto p-6 md:p-8">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Preferences</h2>
            <p className="text-slate-500 mt-1">Manage your budget limits and account settings.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Navigation (Visual Only) */}
            <div className="lg:col-span-1 space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-blue-600 font-medium rounded-xl shadow-sm border border-blue-100 ring-2 ring-blue-50">
                <Target size={18} />
                Budget & Limits
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white hover:text-slate-900 font-medium rounded-xl transition-colors">
                <User size={18} />
                Profile
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white hover:text-slate-900 font-medium rounded-xl transition-colors">
                <Bell size={18} />
                Notifications
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white hover:text-slate-900 font-medium rounded-xl transition-colors">
                <Shield size={18} />
                Security
              </button>
            </div>

            {/* Right Column: Active Settings Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800">Monthly Budget</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Set a maximum spending limit to track your financial health.
                  </p>
                </div>
                
                <div className="p-6 md:p-8">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Limit Amount
                  </label>
                  
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900"
                      value={monthlyLimit}
                      onChange={(e) => setMonthlyLimit(e.target.value)}
                      placeholder="e.g. 20000"
                    />
                  </div>
                  
                  <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm">
                    <CreditCard size={20} className="shrink-0 mt-0.5" />
                    <p>
                      We'll calculate your progress based on your debit transactions against this limit on your dashboard.
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ✅ Notification Snackbar */}
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
            Monthly limit updated successfully!
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}