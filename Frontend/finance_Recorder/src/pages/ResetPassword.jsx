import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { Lock, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const RESEND_COOLDOWN_SECONDS = 30;

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // ForgotPassword always routes here with the email a code was requested
  // for. Without it there's nothing to reset, so bounce back.
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!email) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await axiosInstance.post("/api/users/reset-password", {
        email,
        otp: otp.trim(),
        newPassword,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Password reset successfully. Please sign in." },
      });
    } catch (err) {
      console.error("Password reset failed:", err);
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setIsResending(true);

    try {
      await axiosInstance.post("/api/users/forgot-password", { email });
      setInfo("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      console.error("Resend reset code failed:", err);
      setError(err.response?.data?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl"></div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Reset Your Password</h2>
          <p className="text-slate-500 mt-2">
            Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{email}</span> and choose a new password.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {info && !error && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            <CheckCircle2 size={18} className="shrink-0" />
            <p>{info}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="otp">
              Reset Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="w-full text-center tracking-[0.5em] text-lg font-semibold px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="------"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="newPassword">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                id="newPassword"
                type="password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition"
          >
            {cooldown > 0
              ? `Resend code in ${cooldown}s`
              : isResending
              ? "Resending..."
              : "Resend Code"}
          </button>
        </div>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-600">
            Wrong email?{" "}
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition">
              Start over
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
