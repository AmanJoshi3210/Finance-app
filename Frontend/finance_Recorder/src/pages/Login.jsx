import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { Mail, Lock, Loader2, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // ✅ Added loading state

  const location = useLocation();
  const [info, setInfo] = useState(location.state?.message || "");
  const { login, token } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true); // Start loading

    try {
      const res = await axiosInstance.post("/api/users/login", {
        email: email.trim(),
        password: password.trim(),
      });

      const data = res.data;

      // 2FA enabled: no token yet — a code was emailed. Finish on the OTP
      // screen in "login" mode (verifies against /verify-login-otp).
      if (data.twoFactorRequired) {
        navigate("/verify-otp", {
          state: {
            email: data.email || email.trim(),
            mode: "login",
            message: "Enter the code we sent to finish signing in.",
          },
        });
        return;
      }

      login(data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);

      // Unverified accounts can't log in yet — send them to finish the
      // 2-step signup verification instead of just showing an error.
      if (err.response?.data?.requiresVerification) {
        navigate("/verify-otp", {
          state: {
            email: err.response.data.email || email.trim(),
            message: "Please verify your email to continue.",
          },
        });
        return;
      }

      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
      setIsLoading(false); // Stop loading on error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Decor (Optional) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl"></div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
            <LogIn size={24} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 mt-2">Enter your credentials to access FinTrack</p>
        </div>

        {/* Info Alert */}
        {info && !error && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            <CheckCircle2 size={18} className="shrink-0" />
            <p>{info}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                id="password"
                type="password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-600">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}