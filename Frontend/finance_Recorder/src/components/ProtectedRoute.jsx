import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    // not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
}