// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  Settings, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const links = [
    // ✅ Added Home route
    { name: "Home", path: "/", icon: <Home size={20} /> },
    // 🔄 Changed Dashboard icon to LayoutDashboard for better distinction
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Transactions", path: "/transactions", icon: <List size={20} /> },
    { name: "Add Transaction", path: "/add", icon: <PlusCircle size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col justify-between border-r border-gray-200">
      <div>
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
            FinTrack
          </h1>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}