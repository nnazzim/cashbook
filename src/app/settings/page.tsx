"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import AuthModal from "@/components/modals/AuthModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { useApp } from "@/context/AppContext";
import {
  Settings,
  User,
  Store,
  Globe,
  DollarSign,
  Download,
  Trash2,
  Tag,
  CreditCard,
  Plus,
  Check,
  Shield,
  Bell,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const {
    user,
    activeBusiness,
    language,
    setLanguage,
    currency,
    setCurrency,
    showToast,
    refreshUserData,
    deleteBusiness,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"PROFILE" | "BUSINESS" | "CATEGORIES" | "MODES" | "BACKUP">("PROFILE");
  const [isDeleteBizModalOpen, setIsDeleteBizModalOpen] = useState(false);

  // Profile Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Business Form State
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("");
  const [isSavingBiz, setIsSavingBiz] = useState(false);

  const handleDeleteBusiness = async () => {
    if (!activeBusiness?.id) return;
    await deleteBusiness(activeBusiness.id);
    showToast({
      title: "Business Deleted",
      message: `'${activeBusiness.name}' and all associated books have been deleted`,
      type: "info",
    });
  };

  // Categories & Modes State
  const [categories, setCategories] = useState<any[]>([]);
  const [modes, setModes] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("BOTH");
  const [newModeName, setNewModeName] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
    if (activeBusiness) {
      setBizName(activeBusiness.name || "");
      setBizType(activeBusiness.type || "");
      fetchCategoriesAndModes();
    }
  }, [user, activeBusiness]);

  const fetchCategoriesAndModes = async () => {
    if (!activeBusiness?.id) return;
    try {
      const [catRes, modeRes] = await Promise.all([
        fetch(`/api/categories?businessId=${activeBusiness.id}`),
        fetch(`/api/payment-modes?businessId=${activeBusiness.id}`),
      ]);
      const catData = await catRes.json();
      const modeData = await modeRes.json();
      if (catRes.ok) setCategories(catData.categories || []);
      if (modeRes.ok) setModes(modeData.paymentModes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, currency, language }),
      });
      if (res.ok) {
        showToast({ title: "Profile Updated", type: "success" });
        refreshUserData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;
    setIsSavingBiz(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: activeBusiness.id, name: bizName, type: bizType }),
      });
      if (res.ok) {
        showToast({ title: "Business Details Updated", type: "success" });
        refreshUserData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingBiz(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !activeBusiness?.id) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          name: newCatName.trim(),
          type: newCatType,
        }),
      });
      if (res.ok) {
        setNewCatName("");
        fetchCategoriesAndModes();
        showToast({ title: "Category added", type: "success" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      fetchCategoriesAndModes();
      showToast({ title: "Category deleted", type: "info" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModeName.trim() || !activeBusiness?.id) return;
    try {
      const res = await fetch("/api/payment-modes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          name: newModeName.trim(),
        }),
      });
      if (res.ok) {
        setNewModeName("");
        fetchCategoriesAndModes();
        showToast({ title: "Payment mode added", type: "success" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMode = async (id: string) => {
    try {
      await fetch(`/api/payment-modes?id=${id}`, { method: "DELETE" });
      fetchCategoriesAndModes();
      showToast({ title: "Payment mode removed", type: "info" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Settings className="w-3.5 h-3.5" />
              <span>Preferences & Data Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure currencies, languages, custom categories, and download full data backups.
            </p>
          </div>

          {/* Settings Tabs */}
          <div className="flex flex-wrap gap-2 border-b pb-2 text-xs font-semibold">
            {[
              { id: "PROFILE", label: "User Profile", icon: User },
              { id: "BUSINESS", label: "Business Details", icon: Store },
              { id: "CATEGORIES", label: "Custom Categories", icon: Tag },
              { id: "MODES", label: "Payment Modes", icon: CreditCard },
              { id: "BACKUP", label: "Data Backup & Privacy", icon: Download },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: USER PROFILE */}
          {activeTab === "PROFILE" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm max-w-xl space-y-4">
              <h3 className="font-extrabold text-base">Your Personal Profile</h3>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Default Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none font-semibold"
                    >
                      <option value="INR">₹ INR (Indian Rupee)</option>
                      <option value="USD">$ USD (US Dollar)</option>
                      <option value="EUR">€ EUR (Euro)</option>
                      <option value="GBP">£ GBP (British Pound)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="SAR">SAR (Saudi Riyal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none font-semibold"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="ml">മലയാളം (Malayalam)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition"
                  >
                    {isSavingProfile ? "Saving..." : "Save Profile Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: BUSINESS DETAILS */}
          {activeTab === "BUSINESS" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm max-w-xl space-y-4">
              <h3 className="font-extrabold text-base">Store & Business Details</h3>
              <form onSubmit={handleSaveBusiness} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Business / Store Name
                  </label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Business Type
                  </label>
                  <select
                    value={bizType}
                    onChange={(e) => setBizType(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none font-semibold"
                  >
                    <option value="Kirana / Retail Store">Kirana / Retail Store</option>
                    <option value="Services & Consultancy">Services & Consultancy</option>
                    <option value="Personal & Family">Personal & Family</option>
                    <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingBiz}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition"
                  >
                    {isSavingBiz ? "Saving..." : "Update Business Details"}
                  </button>
                </div>
              </form>

              {/* Danger Zone: Delete Business */}
              {activeBusiness && (
                <div className="mt-8 pt-6 border-t border-red-100 dark:border-red-950/60">
                  <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900 space-y-3">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Danger Zone: Delete Business</span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
                      Permanently delete <strong>&quot;{activeBusiness?.name}&quot;</strong> and all of its associated cashbooks, records, and categories. This action cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsDeleteBizModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete &quot;{activeBusiness?.name}&quot;</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM CATEGORIES */}
          {activeTab === "CATEGORIES" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-5 max-w-2xl">
              <div>
                <h3 className="font-extrabold text-base">Manage Categories</h3>
                <p className="text-xs text-slate-500">Create custom tags for grouping sales and expenditures.</p>
              </div>

              {/* Add category form */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none"
                />
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value)}
                  className="px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                >
                  <option value="BOTH">In & Out</option>
                  <option value="IN">Cash In</option>
                  <option value="OUT">Cash Out</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>

              {/* Categories list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || "#3b82f6" }} />
                      <span className="font-bold">{c.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">({c.type})</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT MODES */}
          {activeTab === "MODES" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-5 max-w-2xl">
              <div>
                <h3 className="font-extrabold text-base">Payment Methods</h3>
                <p className="text-xs text-slate-500">Configure modes like Cash, UPI, Cheque, Bank Transfer.</p>
              </div>

              {/* Add mode form */}
              <form onSubmit={handleAddMode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Mode Name (e.g. Sodexo, PhonePe)"
                  value={newModeName}
                  onChange={(e) => setNewModeName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>

              {/* Modes list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {modes.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-bold">{m.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteMode(m.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BACKUP & DATA PRIVACY */}
          {activeTab === "BACKUP" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm max-w-xl space-y-5">
              <div>
                <h3 className="font-extrabold text-base">Complete Data Backup</h3>
                <p className="text-xs text-slate-500">
                  Export all your businesses, books, categories, and ledger entries in a single structured JSON archive.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs">Full JSON Dump (.json)</div>
                  <div className="text-[11px] text-slate-400">Includes all ledger entries and attachments metadata</div>
                </div>

                <a
                  href="/api/settings/backup"
                  download
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </a>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-bold text-xs text-red-600">Danger Zone</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deleting your account will irreversibly delete all your books and business entries.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Please contact support to permanently purge your account.")}
                  className="mt-3 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteBizModalOpen}
        onClose={() => setIsDeleteBizModalOpen(false)}
        onConfirm={handleDeleteBusiness}
        itemType="business"
        itemName={activeBusiness?.name || "this business"}
      />
      <AuthModal />
    </div>
  );
}
