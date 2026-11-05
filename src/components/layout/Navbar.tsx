"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  BookOpen,
  ChevronDown,
  Plus,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  Shield,
  Store,
  Layers,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const {
    user,
    businesses,
    activeBusiness,
    setActiveBusiness,
    language,
    setLanguage,
    theme,
    toggleTheme,
    currencySymbol,
    setIsAuthModalOpen,
    setIsNewBookModalOpen,
    showToast,
    refreshUserData,
  } = useApp();

  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [newBizModalOpen, setNewBizModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newBizType, setNewBizType] = useState("Kirana / Retail Store");
  const [isCreatingBiz, setIsCreatingBiz] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await refreshUserData();
      showToast({ title: "Logged out", message: "You have been logged out safely.", type: "info" });
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;
    setIsCreatingBiz(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBizName.trim(), type: newBizType }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ title: "Business Created", message: `Business '${newBizName}' ready!`, type: "success" });
        setNewBizModalOpen(false);
        setNewBizName("");
        await refreshUserData();
        if (data.business) setActiveBusiness(data.business);
      } else {
        showToast({ title: "Error", message: data.error, type: "error" });
      }
    } catch (err: any) {
      showToast({ title: "Error", message: err.message, type: "error" });
    } finally {
      setIsCreatingBiz(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Business Selector */}
          <div className="flex items-center gap-3 md:gap-6">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 8h10M7 12h6M7 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="17" cy="14" r="2.5" className="fill-emerald-500 text-emerald-500" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  CashBook
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 -mt-1 hidden sm:inline">
                  Digital Ledger
                </span>
              </div>
            </Link>

            {/* Business Switcher Dropdown (when logged in) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 text-xs sm:text-sm font-medium transition"
                >
                  <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="max-w-[120px] sm:max-w-[180px] truncate font-semibold">
                    {activeBusiness?.name || "Select Business"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {bizDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 rounded-xl border bg-white dark:bg-slate-900 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95"
                    onClick={() => setBizDropdownOpen(false)}
                  >
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                      Your Businesses
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {businesses.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setActiveBusiness(b)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs sm:text-sm transition ${
                            activeBusiness?.id === b.id
                              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="truncate">
                            <div>{b.name}</div>
                            <span className="text-[10px] text-slate-400 capitalize">{b.type}</span>
                          </div>
                          {activeBusiness?.id === b.id && (
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="border-t my-2 pt-2">
                      <button
                        onClick={() => setNewBizModalOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Business
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="text-xs font-medium bg-slate-100 dark:bg-slate-800 border rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ml">മലയാളം</option>
            </select>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile or Login CTA */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:ring-2 hover:ring-blue-500/20 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user.name?.charAt(0) || "U"}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border bg-white dark:bg-slate-900 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b">
                      <div className="font-semibold text-sm truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email || user.phone}</div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        <Shield className="w-3 h-3" />
                        Free Ledger Plan
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <Layers className="w-4 h-4 text-slate-500" />
                        Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Settings & Backups
                      </Link>
                    </div>

                    <div className="border-t pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Login / Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* New Business Modal */}
      {newBizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border shadow-2xl p-6">
            <h3 className="text-lg font-bold">Create New Business</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a shop, freelancing profile, or personal ledger.
            </p>
            <form onSubmit={handleCreateBusiness} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business / Store Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Mart, Personal Ledger"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business Type
                </label>
                <select
                  value={newBizType}
                  onChange={(e) => setNewBizType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Kirana / Retail Store">Kirana / Retail Store</option>
                  <option value="Services & Consultancy">Services & Consultancy</option>
                  <option value="Personal & Family">Personal & Family</option>
                  <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setNewBizModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBiz}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition"
                >
                  {isCreatingBiz ? "Creating..." : "Create Business"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
