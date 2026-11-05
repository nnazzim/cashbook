"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ShareModal from "@/components/modals/ShareModal";
import AuthModal from "@/components/modals/AuthModal";
import { useApp } from "@/context/AppContext";
import {
  BarChart3,
  Calendar,
  Download,
  Share2,
  FileSpreadsheet,
  PieChart,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Tag,
  CreditCard,
  Printer,
  Sparkles,
} from "lucide-react";

export default function ReportsPage() {
  const { activeBusiness, currencySymbol, showToast } = useApp();

  const [bookId, setBookId] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Report Data
  const [report, setReport] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchReport = async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ businessId: activeBusiness.id });
      if (bookId && bookId !== "ALL") params.append("bookId", bookId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/reports/summary?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) fetchReport();
  }, [activeBusiness?.id, bookId, startDate, endDate]);

  // Handle client-side print / PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Financial Statements & Analytics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                Reports & Ledger Exports
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Audit cashflow across all books, expense heads, and payment modes.
              </p>
            </div>

            {/* Export & Print actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrintPDF}
                className="px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>

              <a
                href={`/api/export/excel?businessId=${activeBusiness?.id || ""}${bookId !== "ALL" ? `&bookId=${bookId}` : ""}`}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel (.xlsx)</span>
              </a>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-wrap items-center gap-3 text-xs">
            {/* Book Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Book:</span>
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-semibold outline-none"
              >
                <option value="ALL">All Books Combined</option>
                {activeBusiness?.books?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>

            {(startDate || endDate || bookId !== "ALL") && (
              <button
                onClick={() => {
                  setBookId("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                className="ml-auto text-blue-600 hover:underline font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Report Metrics Summary Cards */}
          {report?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Cash Inflow
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                    +{currencySymbol}{report.summary.totalIn.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Across {report.summary.totalEntries} entries</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Cash Outflow
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1">
                    -{currencySymbol}{report.summary.totalOut.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Expenses & purchases</div>
                </div>
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    Net Cash Balance
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold mt-1">
                    {currencySymbol}{report.summary.netBalance.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-blue-200 mt-0.5">
                    {report.summary.netBalance >= 0 ? "Positive Cashflow" : "Negative Cashflow"}
                  </div>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          )}

          {/* Breakdowns Grid: Categories & Payment Modes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <h3 className="font-extrabold text-base">Top Categories</h3>
                </div>
                <span className="text-xs text-slate-400">{report?.categories?.length || 0} categories</span>
              </div>

              <div className="space-y-3">
                {report?.categories?.slice(0, 6).map((c: any) => {
                  const maxTotal = report.categories[0]?.total || 1;
                  const percentage = Math.round((c.total / maxTotal) * 100);

                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{c.name} ({c.count})</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {currencySymbol}{c.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                        {c.in > 0 && (
                          <div
                            style={{ width: `${(c.in / c.total) * percentage}%` }}
                            className="bg-emerald-500 h-full"
                          />
                        )}
                        {c.out > 0 && (
                          <div
                            style={{ width: `${(c.out / c.total) * percentage}%` }}
                            className="bg-red-500 h-full"
                          />
                        )}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>In: +{currencySymbol}{c.in.toLocaleString()}</span>
                        <span>Out: -{currencySymbol}{c.out.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Mode Distribution */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-base">Payment Methods</h3>
                </div>
                <span className="text-xs text-slate-400">{report?.paymentModes?.length || 0} modes</span>
              </div>

              <div className="space-y-3">
                {report?.paymentModes?.map((m: any) => (
                  <div
                    key={m.name}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{m.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{m.count} transactions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {currencySymbol}{m.total.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        +{currencySymbol}{m.in.toLocaleString()} / -{currencySymbol}{m.out.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Book-wise Comparison Table */}
          {report?.bookStats && report.bookStats.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="font-extrabold text-base">Ledger Books Performance</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Book Name</th>
                      <th className="py-2.5 px-3 text-right">Entries</th>
                      <th className="py-2.5 px-3 text-right">Cash In</th>
                      <th className="py-2.5 px-3 text-right">Cash Out</th>
                      <th className="py-2.5 px-3 text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.bookStats.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-bold">{b.name}</td>
                        <td className="py-3 px-3 text-right text-slate-500">{b.count}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          +{currencySymbol}{b.in.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-red-600">
                          -{currencySymbol}{b.out.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-extrabold ${
                            b.net >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {currencySymbol}{b.net.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {report?.summary && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={`${activeBusiness?.name || "Business"} Report`}
          totalIn={report.summary.totalIn}
          totalOut={report.summary.totalOut}
          netBalance={report.summary.netBalance}
          entryCount={report.summary.totalEntries}
          bookName={activeBusiness?.name}
        />
      )}

      <AuthModal />
    </div>
  );
}
