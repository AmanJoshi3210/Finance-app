import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

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
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddTransaction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <ImportTransactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/previous-months-summary"
          element={
            <ProtectedRoute>
              <PreviousMonthsSummary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recurring-transactions"
          element={
            <ProtectedRoute>
              <RecurringTransactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/savings-goals"
          element={
            <ProtectedRoute>
              <SavingsGoals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bill-reminders"
          element={
            <ProtectedRoute>
              <BillReminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <Accounts />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
