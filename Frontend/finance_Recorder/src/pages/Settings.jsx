import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useAccessibility, TEXT_SCALES } from "../context/AccessibilityContext";
import { useNavigate, useLocation } from "react-router-dom";
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
  Lock,
  Eye,
  Trash2,
  Tag,
  KeyRound,
  Accessibility,
  Sun,
  Moon,
  Contrast,
  Link2,
  Type,
  Zap,
  RotateCcw,
} from "lucide-react";

const SETTINGS_KEY = "finance_app_settings";
const currentMonthString = () => new Date().toISOString().slice(0, 7);

const SECTIONS = [
  { id: "budget", label: "Budget & Limits", icon: Target },
  { id: "appearance", label: "Appearance & Accessibility", icon: Accessibility },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function Settings() {
  const location = useLocation();
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("Settings updated successfully!");
  const [snackSeverity, setSnackSeverity] = useState("success");
  const [activeSection, setActiveSection] = useState(
    SECTIONS.some((s) => s.id === location.state?.section) ? location.state.section : "budget"
  );

  const { theme, toggleTheme } = useTheme();
  const { settings: a11y, updateSetting, resetSettings } = useAccessibility();

  const [categories, setCategories] = useState([]);
  const [categoryLimits, setCategoryLimits] = useState({}); // { [category]: { value, budgetId, saving } }

  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

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

  // Seed the profile form from the verified user once auth resolves.
  useEffect(() => {
    if (user?.name) setFullName(user.name);
  }, [user]);

  // ✅ State for Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [budgetRes, categoriesRes, categoryBudgetsRes, notificationPrefsRes, securityPrefsRes, localSettings] = await Promise.all([
          axiosInstance.get("/api/transactions/monthly-limit"),
          axiosInstance.get("/api/transactions/categories"),
          axiosInstance.get("/api/category-budgets", { params: { month: currentMonthString() } }),
          axiosInstance.get("/api/users/notification-preferences"),
          axiosInstance.get("/api/users/security-preferences"),
          Promise.resolve(localStorage.getItem(SETTINGS_KEY)),
        ]);

        setMonthlyLimit(budgetRes.data.monthlyLimit || "");
        setCategories(categoriesRes.data);

        const limits = {};
        for (const cat of categoriesRes.data) {
          limits[cat] = { value: "", budgetId: null, saving: false };
        }
        for (const budget of categoryBudgetsRes.data) {
          limits[budget.category] = { value: budget.limit, budgetId: budget._id, saving: false };
        }
        setCategoryLimits(limits);
        setNotifications(notificationPrefsRes.data);

        // twoFactorEnabled is authoritative from the backend (per-user, follows
        // the account); sessionTimeout/lastPasswordChange stay client-local.
        const localSecurity = localSettings ? JSON.parse(localSettings).security || {} : {};
        setSecurity((prev) => ({
          ...prev,
          ...localSecurity,
          twoFactorEnabled: Boolean(securityPrefsRes.data.twoFactorEnabled),
        }));
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

  const handleCategoryLimitChange = (category, value) => {
    setCategoryLimits((prev) => ({
      ...prev,
      [category]: { ...prev[category], value },
    }));
  };

  const handleSaveCategoryLimit = async (category) => {
    const row = categoryLimits[category];
    if (!row || row.value === "" || Number(row.value) < 0) {
      showToast("Please enter a valid limit.", "warning");
      return;
    }

    setCategoryLimits((prev) => ({ ...prev, [category]: { ...prev[category], saving: true } }));
    try {
      const res = await axiosInstance.put("/api/category-budgets", {
        category,
        limit: Number(row.value),
        month: currentMonthString(),
      });
      setCategoryLimits((prev) => ({
        ...prev,
        [category]: { value: res.data.limit, budgetId: res.data._id, saving: false },
      }));
      showToast(`Limit saved for ${category}.`);
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Error saving category limit:", error);
      showToast("Could not save category limit. Please try again.", "error");
      setCategoryLimits((prev) => ({ ...prev, [category]: { ...prev[category], saving: false } }));
    }
  };

  const handleDeleteCategoryLimit = async (category) => {
    const row = categoryLimits[category];
    if (!row?.budgetId) return;

    setCategoryLimits((prev) => ({ ...prev, [category]: { ...prev[category], saving: true } }));
    try {
      await axiosInstance.delete(`/api/category-budgets/${row.budgetId}`);
      setCategoryLimits((prev) => ({
        ...prev,
        [category]: { value: "", budgetId: null, saving: false },
      }));
      showToast(`Limit removed for ${category}.`);
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Error deleting category limit:", error);
      showToast("Could not remove category limit. Please try again.", "error");
      setCategoryLimits((prev) => ({ ...prev, [category]: { ...prev[category], saving: false } }));
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showToast("Name is required.", "warning");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await axiosInstance.put("/api/users/profile", { name: fullName });
      updateUser({ name: res.data.name });
      showToast("Profile updated.");
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Error updating profile:", error);
      showToast(error.response?.data?.message || "Could not update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword) {
      showToast("Please fill in both password fields.", "warning");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "warning");
      return;
    }

    setChangingPassword(true);
    try {
      await axiosInstance.put("/api/users/change-password", { currentPassword, newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      const updatedSecurity = {
        ...security,
        lastPasswordChange: new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      };
      setSecurity(updatedSecurity);
      persistLocalSettings({ security: updatedSecurity });

      showToast("Password changed successfully.");
    } catch (error) {
      console.error("Error changing password:", error);
      showToast(error.response?.data?.message || "Could not change password.", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.put("/api/users/notification-preferences", notifications);
      setNotifications(res.data);
      showToast("Notification preferences saved.");
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Error saving notification preferences:", error);
      showToast("Could not save notification preferences. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      // twoFactorEnabled must round-trip to the DB so it actually gates login;
      // the cosmetic bits (session timeout, last password change) stay local.
      const res = await axiosInstance.put("/api/users/security-preferences", {
        twoFactorEnabled: security.twoFactorEnabled,
      });
      const nextSecurity = { ...security, twoFactorEnabled: res.data.twoFactorEnabled };
      setSecurity(nextSecurity);
      persistLocalSettings({ security: nextSecurity });
      showToast(
        res.data.twoFactorEnabled
          ? "Two-step verification enabled. You'll enter an emailed code at your next login."
          : "Security preferences updated."
      );
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Error saving security preferences:", error);
      showToast("Could not save security preferences. Please try again.", "error");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading settings...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative">
      {/* ✅ Sidebar with State Props */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        {/* ✅ Navbar with Toggle Callback */}
        <Navbar title="Settings" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-4xl mx-auto p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Preferences</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your budget limits and account settings.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <nav className="lg:col-span-1 space-y-2" aria-label="Settings sections">
              {SECTIONS.map(({ id, label, ...section }) => {
                const Icon = section.icon;
                return (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  aria-current={activeSection === id ? "true" : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl transition-colors text-left ${
                    activeSection === id
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900 ring-2 ring-blue-50 dark:ring-blue-950"
                      : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {label}
                </button>
                );
              })}
            </nav>

            <div className="lg:col-span-2">
              {activeSection === "budget" && (
                <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Monthly Budget</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Set a maximum spending limit to track your financial health.
                    </p>
                  </div>

                  <div className="p-6 md:p-8">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Monthly Limit Amount</label>

                    <div className="relative max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee size={18} className="text-slate-400" />
                      </div>
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-slate-100"
                        value={monthlyLimit}
                        onChange={(e) => setMonthlyLimit(e.target.value)}
                        placeholder="e.g. 20000"
                      />
                    </div>

                    <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-xl text-sm">
                      <CreditCard size={20} className="shrink-0 mt-0.5" />
                      <p>
                        We'll calculate your progress based on your debit transactions against this limit on your dashboard.
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
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

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Category Limits</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Set a spending cap per category for this month ({currentMonthString()}).
                    </p>
                  </div>

                  <div className="p-6 md:p-8">
                    {categories.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Add some transactions with categories first, then come back here to set limits.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {categories.map((category) => {
                          const row = categoryLimits[category] || { value: "", budgetId: null, saving: false };
                          return (
                            <div
                              key={category}
                              className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                            >
                              <div className="flex items-center gap-2 w-40 shrink-0">
                                <Tag size={16} className="text-slate-400" />
                                <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{category}</span>
                              </div>

                              <div className="relative flex-1 max-w-xs">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <IndianRupee size={16} className="text-slate-400" />
                                </div>
                                <input
                                  type="number"
                                  value={row.value}
                                  onChange={(e) => handleCategoryLimitChange(category, e.target.value)}
                                  placeholder="No limit set"
                                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <button
                                onClick={() => handleSaveCategoryLimit(category)}
                                disabled={row.saving}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {row.saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save
                              </button>

                              {row.budgetId && (
                                <button
                                  onClick={() => handleDeleteCategoryLimit(category)}
                                  disabled={row.saving}
                                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                                  aria-label={`Remove limit for ${category}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                </div>
              )}

              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Theme</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Choose how FinTrack looks on this device.
                      </p>
                    </div>

                    <div className="p-6 md:p-8">
                      <div className="grid grid-cols-2 gap-3 max-w-md" role="group" aria-label="Theme">
                        {[
                          { id: "light", label: "Light", icon: Sun },
                          { id: "dark", label: "Dark", icon: Moon },
                        ].map(({ id, label, ...option }) => {
                          const Icon = option.icon;
                          return (
                          <button
                            key={id}
                            onClick={() => theme !== id && toggleTheme()}
                            aria-pressed={theme === id}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold transition-all ${
                              theme === id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-100 dark:ring-blue-900"
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Icon size={18} />
                            {label}
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Text Size</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Scale the entire app up or down. Changes apply instantly.
                      </p>
                    </div>

                    <div className="p-6 md:p-8">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="group" aria-label="Text size">
                        {TEXT_SCALES.map((scale) => (
                          <button
                            key={scale.value}
                            onClick={() => updateSetting("textScale", scale.value)}
                            aria-pressed={a11y.textScale === scale.value}
                            className={`flex flex-col items-center justify-end gap-1 px-3 py-4 rounded-xl border transition-all ${
                              a11y.textScale === scale.value
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-100 dark:ring-blue-900"
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className="font-bold leading-none"
                              style={{ fontSize: `${scale.value * 1.25}rem` }}
                            >
                              Aa
                            </span>
                            <span className="text-xs font-medium mt-1">{scale.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Accessibility</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Readability and motion preferences, saved to this device.
                      </p>
                    </div>

                    <div className="p-6 md:p-8 space-y-4">
                      <SwitchRow
                        label="Bold text"
                        description="Increase font weight across the app for easier reading."
                        checked={a11y.boldText}
                        onToggle={() => updateSetting("boldText", !a11y.boldText)}
                        icon={<Type size={16} className="text-slate-500 dark:text-slate-400" />}
                      />

                      <SwitchRow
                        label="High contrast"
                        description="Darken muted text and strengthen borders for better visibility."
                        checked={a11y.highContrast}
                        onToggle={() => updateSetting("highContrast", !a11y.highContrast)}
                        icon={<Contrast size={16} className="text-slate-500 dark:text-slate-400" />}
                      />

                      <SwitchRow
                        label="Underline links"
                        description="Always underline links instead of relying on color alone."
                        checked={a11y.underlineLinks}
                        onToggle={() => updateSetting("underlineLinks", !a11y.underlineLinks)}
                        icon={<Link2 size={16} className="text-slate-500 dark:text-slate-400" />}
                      />

                      <SwitchRow
                        label="Reduce motion"
                        description="Minimize animations and transitions throughout the app."
                        checked={a11y.reduceMotion}
                        onToggle={() => updateSetting("reduceMotion", !a11y.reduceMotion)}
                        icon={<Zap size={16} className="text-slate-500 dark:text-slate-400" />}
                      />

                      <div className="pt-4 flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Preferences apply instantly and are stored in this browser.
                        </p>
                        <button
                          onClick={() => {
                            resetSettings();
                            showToast("Accessibility settings reset to defaults.");
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <RotateCcw size={14} />
                          Reset to defaults
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "profile" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Profile</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep your account identity details up to date.</p>
                  </div>

                  <div className="p-6 md:p-8 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="mt-2 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</label>
                      <div className="mt-2 relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={user?.email || ""}
                          readOnly
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                        Email is your login identity and can't be changed here.
                      </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose when and how we should notify you.</p>
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
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Notification Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "security" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Security</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Strengthen account protection and session controls.</p>
                  </div>

                  <div className="p-6 md:p-8 space-y-5">
                    <SwitchRow
                      label="Two-factor authentication"
                      description="Add an extra verification step while logging in."
                      checked={security.twoFactorEnabled}
                      onToggle={() =>
                        setSecurity((prev) => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
                      }
                      icon={<Lock size={16} className="text-slate-500 dark:text-slate-400" />}
                    />

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Session timeout</label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) =>
                          setSecurity((prev) => ({ ...prev, sessionTimeout: e.target.value }))
                        }
                        className="mt-2 w-full max-w-xs px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                      </select>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
                      <Eye size={18} className="mt-0.5 text-slate-500 dark:text-slate-400" />
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
    <div className="flex items-center justify-between gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <h4 className="font-medium text-slate-800 dark:text-slate-100">{label}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`relative inline-flex items-center w-12 h-6 shrink-0 rounded-full px-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
          checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        {/* Handle is always white so it stays visible on the blue "on" track in
            dark mode; flex + px keep it vertically centered and evenly inset. */}
        <span
          className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
