"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import LedgerTable from "@/components/ledger/LedgerTable";
import ImportWizardModal from "@/components/modals/ImportWizardModal";
import AuthModal from "@/components/modals/AuthModal";
import { useApp } from "@/context/AppContext";
import {
  ChevronLeft,
  BookOpen,
  CreditCard,
  Settings,
  FileSpreadsheet,
  Download,
  Share2,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const { activeBusiness, openImportModal, currencySymbol } = useApp();

  const [bookDetails, setBookDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBook = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}`);
      const data = await res.json();
      if (res.ok) {
        setBookDetails(data.book);
      } else {
        setError(data.error || "Failed to load book");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookId) fetchBook();
  }, [bookId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Books</span>
            </Link>

            {bookDetails && (
              <span className="text-[11px] font-medium text-slate-400">
                Role: <span className="font-bold text-blue-600 capitalize">{bookDetails.userRole}</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-xs font-semibold">Loading Cashbook...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 rounded-3xl border border-red-200 dark:border-red-900 text-red-600">
              <h3 className="font-bold">Error loading book</h3>
              <p className="text-xs mt-1">{error}</p>
              <Link href="/dashboard" className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold">
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Title Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      {bookDetails?.businessName || "Business"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bookDetails?.type === "CREDIT_DEBIT"
                          ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                          : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {bookDetails?.type === "CREDIT_DEBIT" ? "Credit / Debit Khata" : "Cash Ledger"}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-slate-100">
                    {bookDetails?.name}
                  </h1>
                </div>

                {/* Sub-actions menu */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openImportModal(bookId)}
                    className="px-3.5 py-2 rounded-xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Import Entries</span>
                  </button>

                  <a
                    href={`/api/export/excel?bookId=${bookId}`}
                    className="px-3.5 py-2 rounded-xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Download Excel</span>
                  </a>
                </div>
              </div>

              {/* Core Ledger Table & Summary Component */}
              <LedgerTable
                bookId={bookId}
                bookDetails={bookDetails}
                onRefresh={fetchBook}
                availableBooks={activeBusiness?.books || []}
              />
            </div>
          )}
        </main>
      </div>

      <ImportWizardModal onSuccess={fetchBook} />
      <AuthModal />
    </div>
  );
}
