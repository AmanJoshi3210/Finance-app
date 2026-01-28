// src/components/Navbar.jsx
import React from "react";
export default function Navbar({ title }) {
  return (
    <div className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
  );
}
