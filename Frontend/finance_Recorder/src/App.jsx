import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import PreviousMonthsSummary from "./pages/PreviousMonthsSummary";
import RecurringTransactions from "./pages/RecurringTransactions";
import SavingsGoals from "./pages/SavingsGoals";
import BillReminders from "./pages/BillReminders";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

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
      </Routes>
    </>
  );
}

export default App;
