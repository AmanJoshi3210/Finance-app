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
  User,
  Mail,
  Smartphone,
  Lock,
  Eye,
} from "lucide-react";

const SETTINGS_KEY = "finance_app_settings";

export default function Settings() {
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("Settings updated successfully!");
  const [snackSeverity, setSnackSeverity] = useState("success");
  const [activeSection, setActiveSection] = useState("budget");

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklySummary: true,
    unusualActivity: false,
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "30",
    lastPasswordChange: "Not updated yet",
  });

  const navigate = useNavigate();

  // ✅ State for Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [budgetRes, localSettings] = await Promise.all([
          axiosInstance.get("/api/transactions/monthly-limit"),
          Promise.resolve(localStorage.getItem(SETTINGS_KEY)),
        ]);

        setMonthlyLimit(budgetRes.data.monthlyLimit || "");

        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          if (parsed.profile) setProfile(parsed.profile);
          if (parsed.notifications) setNotifications(parsed.notifications);
          if (parsed.security) setSecurity(parsed.security);
        }
      } catch (error) {
        if (error.response?.status === 401) navigate("/login");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  const showToast = (message, severity = "success") => {
    setSnackMessage(message);
    setSnackSeverity(severity);
    setOpen(true);
  };

  const persistLocalSettings = (nextSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put("/api/transactions/monthly-limit", {
        monthlyLimit,
      });
      showToast("Monthly limit updated successfully!");
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Error updating monthly limit:", error);
      showToast("Could not update monthly limit. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = () => {
    if (!profile.fullName || !profile.email) {
      showToast("Name and email are required for profile.", "warning");
      return;
    }

    persistLocalSettings({ profile, notifications, security });
    showToast("Profile preferences saved.");
  };

  const handleSaveNotifications = () => {
    persistLocalSettings({ profile, notifications, security });
    showToast("Notification preferences saved.");
  };

  const handleSaveSecurity = () => {
    const updatedSecurity = {
      ...security,
      lastPasswordChange: new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    setSecurity(updatedSecurity);
    persistLocalSettings({ profile, notifications, security: updatedSecurity });
    showToast("Security preferences updated.");
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
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        {/* ✅ Navbar with Toggle Callback */}
        <Navbar title="Settings" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-4xl mx-auto p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Preferences</h2>
            <p className="text-slate-500 mt-1">Manage your budget limits and account settings.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-2">
              <button
                onClick={() => setActiveSection("budget")}
                className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
                  activeSection === "budget"
                    ? "bg-white text-blue-600 shadow-sm border border-blue-100 ring-2 ring-blue-50"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Target size={18} />
                Budget & Limits
              </button>

              <button
                onClick={() => setActiveSection("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
                  activeSection === "profile"
                    ? "bg-white text-blue-600 shadow-sm border border-blue-100 ring-2 ring-blue-50"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <User size={18} />
                Profile
              </button>

              <button
                onClick={() => setActiveSection("notifications")}
                className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
                  activeSection === "notifications"
                    ? "bg-white text-blue-600 shadow-sm border border-blue-100 ring-2 ring-blue-50"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Bell size={18} />
                Notifications
              </button>

              <button
                onClick={() => setActiveSection("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors ${
                  activeSection === "security"
                    ? "bg-white text-blue-600 shadow-sm border border-blue-100 ring-2 ring-blue-50"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Shield size={18} />
                Security
              </button>
            </div>

            <div className="lg:col-span-2">
              {activeSection === "budget" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Monthly Budget</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Set a maximum spending limit to track your financial health.
                    </p>
                  </div>

                  <div className="p-6 md:p-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Limit Amount</label>

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
                        onClick={handleSaveBudget}
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
              )}

              {activeSection === "profile" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Profile</h3>
                    <p className="text-sm text-slate-500 mt-1">Keep your account identity details up to date.</p>
                  </div>

                  <div className="p-6 md:p-8 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                        className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">Email Address</label>
                      <div className="mt-2 relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="name@example.com"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">Phone</label>
                      <div className="mt-2 relative">
                        <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="+91 98xxxxxx"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                      >
                        <Save size={16} /> Save Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Notifications</h3>
                    <p className="text-sm text-slate-500 mt-1">Choose when and how we should notify you.</p>
                  </div>

                  <div className="p-6 md:p-8 space-y-4">
                    <SwitchRow
                      label="Budget limit alerts"
                      description="Get alerted when expenses approach your monthly cap."
                      checked={notifications.budgetAlerts}
                      onToggle={() =>
                        setNotifications((prev) => ({ ...prev, budgetAlerts: !prev.budgetAlerts }))
                      }
                    />

                    <SwitchRow
                      label="Weekly summary"
                      description="Receive a weekly snapshot of your credits and debits."
                      checked={notifications.weeklySummary}
                      onToggle={() =>
                        setNotifications((prev) => ({ ...prev, weeklySummary: !prev.weeklySummary }))
                      }
                    />

                    <SwitchRow
                      label="Unusual activity notifications"
                      description="Flag sudden spikes in spending for review."
                      checked={notifications.unusualActivity}
                      onToggle={() =>
                        setNotifications((prev) => ({ ...prev, unusualActivity: !prev.unusualActivity }))
                      }
                    />

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveNotifications}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                      >
                        <Save size={16} /> Save Notification Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "security" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Security</h3>
                    <p className="text-sm text-slate-500 mt-1">Strengthen account protection and session controls.</p>
                  </div>

                  <div className="p-6 md:p-8 space-y-5">
                    <SwitchRow
                      label="Two-factor authentication"
                      description="Add an extra verification step while logging in."
                      checked={security.twoFactorEnabled}
                      onToggle={() =>
                        setSecurity((prev) => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
                      }
                      icon={<Lock size={16} className="text-slate-500" />}
                    />

                    <div>
                      <label className="text-sm font-medium text-slate-700">Session timeout</label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) =>
                          setSecurity((prev) => ({ ...prev, sessionTimeout: e.target.value }))
                        }
                        className="mt-2 w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                      </select>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
                      <Eye size={18} className="mt-0.5 text-slate-500" />
                      <p>
                        Last password update: <span className="font-semibold">{security.lastPasswordChange}</span>
                      </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveSecurity}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                      >
                        <Save size={16} /> Save Security Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={snackSeverity}
            variant="filled"
            onClose={() => setOpen(false)}
            sx={{ width: "100%", borderRadius: 2 }}
          >
            {snackMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}

function SwitchRow({ label, description, checked, onToggle, icon }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <h4 className="font-medium text-slate-800">{label}</h4>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
