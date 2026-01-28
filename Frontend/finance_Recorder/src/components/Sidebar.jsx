import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  Settings, 
  LogOut,
  X // Import Close icon
} from "lucide-react";

// ✅ Accept isOpen and onClose props
export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const location = useLocation();

  const links = [
    { name: "Home", path: "/", icon: <Home size={20} /> },
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Transactions", path: "/transactions", icon: <List size={20} /> },
    { name: "Add Transaction", path: "/add", icon: <PlusCircle size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* ✅ Mobile Backdrop (Dark overlay when sidebar is open) */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* ✅ Sidebar Container */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-200 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:shadow-none`}>
        
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
                FinTrack
              </h1>
              {/* ✅ Close Button (Mobile Only) */}
              <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <nav className="mt-6 px-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={onClose} // Close sidebar when link is clicked on mobile
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
      </div>
    </>
  );
}