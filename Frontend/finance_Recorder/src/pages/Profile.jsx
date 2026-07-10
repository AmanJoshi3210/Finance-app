import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { User, Mail, CalendarDays, Loader2 } from "lucide-react";

export default function Profile() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="My Profile" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="max-w-2xl mx-auto p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Loading profile...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 md:p-8 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 shrink-0 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user?.name || "Unknown User"}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <User size={18} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Username</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{user?.name || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Mail size={18} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Email</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{user?.email || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <CalendarDays size={18} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Member Since</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{memberSince}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
