import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import PreviousMonthsSummary from "./pages/PreviousMonthsSummary";
import RecurringTransactions from "./pages/RecurringTransactions";
import ImportTransactions from "./pages/ImportTransactions";
import SavingsGoals from "./pages/SavingsGoals";
import BillReminders from "./pages/BillReminders";
import Accounts from "./pages/Accounts";
import MonthlyTracker from "./pages/MonthlyTracker";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/import" element={<ImportTransactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/previous-months-summary" element={<PreviousMonthsSummary />} />
          <Route path="/recurring-transactions" element={<RecurringTransactions />} />
          <Route path="/savings-goals" element={<SavingsGoals />} />
          <Route path="/bill-reminders" element={<BillReminders />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/monthly-tracker" element={<MonthlyTracker />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
