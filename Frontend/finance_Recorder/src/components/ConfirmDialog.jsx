// src/components/ConfirmDialog.jsx
import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

// Generic confirmation popup. Pass a message + onConfirm callback when you
// render it; nothing else in the app needs to know how the dialog looks.
export default function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full shrink-0 ${
                danger ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              {message && <p className="text-sm text-slate-500 mt-1">{message}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 flex gap-3 flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
              danger
                ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
            }`}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
