import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

// Page titles for the shared Navbar, keyed by route path. Sidebar/Navbar live
// here instead of in each page so navigating between protected pages doesn't
// remount (and visibly flicker) the sidebar on every route change.
const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/transactions": "Transaction History",
  "/add": "New Entry",
  "/import": "Import Transactions",
  "/settings": "Settings",
  "/profile": "My Profile",
  "/previous-months-summary": "Previous Months Summary",
  "/recurring-transactions": "Recurring Transactions",
  "/savings-goals": "Savings Goals",
  "/bill-reminders": "Bill Reminders",
  "/accounts": "Accounts",
};

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "FinTrack";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title={title} onMenuClick={() => setIsSidebarOpen(true)} />
        <Outlet />
      </div>
    </div>
  );
}
