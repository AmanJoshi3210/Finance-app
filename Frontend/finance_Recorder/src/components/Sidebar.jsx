// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, List, PlusCircle, Settings, LogOut } from "lucide-react";

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { name: "Transactions", path: "/transactions", icon: <List size={20} /> },
    { name: "Add Transaction", path: "/add", icon: <PlusCircle size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col justify-between">
      <div>
        <h1 className="text-2xl font-bold text-center py-4 text-blue-600 border-b">
          FinTrack
        </h1>

        <nav className="mt-6 space-y-1">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-blue-50 transition ${
                location.pathname === link.path ? "bg-blue-100 text-blue-600" : ""
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 px-6 py-3 mb-6 text-red-600 hover:bg-red-50 transition"
      >
        <LogOut size={20} />
        Logout
      </button>
    </div>
  );
}
 