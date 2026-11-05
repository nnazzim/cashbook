"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import NewBookModal from "@/components/modals/NewBookModal";
import ImportWizardModal from "@/components/modals/ImportWizardModal";
import AuthModal from "@/components/modals/AuthModal";
import { useApp } from "@/context/AppContext";
import {
  BookOpen,
  Plus,
  UploadCloud,
  Search,
  Filter,
  ArrowUpDown,
  CreditCard,
  Users,
  Clock,
  MoreVertical,
  Archive,
  RotateCcw,
  Copy,
  Trash2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    loading,
    activeBusiness,
    currencySymbol,
    t,
    setIsNewBookModalOpen,
    openImportModal,
    showToast,
    refreshUserData,
  } = useApp();

  const [books, setBooks] = useState<any[]>([]);
  const [fetchingBooks, setFetchingBooks] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"RECENT" | "NAME" | "HIGH_BALANCE" | "LOW_BALANCE">("RECENT");
  const [showArchived, setShowArchived] = useState(false);
  const [activeMenuBookId, setActiveMenuBookId] = useState<string | null>(null);

  // Fetch books for active business
  const loadBooks = async () => {
    if (!activeBusiness?.id) return;
    setFetchingBooks(true);
    try {
      const res = await fetch(`/api/books?businessId=${activeBusiness.id}&includeArchived=${showArchived}`);
      const data = await res.json();
      if (res.ok) {
        setBooks(data.books || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingBooks(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      loadBooks();
    }
  }, [activeBusiness?.id, showArchived]);

  // Duplicate Book Action
  const handleDuplicateBook = async (bookId: string) => {
    try {
      const res = await fetch(`/api/books/${bookId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeEntries: true }),
      });
      if (res.ok) {
        showToast({ title: "Book Duplicated", message: "Copy created with entries", type: "success" });
        loadBooks();
        refreshUserData();
      }
    } catch (e: any) {
      showToast({ title: "Duplicate failed", message: e.message, type: "error" });
    }
  };

  // Archive or Restore Book Action
  const handleToggleArchive = async (book: any) => {
    try {
      const res = await fetch("/api/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          isArchived: !book.isArchived,
        }),
      });
      if (res.ok) {
        showToast({
          title: book.isArchived ? "Book Restored" : "Book Archived",
          message: `${book.name} updated`,
          type: "info",
        });
        loadBooks();
      }
    } catch (e: any) {
      showToast({ title: "Error", message: e.message, type: "error" });
    }
  };

  // Filter & sort books
  const filteredBooks = books
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "NAME") return a.name.localeCompare(b.name);
      if (sortBy === "HIGH_BALANCE") return b.netBalance - a.netBalance;
      if (sortBy === "LOW_BALANCE") return a.netBalance - b.netBalance;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // Aggregate Business Level Summary
  const businessTotalIn = books.reduce((acc, b) => acc + (b.totalIn || 0), 0);
  const businessTotalOut = books.reduce((acc, b) => acc + (b.totalOut || 0), 0);
  const businessNetBalance = books.reduce((acc, b) => acc + (b.netBalance || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome & Business Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeBusiness?.type || "Business Ledger"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {activeBusiness?.name || "My Business"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage all cashbooks, sales counters, and supplier dues in one place.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openImportModal()}
                className="px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{t.importBook}</span>
              </button>

              <button
                onClick={() => setIsNewBookModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.newBook}</span>
              </button>
            </div>
          </div>

          {/* Business Overview Stats Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-400">Total Business Balance</div>
              <div className="text-2xl sm:text-3xl font-extrabold mt-1">
                {currencySymbol}{businessNetBalance.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Combined across all active books</div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-5">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Total Cash In</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-400">
                +{currencySymbol}{businessTotalIn.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Recorded inflows</div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-5">
              <div className="text-xs font-semibold text-red-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Total Cash Out</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold mt-1 text-red-400">
                -{currencySymbol}{businessTotalOut.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Recorded expenses & stock</div>
            </div>
          </div>

          {/* Search, Sort, & Archive Toggle Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search books by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 font-semibold outline-none cursor-pointer"
                >
                  <option value="RECENT">Recently Updated</option>
                  <option value="NAME">Name (A-Z)</option>
                  <option value="HIGH_BALANCE">Highest Balance</option>
                  <option value="LOW_BALANCE">Lowest Balance</option>
                </select>
              </div>

              {/* Archived Toggle */}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded text-blue-600 w-3.5 h-3.5"
                />
                <span>Show Archived</span>
              </label>
            </div>
          </div>

          {/* Books Grid */}
          {fetchingBooks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border h-44 animate-pulse" />
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold">No books found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search ? "No books match your search term." : "Create your first cashbook to start tracking daily cashflows."}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setIsNewBookModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow"
                >
                  + Add New Book
                </button>
                <button
                  onClick={() => openImportModal()}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-50"
                >
                  Import from Excel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredBooks.map((book) => {
                const isCreditBook = book.type === "CREDIT_DEBIT";
                const isPositive = book.netBalance >= 0;

                return (
                  <div
                    key={book.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border hover:border-blue-500/50 hover:shadow-lg transition flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Top Bar: Type Badge & Action Menu */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isCreditBook
                              ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                              : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {isCreditBook ? <CreditCard className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                          <span>{isCreditBook ? "Credit / Debit Khata" : "Cash In / Cash Out"}</span>
                        </span>

                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuBookId(activeMenuBookId === book.id ? null : book.id)
                            }
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuBookId === book.id && (
                            <div
                              className="absolute right-0 mt-1 w-44 rounded-2xl border bg-white dark:bg-slate-900 shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 text-xs font-semibold"
                              onClick={() => setActiveMenuBookId(null)}
                            >
                              <Link
                                href={`/books/${book.id}`}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                <span>Open Ledger</span>
                              </Link>

                              <button
                                onClick={() => handleDuplicateBook(book.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Duplicate Book</span>
                              </button>

                              <button
                                onClick={() => handleToggleArchive(book)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
                              >
                                <Archive className="w-3.5 h-3.5 text-amber-500" />
                                <span>{book.isArchived ? "Restore Book" : "Archive Book"}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Book Title */}
                      <Link href={`/books/${book.id}`} className="block">
                        <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition truncate">
                          {book.name}
                        </h3>
                      </Link>

                      {/* Net Balance Display */}
                      <div className="mt-3">
                        <div className="text-[11px] font-semibold text-slate-400">Net Balance</div>
                        <div
                          className={`text-2xl font-extrabold ${
                            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {currencySymbol}{book.netBalance?.toLocaleString() || "0"}
                        </div>
                      </div>

                      {/* Cash In vs Cash Out Sub-stats */}
                      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">In (+)</div>
                          <div className="font-bold text-emerald-600">
                            +{currencySymbol}{book.totalIn?.toLocaleString() || "0"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Out (-)</div>
                          <div className="font-bold text-red-600">
                            -{currencySymbol}{book.totalOut?.toLocaleString() || "0"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Entries count & Open button */}
                    <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>{book.entryCount || 0} entries</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{book.members?.length || 1}</span>
                        </div>
                      </div>

                      <Link
                        href={`/books/${book.id}`}
                        className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <NewBookModal onBookCreated={() => { loadBooks(); refreshUserData(); }} />
      <ImportWizardModal onSuccess={() => { loadBooks(); refreshUserData(); }} />
      <AuthModal />
    </div>
  );
}
