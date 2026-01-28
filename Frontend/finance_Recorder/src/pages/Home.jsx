import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { 
  ShieldCheck, 
  TrendingUp, 
  History, 
  ArrowRight, 
  LayoutDashboard,
  // New icons for company logos
  Hexagon,
  Command,
  Activity,
  Triangle
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading FinTrack...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* ✅ Fixed Sidebar (only when logged in, desktop only) */}
      {user && (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-xl z-50 hidden md:block">
          <Sidebar />
        </aside>
      )}

      {/* ✅ Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out flex flex-col min-h-screen
        ${user ? "md:ml-64" : ""}`}
      >
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative bg-slate-900 text-white pt-24 pb-32 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-indigo-500 rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 border border-blue-700 text-blue-300 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              v2.0 is now live
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Cash Flow</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
              FinTrack is the smartest way to record credits, debits, and visualize transaction history. Secure, scalable, and designed for clarity.
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/signup"
                  className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-all"
                >
                  Login
                </Link>
              </div>
            ) : (
              <div className="flex justify-center">
                 <Link
                  to="/dashboard"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">
                Everything you need to stay organized
              </p>
              <p className="mt-4 text-slate-600 text-lg">
                Stop guessing where your money went. Our platform ensures total transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <InfoCard
                icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                title="Credit & Debit Recording"
                description="Log income and expenses effortlessly. Categorize every movement to understand your spending habits."
                color="emerald"
              />
              <InfoCard
                icon={<History className="w-6 h-6 text-blue-600" />}
                title="Transaction History"
                description="Keep a permanent, searchable ledger of all your financial movements for audits and personal insights."
                color="blue"
              />
              <InfoCard
                icon={<ShieldCheck className="w-6 h-6 text-indigo-600" />}
                title="Secure Infrastructure"
                description="Your data is encrypted and stored safely using JWT authentication and a robust MongoDB Atlas backend."
                color="indigo"
              />
            </div>
          </div>
        </section>

        {/* ================= SOCIAL PROOF / ENTERPRISE ================= */}
        <section className="py-20 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-10">
              Trusted by innovative teams at
            </p>

            {/* Added Icons to logos below */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-500">
              <CompanyLogo 
                name="ApexSoft" 
                icon={<Hexagon className="w-8 h-8 text-blue-600 fill-blue-100" />} 
              />
              <CompanyLogo 
                name="NovaFin" 
                icon={<Command className="w-8 h-8 text-indigo-600" />} 
              />
              <CompanyLogo 
                name="BlueWave" 
                icon={<Activity className="w-8 h-8 text-cyan-600" />} 
              />
              <CompanyLogo 
                name="Vertex" 
                icon={<Triangle className="w-8 h-8 text-emerald-600 fill-emerald-100" />} 
              />
            </div>
          </div>
        </section>

        {/* ================= CTA SECTION ================= */}
        {!user && (
          <section className="relative py-24 bg-blue-600 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
            
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to take control of your finances?
              </h3>
              <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of users who are managing their wealth smarter with FinTrack.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:bg-blue-50 hover:scale-105 transition-all duration-200"
              >
                Create Free Account
              </Link>
            </div>
          </section>
        )}
        
        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} FinTrack. Secure Finance Recording.</p>
        </footer>
      </main>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function InfoCard({ icon, title, description, color }) {
  const bgColors = {
    emerald: "bg-emerald-100",
    blue: "bg-blue-100",
    indigo: "bg-indigo-100"
  };

  return (
    <div className="group bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-14 h-14 ${bgColors[color] || "bg-slate-100"} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

// ✅ Updated CompanyLogo component to accept an 'icon' prop
function CompanyLogo({ name, icon }) {
  return (
    <div className="flex items-center justify-center gap-3 group cursor-default">
      {icon}
      <span className="text-2xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
        {name}
      </span>
    </div>
  );
}