import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, User, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ title, onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        {/* ✅ Mobile Menu Button (Hidden on Desktop) */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
        >
          <Menu size={24} />
        </button>

        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm hover:ring-2 hover:ring-blue-200 transition-all"
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/profile");
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <User size={16} />
              My Profile
            </button>

            <a
              href="mailto:support@fintrack.app"
              onClick={() => setIsMenuOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <HelpCircle size={16} />
              Help & Support
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
