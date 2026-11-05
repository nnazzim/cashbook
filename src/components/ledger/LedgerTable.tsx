"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Tag,
  CreditCard,
  User,
  Paperclip,
  MoreVertical,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Copy,
  ArrowRightLeft,
  Download,
  Share2,
  RotateCcw,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import EntryModal from "@/components/modals/EntryModal";
import ShareModal from "@/components/modals/ShareModal";

interface LedgerTableProps {
  bookId: string;
  bookDetails: any;
  onRefresh?: () => void;
  availableBooks?: { id: string; name: string }[];
}

export default function LedgerTable({
  bookId,
  bookDetails,
  onRefresh,
  availableBooks = [],
}: LedgerTableProps) {
  const { currencySymbol, t, showToast, openImportModal } = useApp();

  // Data state
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, netBalance: 0, count: 0 });

  // Filters state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [datePreset, setDatePreset] = useState<"ALL" | "TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"DAILY" | "MONTHLY" | "ALL">("ALL");

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState<"IN" | "OUT">("IN");
  const [entryToEdit, setEntryToEdit] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeMenuEntryId, setActiveMenuEntryId] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);

  // Fetch entries
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ bookId });
      if (search.trim()) params.append("search", search.trim());
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (categoryFilter !== "ALL") params.append("categoryId", categoryFilter);
      if (modeFilter !== "ALL") params.append("paymentModeId", modeFilter);

      // Date resolution
      const now = new Date();
      if (datePreset === "TODAY") {
        const todayStr = now.toISOString().split("T")[0];
        params.append("startDate", todayStr);
        params.append("endDate", todayStr);
      } else if (datePreset === "YESTERDAY") {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yStr = y.toISOString().split("T")[0];
        params.append("startDate", yStr);
        params.append("endDate", yStr);
      } else if (datePreset === "WEEK") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.append("startDate", weekAgo.toISOString().split("T")[0]);
        params.append("endDate", now.toISOString().split("T")[0]);
      } else if (datePreset === "MONTH") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        params.append("startDate", monthStart.toISOString().split("T")[0]);
        params.append("endDate", now.toISOString().split("T")[0]);
      } else if (datePreset === "CUSTOM") {
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
      }

      const res = await fetch(`/api/entries?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
        setSummary(data.summary || { totalIn: 0, totalOut: 0, netBalance: 0, count: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [bookId, search, typeFilter, datePreset, startDate, endDate, categoryFilter, modeFilter]);

  // Keyboard shortcut listener ('N' for new entry, '+' for Cash In, '-' for Cash Out)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEntryToEdit(null);
        setEntryModalType("IN");
        setIsEntryModalOpen(true);
      } else if (e.key === "+") {
        e.preventDefault();
        setEntryToEdit(null);
        setEntryModalType("IN");
        setIsEntryModalOpen(true);
      } else if (e.key === "-") {
        e.preventDefault();
        setEntryToEdit(null);
        setEntryModalType("OUT");
        setIsEntryModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Quick Duplicate Entry
  const handleDuplicate = async (entry: any) => {
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          type: entry.type,
          amount: entry.amount,
          remark: `${entry.remark} (Copy)`,
          categoryName: entry.categoryName,
          paymentModeName: entry.paymentModeName,
          partyName: entry.partyName,
          partyPhone: entry.partyPhone,
        }),
      });
      if (res.ok) {
        showToast({ title: "Duplicated", message: `Copied ${entry.remark}`, type: "success" });
        fetchEntries();
        onRefresh?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Soft Delete with Undo Toast
  const handleDelete = async (entry: any) => {
    try {
      const res = await fetch(`/api/entries?entryId=${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEntries();
        onRefresh?.();
        showToast({
          title: "Entry Deleted",
          message: `${entry.remark} removed`,
          type: "warning",
          undoLabel: "Undo Delete",
          undoAction: async () => {
            await fetch(`/api/entries/${entry.id}/restore`, { method: "POST" });
            fetchEntries();
            onRefresh?.();
            showToast({ title: "Restored", message: "Entry recovered successfully", type: "success" });
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Group entries for Daily or Monthly view
  const groupedEntries = useMemo(() => {
    if (viewMode === "ALL") {
      return [
        {
          groupTitle: "All Transactions",
          items: entries,
          groupIn: summary.totalIn,
          groupOut: summary.totalOut,
        },
      ];
    }

    const map = new Map<string, any[]>();
    entries.forEach((entry) => {
      const d = new Date(entry.date);
      let key = "";
      if (viewMode === "DAILY") {
        key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      } else {
        key = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    });

    return Array.from(map.entries()).map(([groupTitle, items]) => ({
      groupTitle,
      items,
      groupIn: items.filter((i) => i.type === "IN").reduce((acc, curr) => acc + curr.amount, 0),
      groupOut: items.filter((i) => i.type === "OUT").reduce((acc, curr) => acc + curr.amount, 0),
    }));
  }, [entries, viewMode, summary]);

  return (
    <div className="space-y-5">
      {/* 1. TOP SUMMARY STATS CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Cash In Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t.totalIn}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              +{currencySymbol}{summary.totalIn.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Total Cash Out Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {t.totalOut}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">
              -{currencySymbol}{summary.totalOut.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-100 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              {t.netBalance}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-1">
              {currencySymbol}{summary.netBalance.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm"
              title="Share Statement"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BIG ACTION BUTTONS & SHORTCUT HINT */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => {
            setEntryToEdit(null);
            setEntryModalType("IN");
            setIsEntryModalOpen(true);
          }}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span>+ Cash In</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono font-normal ml-2 hidden sm:inline">
            Press &apos;+&apos; or &apos;N&apos;
          </span>
        </button>

        <button
          onClick={() => {
            setEntryToEdit(null);
            setEntryModalType("OUT");
            setIsEntryModalOpen(true);
          }}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-base shadow-lg shadow-red-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
            <Minus className="w-4 h-4 stroke-[3]" />
          </div>
          <span>- Cash Out</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono font-normal ml-2 hidden sm:inline">
            Press &apos;-&apos;
          </span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => openImportModal(bookId)}
            className="flex-1 sm:flex-initial py-3 px-4 rounded-2xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5"
            title="Import Excel or CSV entries"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import</span>
          </button>

          <a
            href={`/api/export/excel?bookId=${bookId}`}
            className="flex-1 sm:flex-initial py-3 px-4 rounded-2xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5"
            title="Export Excel spreadsheet"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Excel</span>
          </a>
        </div>
      </div>

      {/* 3. SEARCH & ADVANCED FILTERS BAR */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Date Presets & View Toggle */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setDatePreset("ALL")}
                className={`px-2.5 py-1 rounded-lg ${datePreset === "ALL" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                All
              </button>
              <button
                onClick={() => setDatePreset("TODAY")}
                className={`px-2.5 py-1 rounded-lg ${datePreset === "TODAY" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                {t.today}
              </button>
              <button
                onClick={() => setDatePreset("WEEK")}
                className={`px-2.5 py-1 rounded-lg ${datePreset === "WEEK" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                {t.thisWeek}
              </button>
              <button
                onClick={() => setDatePreset("MONTH")}
                className={`px-2.5 py-1 rounded-lg ${datePreset === "MONTH" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                {t.thisMonth}
              </button>
              <button
                onClick={() => setDatePreset("CUSTOM")}
                className={`px-2.5 py-1 rounded-lg ${datePreset === "CUSTOM" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                {t.custom}
              </button>
            </div>

            {/* Daily / Monthly Grouping View */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode("ALL")}
                className={`px-2.5 py-1 rounded-lg ${viewMode === "ALL" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-400"}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("DAILY")}
                className={`px-2.5 py-1 rounded-lg ${viewMode === "DAILY" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-400"}`}
              >
                {t.dailyView}
              </button>
              <button
                onClick={() => setViewMode("MONTHLY")}
                className={`px-2.5 py-1 rounded-lg ${viewMode === "MONTHLY" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-400"}`}
              >
                {t.monthlyView}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 font-medium outline-none"
          >
            <option value="ALL">{t.allTypes}</option>
            <option value="IN">+ Cash In Only</option>
            <option value="OUT">- Cash Out Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 font-medium outline-none"
          >
            <option value="ALL">{t.allCategories}</option>
            {bookDetails?.categories?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 font-medium outline-none"
          >
            <option value="ALL">{t.allModes}</option>
            {bookDetails?.paymentModes?.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Custom Date Inputs if active */}
          {datePreset === "CUSTOM" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          )}

          <div className="ml-auto text-slate-400 text-[11px] font-medium">
            Showing {entries.length} entries
          </div>
        </div>
      </div>

      {/* 4. MAIN TRANSACTIONS TABLE & CARDS */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3 animate-pulse">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-xs font-semibold">Loading ledger transactions...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold">No entries found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start by clicking &quot;+ Cash In&quot; or &quot;- Cash Out&quot; above, or import your previous
              spreadsheet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {groupedEntries.map((group, gIdx) => (
              <div key={gIdx}>
                {/* Group Header if daily/monthly view */}
                {viewMode !== "ALL" && (
                  <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/80 font-bold text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {group.groupTitle} ({group.items.length})
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-600 font-semibold">+{currencySymbol}{group.groupIn?.toLocaleString()}</span>
                      <span className="text-red-600 font-semibold">-{currencySymbol}{group.groupOut?.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Table Header (Desktop) */}
                <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b">
                  <div className="col-span-2">Date & Time</div>
                  <div className="col-span-3">Particulars / Remark</div>
                  <div className="col-span-2">Category & Mode</div>
                  <div className="col-span-2 text-right">Cash In (+)</div>
                  <div className="col-span-2 text-right">Cash Out (-)</div>
                  <div className="col-span-1 text-right">Balance</div>
                </div>

                {/* Row Items */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.items.map((entry) => {
                    const isIn = entry.type === "IN";
                    const formattedDate = new Date(entry.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    });

                    return (
                      <div
                        key={entry.id}
                        className="p-4 sm:px-5 sm:py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-3 items-start lg:items-center relative group"
                      >
                        {/* Mobile Header: Date + Amount badge */}
                        <div className="w-full flex items-center justify-between lg:col-span-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formattedDate}</span>
                            <span className="text-slate-400">•</span>
                            <span>{entry.time || "12:00"}</span>
                          </div>

                          {/* Mobile Amount Tag */}
                          <div className="lg:hidden text-right">
                            <span
                              className={`text-sm font-extrabold ${
                                isIn ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {isIn ? "+" : "-"}
                              {currencySymbol}
                              {entry.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Remark & Party */}
                        <div className="w-full lg:col-span-3">
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{entry.remark}</span>
                            {entry.attachments?.length > 0 && (
                              <button
                                onClick={() => setReceiptPreviewUrl(entry.attachments[0].fileUrl)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View Bill"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {entry.partyName && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-slate-600 dark:text-slate-300">{entry.partyName}</span>
                            </div>
                          )}
                        </div>

                        {/* Category & Payment Mode Badges */}
                        <div className="w-full lg:col-span-2 flex flex-wrap items-center gap-1.5">
                          {entry.categoryName && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {entry.categoryName}
                            </span>
                          )}
                          {entry.paymentModeName && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                              {entry.paymentModeName}
                            </span>
                          )}
                          {entry.createdByName && (
                            <span className="text-[9px] text-slate-400 ml-1">
                              by {entry.createdByName.split(" ")[0]}
                            </span>
                          )}
                        </div>

                        {/* Cash In Column (Desktop) */}
                        <div className="hidden lg:block lg:col-span-2 text-right">
                          {isIn ? (
                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                              +{currencySymbol}{entry.amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </div>

                        {/* Cash Out Column (Desktop) */}
                        <div className="hidden lg:block lg:col-span-2 text-right">
                          {!isIn ? (
                            <span className="font-extrabold text-sm text-red-600 dark:text-red-400">
                              -{currencySymbol}{entry.amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </div>

                        {/* Running Balance Column */}
                        <div className="w-full lg:col-span-1 flex items-center justify-between lg:justify-end gap-2 text-right pt-2 lg:pt-0 border-t lg:border-t-0 text-xs">
                          <span className="lg:hidden text-slate-400 font-medium">Running Balance:</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {currencySymbol}{entry.runningBalance?.toLocaleString() || "0"}
                          </span>

                          {/* Action Menu Trigger */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenuEntryId(activeMenuEntryId === entry.id ? null : entry.id)
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuEntryId === entry.id && (
                              <div
                                className="absolute right-0 mt-1 w-40 rounded-2xl border bg-white dark:bg-slate-900 shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 text-xs font-semibold"
                                onClick={() => setActiveMenuEntryId(null)}
                              >
                                <button
                                  onClick={() => {
                                    setEntryToEdit(entry);
                                    setIsEntryModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{t.edit}</span>
                                </button>

                                <button
                                  onClick={() => handleDuplicate(entry)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{t.duplicate}</span>
                                </button>

                                <button
                                  onClick={() => handleDelete(entry)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 text-left transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t.delete}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entry Modal */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEntryToEdit(null);
        }}
        bookId={bookId}
        initialType={entryModalType}
        entryToEdit={entryToEdit}
        onEntrySaved={() => {
          fetchEntries();
          onRefresh?.();
        }}
        availableBooks={availableBooks}
        categories={bookDetails?.categories}
        paymentModes={bookDetails?.paymentModes}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={bookDetails?.name || "CashBook Statement"}
        totalIn={summary.totalIn}
        totalOut={summary.totalOut}
        netBalance={summary.netBalance}
        entryCount={summary.count}
        bookName={bookDetails?.name}
      />

      {/* Receipt Image Preview Modal */}
      {receiptPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-4 border shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-sm">Receipt Attachment</span>
              <button
                onClick={() => setReceiptPreviewUrl(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptPreviewUrl}
              alt="Receipt Preview"
              className="w-full max-h-[70vh] object-contain rounded-2xl bg-slate-100 dark:bg-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
