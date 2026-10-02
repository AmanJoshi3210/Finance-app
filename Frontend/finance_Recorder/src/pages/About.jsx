import React from "react";
import { Link } from "react-router-dom";
import {
  Accessibility,
  ArrowRight,
  Bell,
  BellRing,
  FileDown,
  Info,
  LayoutDashboard,
  List,
  PiggyBank,
  PlusCircle,
  Repeat,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Wallet,
} from "lucide-react";

// Accent classes are written out in full (never built by string concatenation)
// so Tailwind's scanner can see them and keep them in the bundle.
const ACCENTS = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
};

// Every service the app offers, grouped by the job it does for you. `what`
// describes the feature; `daily` is the reason it matters on an ordinary day.
const SERVICE_GROUPS = [
  {
    id: "record",
    label: "Record",
    title: "Record money as it moves",
    blurb: "The daily basics — a few taps whenever money comes in or goes out.",
    services: [
      {
        icon: <PlusCircle size={22} />,
        accent: "blue",
        name: "Add Transaction",
        to: "/add",
        what: "Log a credit or debit with its amount, category, account and date.",
        daily:
          "The morning coffee, the cab fare and the salary each take seconds to record, so nothing has to be reconstructed from memory at month end.",
      },
      {
        icon: <List size={22} />,
        accent: "indigo",
        name: "Transaction History",
        to: "/transactions",
        what:
          "Search and filter the full ledger by type, category or date range, then export what you see to CSV or Excel.",
        daily:
          "“When did I pay the electricity bill?” becomes a five-second search instead of scrolling through a bank app.",
      },
      {
        icon: <Wallet size={22} />,
        accent: "emerald",
        name: "Accounts",
        to: "/accounts",
        what:
          "Keep bank accounts, cash and wallets side by side, each with its own running balance.",
        daily:
          "You can tell which account actually holds the money before promising it to someone.",
      },
      {
        icon: <Upload size={22} />,
        accent: "violet",
        name: "Import from CSV",
        to: "/import",
        what:
          "Upload a bank statement, match its columns to the app's fields once, and bring in months of history in a single pass.",
        daily:
          "Getting started doesn't mean typing a year of transactions by hand.",
      },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    title: "Plan before the month runs away",
    blurb: "Set the limits and the schedule once, then let the app do the remembering.",
    services: [
      {
        icon: <Target size={22} />,
        accent: "amber",
        name: "Budget & Category Limits",
        to: "/settings",
        what:
          "Set one monthly spending cap, plus optional per-category limits for groceries, travel, bills and the rest.",
        daily:
          "Before an unplanned purchase you can see how much of this month's budget is genuinely still free.",
      },
      {
        icon: <Repeat size={22} />,
        accent: "indigo",
        name: "Recurring Transactions",
        to: "/recurring-transactions",
        what:
          "Describe rent, salary, EMIs or subscriptions once with a frequency and a next run date, and they post themselves.",
        daily:
          "Fixed, predictable money stops competing for your attention — only the unusual spending needs a decision.",
      },
      {
        icon: <BellRing size={22} />,
        accent: "rose",
        name: "Bill Reminders",
        to: "/bill-reminders",
        what: "Track what is due, when it is due, and whether it has been paid.",
        daily:
          "Due dates arrive with a nudge rather than a late fee, even in a busy week.",
      },
      {
        icon: <PiggyBank size={22} />,
        accent: "emerald",
        name: "Savings Goals",
        to: "/savings-goals",
        what:
          "Name a goal, set a target amount, and watch the progress bar fill as you put money aside.",
        daily:
          "A trip or a new laptop turns into a visible number you are moving towards, not a vague someday.",
      },
    ],
  },
  {
    id: "understand",
    label: "Understand",
    title: "See the full picture",
    blurb: "The numbers turned into something you can actually read.",
    services: [
      {
        icon: <LayoutDashboard size={22} />,
        accent: "blue",
        name: "Dashboard",
        to: "/dashboard",
        what:
          "Net balance, income and expenses at the top; recent activity, account balances and a budget forecast below.",
        daily:
          "One glance over morning tea answers the only question that matters: am I ahead or behind this month?",
      },
      {
        icon: <FileDown size={22} />,
        accent: "violet",
        name: "Monthly History & PDF Report",
        to: "/previous-months-summary",
        what:
          "Month-by-month summaries of what came in and what went out, exportable as a PDF report.",
        daily:
          "Comparing March with February takes a moment, and the PDF is ready to share with family or an accountant.",
      },
      {
        icon: <Bell size={22} />,
        accent: "amber",
        name: "Alerts & Summaries",
        to: "/settings",
        what:
          "Opt into budget limit alerts, a weekly snapshot, and flags on sudden spikes in spending.",
        daily:
          "You hear about a problem while there is still time to react, instead of discovering it afterwards.",
      },
    ],
  },
  {
    id: "comfort",
    label: "Comfort & trust",
    title: "Made to fit how you work",
    blurb: "The app adapts to you — and keeps your records to itself.",
    services: [
      {
        icon: <Accessibility size={22} />,
        accent: "indigo",
        name: "Appearance & Accessibility",
        to: "/settings",
        what:
          "Light or dark theme, four text sizes, bolder text, high contrast, underlined links and reduced motion.",
        daily:
          "Checking your balance at night, on a bright train platform, or with tired eyes stays comfortable.",
      },
      {
        icon: <ShieldCheck size={22} />,
        accent: "emerald",
        name: "Account Security",
        to: "/settings",
        what:
          "Email-verified sign-up, token-based sessions, password reset and recovery, all scoped to your own account.",
        daily:
          "Your financial history is private by default, and regaining access never means losing your data.",
      },
    ],
  },
];

// The rhythm the app is designed around, used by the "How it fits" timeline.
const MONTH_RHYTHM = [
  {
    when: "As it happens",
    text:
      "Log the transaction, or let a recurring entry do it for you. Nothing to tidy up later.",
  },
  {
    when: "Twice a week",
    text:
      "Glance at the Dashboard. Income, expenses and the budget forecast are already calculated.",
  },
  {
    when: "Before a due date",
    text: "Bill reminders and budget alerts tell you what needs attention.",
  },
  {
    when: "At month end",
    text:
      "Export the summary as a PDF, compare it with last month, and adjust next month's limits.",
  },
];

export default function About() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white px-6 py-12 md:px-12 md:py-16">
        <div className="absolute inset-0 opacity-25" aria-hidden="true">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-blue-500 blur-[100px]" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-indigo-500 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-200 text-xs font-semibold tracking-wide uppercase">
            <Info size={14} />
            About FinTrack
          </p>

          {/* Starts at h2: the Navbar already owns this page's h1 ("About FinTrack"). */}
          <h2 className="mt-6 text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Everything your money does, in one{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              honest place
            </span>
          </h2>

          <p className="mt-5 text-base md:text-lg text-slate-300 leading-relaxed">
            FinTrack records credits and debits, keeps your accounts and budgets
            in order, and turns the result into something you can read in a few
            seconds. Below is every service it offers and what each one changes
            about an ordinary day.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/30 transition-colors"
            >
              <LayoutDashboard size={18} />
              Go to Dashboard
            </Link>
            <Link
              to="/add"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-colors"
            >
              <PlusCircle size={18} />
              Record a transaction
            </Link>
          </div>
        </div>
      </section>

      {/* ================= JUMP LINKS ================= */}
      <nav aria-label="Sections on this page" className="mt-8 flex flex-wrap gap-2">
        {SERVICE_GROUPS.map((group) => (
          <a
            key={group.id}
            href={`#${group.id}`}
            className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {group.label}
          </a>
        ))}
      </nav>

      {/* ================= SERVICES ================= */}
      {SERVICE_GROUPS.map((group) => (
        <section
          key={group.id}
          id={group.id}
          aria-labelledby={`${group.id}-heading`}
          className="mt-12 scroll-mt-24"
        >
          <h3
            id={`${group.id}-heading`}
            className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100"
          >
            {group.title}
          </h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{group.blurb}</p>

          <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 list-none">
            {group.services.map((service) => (
              <ServiceCard key={service.name} {...service} />
            ))}
          </ul>
        </section>
      ))}

      {/* ================= HOW IT FITS A MONTH ================= */}
      <section aria-labelledby="rhythm-heading" className="mt-14">
        <h3
          id="rhythm-heading"
          className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100"
        >
          How it fits into a month
        </h3>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Four small habits — the app is built so none of them take more than a minute.
        </p>

        <ol className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 list-none">
          {MONTH_RHYTHM.map((step, index) => (
            <li
              key={step.when}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm"
            >
              <span
                className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-600 text-white text-sm font-bold"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h4 className="mt-4 font-semibold text-slate-800 dark:text-slate-100">
                {step.when}
              </h4>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ================= CLOSING NOTE ================= */}
      <section
        aria-labelledby="privacy-heading"
        className="mt-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <span
            className="flex items-center justify-center h-12 w-12 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
            aria-hidden="true"
          >
            <ShieldCheck size={24} />
          </span>
          <div className="flex-1">
            <h3
              id="privacy-heading"
              className="text-lg font-bold text-slate-800 dark:text-slate-100"
            >
              Your records belong to you
            </h3>
            <p className="mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
              Every transaction, account and goal is tied to your verified login
              and visible only to you. You can export the whole history to CSV,
              Excel or PDF whenever you want it elsewhere.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors shrink-0"
          >
            Open Settings
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-slate-400 dark:text-slate-500">
        FinTrack &mdash; secure finance recording. Built by Aman Joshi.
      </p>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function ServiceCard({ icon, accent, name, to, what, daily }) {
  return (
    <li className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <span
        className={`flex items-center justify-center h-12 w-12 rounded-xl ${ACCENTS[accent]} group-hover:scale-105 transition-transform duration-300`}
        aria-hidden="true"
      >
        {icon}
      </span>

      <h4 className="mt-5 text-lg font-bold text-slate-800 dark:text-slate-100">
        {name}
      </h4>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {what}
      </p>

      <div className="mt-4 flex gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
        <Sparkles
          size={16}
          className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            In daily life:{" "}
          </span>
          {daily}
        </p>
      </div>

      <Link
        to={to}
        className="mt-auto pt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-blue-700 dark:text-blue-300 hover:gap-2.5 transition-all"
      >
        Open {name}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </li>
  );
}
