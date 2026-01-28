// src/pages/Home.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Not logged in → stay on home

      try {
        // Verify token from backend
        const res = await axiosInstance.get("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.userId) {
          // Token valid → redirect to dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        console.log("Auth check failed:", error.response?.data || error.message);
        // Invalid token → stay on home
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
        Welcome to <span className="text-blue-600">FinTrack</span>
      </h1>
      <p className="text-gray-600 mb-8 text-lg">
        Track your expenses, manage your savings, and stay in control of your finances.
      </p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
