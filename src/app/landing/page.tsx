"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import AuthModal from "@/components/modals/AuthModal";
import { useApp } from "@/context/AppContext";
import {
  BookOpen,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  Download,
  Users,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Layers,
  Zap,
  Lock,
  Plus,
  Minus,
} from "lucide-react";

export default function LandingPage() {
  const { user, setIsAuthModalOpen } = useApp();

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Mini interactive mock ledger for landing page
  const [mockEntries, setMockEntries] = useState([
    { id: 1, remark: "Counter cash retail sale", type: "IN", amount: 4500, time: "10:30 AM" },
    { id: 2, remark: "Vegetables & dairy stock", type: "OUT", amount: 1800, time: "11:15 AM" },
    { id: 3, remark: "UPI QR collection - customer", type: "IN", amount: 2200, time: "12:00 PM" },
  ]);

  const mockTotalIn = mockEntries.filter((e) => e.type === "IN").reduce((acc, curr) => acc + curr.amount, 0);
  const mockTotalOut = mockEntries.filter((e) => e.type === "OUT").reduce((acc, curr) => acc + curr.amount, 0);
  const mockNet = mockTotalIn - mockTotalOut;

  const faqs = [
    {
      q: "What is CashBook and how does it work?",
      a: "CashBook is a digital replacement for traditional paper ledger books (Bahi Khata). It allows shopkeepers, freelancers, and small businesses to record daily Cash-In and Cash-Out transactions, compute running balances automatically, and generate professional PDF & Excel statements.",
    },
    {
      q: "Can I import my existing Excel or CSV records?",
      a: "Yes! CashBook includes a powerful 4-step Excel/CSV import wizard. You can drag and drop any spreadsheet up to 10 MB (up to 10,000 rows). It automatically detects your columns (Date, In/Out, Remark, Category) and provides a 24-hour undo safety net.",
    },
    {
      q: "Can multiple team members manage the same cashbook?",
      a: "Absolutely. You can invite your partners, accountants, and store assistants by phone or email. You can grant specific roles: Owner, Admin, Editor, or Viewer with a live audit trail of who made which edits.",
    },
    {
      q: "Is CashBook free to use?",
      a: "Yes! The core digital ledger is completely free with unlimited cash transactions and imports. We offer up to 5 active cashbooks per business on our free tier.",
    },
    {
      q: "How safe and private is my financial data?",
      a: "Your data is strictly encrypted and protected with industry-standard security. We never share your transaction data with third parties, and you can download a full backup copy of your entire ledger anytime.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mb-6 animate-in fade-in slide-in-from-top-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>The Modern Digital Cashbook for Smart Businesses</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Track Every Rupee with{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
              Zero Confusion.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Replace paper bahi-khata and messy spreadsheets. Instant real-time running balances,
            customer credit dues, team permissions, and 1-click Excel import.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-xl shadow-blue-500/25 active:scale-95 transition flex items-center justify-center gap-2 group"
            >
              <span>Go to Ledger Dashboard</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm shadow-sm transition flex items-center justify-center"
            >
              Open Active Books
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free Forever Plan
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Encrypted & Private
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Excel Import Ready
            </span>
          </div>

          {/* INTERACTIVE MOCK LEDGER PREVIEW */}
          <div className="mt-14 max-w-4xl mx-auto rounded-3xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden p-5 sm:p-7 text-left">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-400 ml-2">Live Demo: Daily Shop Cashbook</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Interactive Preview
              </span>
            </div>

            {/* Mock stats cards */}
            <div className="grid grid-cols-3 gap-3 my-5">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Cash In</div>
                <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                  +₹{mockTotalIn.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
                <div className="text-[10px] font-bold text-red-600 uppercase">Cash Out</div>
                <div className="text-xl font-extrabold text-red-600 mt-0.5">
                  -₹{mockTotalOut.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-md">
                <div className="text-[10px] font-bold text-blue-200 uppercase">Net Balance</div>
                <div className="text-xl font-extrabold mt-0.5">
                  ₹{mockNet.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Mock interactive entries list */}
            <div className="space-y-2">
              {mockEntries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px]">{e.time}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{e.remark}</span>
                  </div>
                  <span
                    className={`font-extrabold ${
                      e.type === "IN" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {e.type === "IN" ? "+" : "-"}₹{e.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Mock add buttons to test reactivity */}
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-slate-400">
              <span>Try clicking buttons to test real-time balance calculations:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newId = Date.now();
                    setMockEntries([
                      ...mockEntries,
                      { id: newId, remark: "Counter cash inflow", type: "IN", amount: 1500, time: "Just now" },
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+₹1,500</span>
                </button>
                <button
                  onClick={() => {
                    const newId = Date.now();
                    setMockEntries([
                      ...mockEntries,
                      { id: newId, remark: "Shop expenses", type: "OUT", amount: 500, time: "Just now" },
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>-₹500</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Comprehensive Capabilities
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              Everything You Need to Run Your Business Finances
            </p>
            <p className="text-sm text-slate-500 mt-3">
              Designed from the ground up for retailers, wholesalers, service providers, and home finances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl border bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">Real-Time Running Balance</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every cash-in or cash-out transaction instantly recalculates running balances sequentially.
                Never worry about math errors or calculator slips.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl border bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">4-Step Excel / CSV Import</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Import your previous cashbooks with automated column detection, 50-row validation preview,
                currency normalization, and a 24-hour undo guarantee.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl border bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">Supplier & Customer Khata</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track party-wise dues (Who owes you vs Who you owe) and generate 1-click WhatsApp payment
                reminders with one tap.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl border bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">Team Roles & Activity Log</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Invite staff, partners, and accountants with Owner, Admin, Editor, or Viewer roles. Complete
                audit trail logs who edited or deleted every entry.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl border bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">PDF & Excel Reports</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Export crisp branded ledger statements in PDF format for tax audits or download styled
                Excel workbooks complete with formulas and colors.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl border bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">Offline-Ready & Backups</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mobile-first responsive interface that works flawlessly across phones, tablets, and desktop
                browsers. 1-click full JSON backup export anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Simple 3-Step Setup
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              Get Started in Less Than 60 Seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h3 className="font-extrabold text-lg">Create Business & Books</h3>
              <p className="text-xs text-slate-500">
                Sign in with your mobile OTP or email, name your business (Kirana, Services, Personal),
                and create your cashbooks.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h3 className="font-extrabold text-lg">Record Cash In & Cash Out</h3>
              <p className="text-xs text-slate-500">
                Hit &quot;+ Cash In&quot; or &quot;- Cash Out&quot; on your mobile phone, add remarks, categories,
                and attach bills. Running balances update in real-time.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h3 className="font-extrabold text-lg">Export & Share Reports</h3>
              <p className="text-xs text-slate-500">
                Download formatted Excel/PDF statements with one click, or send statements directly to
                partners and customers on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ ACCORDION */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Got Questions?
            </h2>
            <p className="text-3xl font-extrabold tracking-tight mt-2">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-500 leading-relaxed border-t pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto border-t bg-slate-100 dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight">CashBook</span>
            <span className="text-xs text-slate-400 ml-2">© 2026 CashBook. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link>
            <Link href="/reports" className="hover:text-blue-600 transition">Reports</Link>
            <Link href="/settings" className="hover:text-blue-600 transition">Backup & Privacy</Link>
          </div>
        </div>
      </footer>

      <AuthModal />
    </div>
  );
}
