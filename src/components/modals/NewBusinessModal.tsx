"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Store, Plus, X, Sparkles, BookOpen } from "lucide-react";

export default function NewBusinessModal({
  onBusinessCreated,
}: {
  onBusinessCreated?: (newBiz: any) => void;
}) {
  const {
    isNewBusinessModalOpen,
    setIsNewBusinessModalOpen,
    setIsNewBookModalOpen,
    createBusiness,
    showToast,
  } = useApp();

  const [name, setName] = useState("");
  const [type, setType] = useState("Services & Non-Profit");
  const [currency, setCurrency] = useState("INR");
  const [initialBookName, setInitialBookName] = useState("Daily Counter Cashbook");
  const [addAnotherBookAfter, setAddAnotherBookAfter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isNewBusinessModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name for your business or store");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const biz = await createBusiness({
        name: name.trim(),
        type,
        currency,
        initialBookName: initialBookName.trim() || "Main Cashbook",
      });

      showToast({
        title: "Business Created!",
        message: `'${name}' created with book '${initialBookName || "Main Cashbook"}'`,
        type: "success",
      });

      setIsNewBusinessModalOpen(false);
      setName("");
      setInitialBookName("Daily Counter Cashbook");
      onBusinessCreated?.(biz);

      if (addAnotherBookAfter) {
        setTimeout(() => {
          setIsNewBookModalOpen(true);
        }, 300);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border shadow-2xl overflow-hidden p-6 sm:p-7">
        <button
          onClick={() => setIsNewBusinessModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Store className="w-4 h-4" />
          <span>New Business Entity</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight">Create New Business</h3>
        <p className="text-xs text-slate-500 mt-1">
          Add an organization, branch, or retail store. You can manage unlimited books inside each business.
        </p>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Business / Store Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. SSF Anakkayam Sector Finance ledger, Unit 1, Metro Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Business Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="Services & Non-Profit">Services & Non-Profit</option>
                <option value="Kirana / Retail Store">Kirana / Retail Store</option>
                <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                <option value="Personal & Family">Personal & Family</option>
                <option value="Freelancing & Agency">Freelancing & Agency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Primary Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="SAR">SAR (Saudi Riyal)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="GBP">£ GBP (British Pound)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Initial Book Setup</span>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                First Cashbook Name
              </label>
              <input
                type="text"
                placeholder="e.g. Daily Counter Cashbook, Petty Cash, Event Ledger"
                value={initialBookName}
                onChange={(e) => setInitialBookName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Your business is created with this initial ledger. You can add more books anytime.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="addAnotherBook"
              checked={addAnotherBookAfter}
              onChange={(e) => setAddAnotherBookAfter(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="addAnotherBook" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              Open book creation wizard immediately after to add another book
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsNewBusinessModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
            >
              {loading ? (
                <span>Creating Business...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Business & Books</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
