"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { BookOpen, CreditCard, X, Check, Store, Plus } from "lucide-react";

export default function NewBookModal({
  onBookCreated,
}: {
  onBookCreated?: (newBook: any) => void;
}) {
  const {
    isNewBookModalOpen,
    setIsNewBookModalOpen,
    setIsNewBusinessModalOpen,
    activeBusiness,
    businesses,
    setActiveBusiness,
    currencySymbol,
    showToast,
    refreshUserData,
  } = useApp();

  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"CASH" | "CREDIT_DEBIT">("CASH");
  const [initialBalance, setInitialBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeBusiness?.id) {
      setSelectedBusinessId(activeBusiness.id);
    } else if (businesses.length > 0) {
      setSelectedBusinessId(businesses[0].id);
    }
  }, [activeBusiness?.id, businesses]);

  if (!isNewBookModalOpen) return null;

  const currentTargetBiz = businesses.find((b) => b.id === selectedBusinessId) || activeBusiness;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name for this book");
      return;
    }

    const targetBizId = selectedBusinessId || activeBusiness?.id;
    if (!targetBizId) {
      setError("Please select or create a business first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: targetBizId,
          name: name.trim(),
          type,
          initialBalance: parseFloat(initialBalance) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast({
          title: "Book Created!",
          message: `'${name}' added to ${currentTargetBiz?.name || "your business"}`,
          type: "success",
        });
        setIsNewBookModalOpen(false);
        setName("");
        setInitialBalance("0");
        await refreshUserData();
        if (currentTargetBiz && activeBusiness?.id !== currentTargetBiz.id) {
          setActiveBusiness(currentTargetBiz);
        }
        onBookCreated?.(data.book);
      } else {
        setError(data.error || "Failed to create book");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border shadow-2xl overflow-hidden p-6 sm:p-7">
        <button
          onClick={() => setIsNewBookModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>New Ledger Book</span>
        </div>

        <h3 className="text-xl font-extrabold tracking-tight">Add New Book</h3>
        <p className="text-xs text-slate-500 mt-1">
          Create a separate cashbook for shop sales, supplier dues, or daily counter cash.
        </p>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Target Business Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Business
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsNewBookModalOpen(false);
                  setIsNewBusinessModalOpen(true);
                }}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ New Business</span>
              </button>
            </div>
            {businesses.length > 1 ? (
              <select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.type})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Store className="w-4 h-4 text-blue-600" />
                <span className="truncate">{currentTargetBiz?.name || "SSF Anakkayam Sector Finance ledger"}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Book Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Counter Cash, Bank Account, Trip Expenses, Supplier Khata"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Book Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("CASH")}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  type === "CASH"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  {type === "CASH" && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="font-bold text-xs mt-1">Cash In / Cash Out</div>
                <div className="text-[10px] text-slate-400">Daily shop sales & expenses</div>
              </button>

              <button
                type="button"
                onClick={() => setType("CREDIT_DEBIT")}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  type === "CREDIT_DEBIT"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  {type === "CREDIT_DEBIT" && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="font-bold text-xs mt-1">Credit / Debit Khata</div>
                <div className="text-[10px] text-slate-400">Supplier dues & customer khata</div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Opening / Initial Balance ({currencySymbol})
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Starting cash balance present in the drawer or account.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsNewBookModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition"
            >
              {loading ? "Creating..." : "Create Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
