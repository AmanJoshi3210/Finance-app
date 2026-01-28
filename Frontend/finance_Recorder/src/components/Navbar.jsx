import React from "react";
import { Menu } from "lucide-react"; // Import Menu icon

export default function Navbar({ title, onMenuClick }) {
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
      
      {/* You can add profile dropdown or notifications here later */}
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
        U
      </div>
    </div>
  );
}