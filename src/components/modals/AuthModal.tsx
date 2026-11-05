"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Phone,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Store,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Home,
  Layers,
} from "lucide-react";

export default function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, setIsAuthModalOpen, refreshUserData, showToast } = useApp();

  const [authMode, setAuthMode] = useState<"otp" | "password" | "register" | "onboarding">("otp");
  const [phone, setPhone] = useState("9876543210");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [serverOtp, setServerOtp] = useState<string | null>(null);

  // Email / Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("Kirana / Retail Store");
  const [businessName, setBusinessName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  // 1-Click Demo Login
  const handleDemoLogin = async (role: "owner" | "staff") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({
          title: "Logged in as Demo User",
          message: role === "owner" ? "Welcome back, Store Owner!" : "Welcome back, Staff Editor!",
          type: "success",
        });
        setIsAuthModalOpen(false);
        await refreshUserData();
        router.push("/dashboard");
      } else {
        setError(data.error || "Demo login failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setServerOtp(data.otp);
        setOtp(data.otp); // Pre-fill for instant frictionless demo experience
        showToast({
          title: "OTP Sent",
          message: `Verification code: ${data.otp}`,
          type: "info",
        });
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, name }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresOnboarding) {
          setAuthMode("onboarding");
        } else {
          showToast({ title: "Welcome to CashBook", message: "Signed in successfully!", type: "success" });
          setIsAuthModalOpen(false);
          await refreshUserData();
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Invalid OTP code");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ title: "Welcome back!", message: `Logged in as ${data.user.name}`, type: "success" });
        setIsAuthModalOpen(false);
        await refreshUserData();
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, businessType, businessName }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ title: "Account Created!", message: "Welcome to CashBook!", type: "success" });
        setIsAuthModalOpen(false);
        await refreshUserData();
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to register");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Onboarding Submit
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName || `${phone.slice(-4)} Store`,
          businessType,
          bookName: "Daily Cashbook",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ title: "Setup Complete", message: "Your ledger is ready!", type: "success" });
        setIsAuthModalOpen(false);
        await refreshUserData();
        router.push("/dashboard");
      } else {
        setError(data.error || "Onboarding failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border shadow-2xl overflow-hidden p-6 sm:p-8">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M7 8h10M7 12h6M7 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {authMode === "onboarding" ? "Setup Your Business" : "Welcome to CashBook"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {authMode === "onboarding"
              ? "Select your business type to organize your books"
              : "Digital Cash-In / Cash-Out Ledger for Small Businesses"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Demo Section (Visible when not onboarding) */}
        {authMode !== "onboarding" && (
          <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Instant Demo Access
              </span>
              <span className="text-[10px] bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-medium">
                No password required
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("owner")}
                disabled={loading}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:shadow-sm transition flex flex-col items-start"
              >
                <span className="text-blue-600 font-bold">Store Owner</span>
                <span className="text-[10px] text-slate-400 font-normal">Full admin & books</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("staff")}
                disabled={loading}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:shadow-sm transition flex flex-col items-start"
              >
                <span className="text-emerald-600 font-bold">Store Staff</span>
                <span className="text-[10px] text-slate-400 font-normal">Editor permissions</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        {authMode !== "onboarding" && (
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-5 text-xs font-semibold">
            <button
              onClick={() => { setAuthMode("otp"); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg transition ${authMode === "otp" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500"}`}
            >
              Phone OTP
            </button>
            <button
              onClick={() => { setAuthMode("password"); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg transition ${authMode === "password" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500"}`}
            >
              Email Login
            </button>
            <button
              onClick={() => { setAuthMode("register"); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg transition ${authMode === "register" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500"}`}
            >
              Register
            </button>
          </div>
        )}

        {/* PHONE OTP MODE */}
        {authMode === "otp" && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mobile Phone Number
                  </label>
                  <div className="relative mt-1 flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-r-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try with demo phone 9876543210 or your own number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>{loading ? "Sending OTP..." : "Get OTP Code"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <span>OTP sent to +91 {phone}</span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] font-semibold underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    Demo OTP is <span className="font-mono font-bold text-blue-600">123456</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* EMAIL & PASSWORD LOGIN */}
        {authMode === "password" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address or Phone
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  placeholder="demo@cashbook.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                For demo account, password is <span className="font-mono">password123</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition"
            >
              {loading ? "Signing In..." : "Sign In with Password"}
            </button>
          </form>
        )}

        {/* REGISTRATION */}
        {authMode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Ramesh Gupta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="ramesh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Kirana / Retail Store">Kirana / Retail Store</option>
                <option value="Services & Consultancy">Services & Consultancy</option>
                <option value="Personal & Family">Personal & Family</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow transition"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}

        {/* ONBOARDING MODE */}
        {authMode === "onboarding" && (
          <form onSubmit={handleOnboarding} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                What is your store / business name?
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Balaji Provision Store, My Freelance Ledger"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                Select your business category:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Kirana / Retail Store", label: "Kirana / Store", icon: Store },
                  { id: "Services & Consultancy", label: "Services", icon: Briefcase },
                  { id: "Personal & Family", label: "Personal", icon: Home },
                  { id: "Other", label: "Other", icon: Layers },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = businessType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setBusinessType(type.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
            >
              {loading ? "Setting Up..." : "Launch My CashBook"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
