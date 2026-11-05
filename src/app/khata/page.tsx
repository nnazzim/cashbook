"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ShareModal from "@/components/modals/ShareModal";
import AuthModal from "@/components/modals/AuthModal";
import { useApp } from "@/context/AppContext";
import {
  CreditCard,
  Search,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Phone,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function KhataPage() {
  const { activeBusiness, currencySymbol, showToast } = useApp();

  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "RECEIVABLE" | "PAYABLE">("ALL");

  // Share reminder modal
  const [selectedPartyForShare, setSelectedPartyForShare] = useState<any | null>(null);

  const fetchParties = async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/parties?businessId=${activeBusiness.id}`);
      const data = await res.json();
      if (res.ok) {
        setParties(data.parties || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) fetchParties();
  }, [activeBusiness?.id]);

  // Aggregate stats
  const totalReceivable = parties
    .filter((p) => p.netBalance > 0)
    .reduce((acc, p) => acc + p.netBalance, 0);

  const totalPayable = parties
    .filter((p) => p.netBalance < 0)
    .reduce((acc, p) => acc + Math.abs(p.netBalance), 0);

  const netDues = totalReceivable - totalPayable;

  const filteredParties = parties
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (filterType === "RECEIVABLE") return p.netBalance > 0;
      if (filterType === "PAYABLE") return p.netBalance < 0;
      return true;
    });

  // Direct WhatsApp reminder
  const sendWhatsAppReminder = (party: any) => {
    const isReceivable = party.netBalance > 0;
    const amountStr = `${currencySymbol}${Math.abs(party.netBalance).toLocaleString()}`;
    const text = isReceivable
      ? `Dear ${party.name},\nThis is a gentle reminder that your pending balance of ${amountStr} with ${activeBusiness?.name || "our store"} is due for settlement.\nThank you!`
      : `Dear ${party.name},\nRegarding our pending account balance of ${amountStr}, please share your payment details so we can process it.\nThank you!`;

    const phoneClean = party.phone ? party.phone.replace(/\D/g, "") : "";
    const url = phoneClean
      ? `https://wa.me/91${phoneClean}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Khata & Party Balances</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              Customer & Supplier Dues
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track who owes you money (You will get) and who you need to pay (You will give).
            </p>
          </div>

          {/* Dues Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* You will get (Receivable) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  You Will Receive (Get)
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{currencySymbol}{totalReceivable.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">From customer dues</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
            </div>

            {/* You will give (Payable) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  You Will Give (Pay)
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">
                  -{currencySymbol}{totalPayable.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">To suppliers & vendors</div>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            {/* Net Outstanding */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white shadow-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                  Net Outstanding Balance
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold mt-1">
                  {currencySymbol}{Math.abs(netDues).toLocaleString()}
                </div>
                <div className="text-[11px] text-purple-200 mt-0.5">
                  {netDues >= 0 ? "Net Surplus to receive" : "Net Deficit to pay"}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search party by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg ${filterType === "ALL" ? "bg-white dark:bg-slate-700 text-purple-600 shadow-sm" : "text-slate-500"}`}
              >
                All Parties ({parties.length})
              </button>
              <button
                onClick={() => setFilterType("RECEIVABLE")}
                className={`px-3 py-1.5 rounded-lg ${filterType === "RECEIVABLE" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500"}`}
              >
                You Get
              </button>
              <button
                onClick={() => setFilterType("PAYABLE")}
                className={`px-3 py-1.5 rounded-lg ${filterType === "PAYABLE" ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" : "text-slate-500"}`}
              >
                You Give
              </button>
            </div>
          </div>

          {/* Party Cards List */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-xs font-semibold">Loading khata balances...</span>
            </div>
          ) : filteredParties.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold">No parties found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Whenever you specify a &quot;Party / Contact Name&quot; while adding an entry, it automatically
                creates an item here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredParties.map((party) => {
                const isReceivable = party.netBalance > 0;
                const isPayable = party.netBalance < 0;

                return (
                  <div
                    key={party.name}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold flex items-center justify-center shadow-md">
                            {party.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                              {party.name}
                            </h3>
                            {party.phone && (
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{party.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Balance pill */}
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            {isReceivable ? "You will get" : isPayable ? "You will give" : "Settled"}
                          </div>
                          <div
                            className={`text-lg font-black ${
                              isReceivable
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isPayable
                                ? "text-red-600 dark:text-red-400"
                                : "text-slate-500"
                            }`}
                          >
                            {currencySymbol}{Math.abs(party.netBalance).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Summary of credit vs debit */}
                      <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400">Total Credit:</div>
                          <div className="font-bold text-emerald-600">
                            +{currencySymbol}{party.totalIn.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Total Debit:</div>
                          <div className="font-bold text-red-600">
                            -{currencySymbol}{party.totalOut.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Recent transactions preview */}
                      <div className="mt-3 space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Recent Entries ({party.entryCount})
                        </div>
                        {party.entries.slice(0, 3).map((e: any) => (
                          <div
                            key={e.id}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60"
                          >
                            <span className="truncate max-w-[180px]">{e.remark}</span>
                            <span
                              className={`font-bold ${
                                e.type === "IN" ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {e.type === "IN" ? "+" : "-"}
                              {currencySymbol}
                              {e.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions: WhatsApp Reminder & Full Share */}
                    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedPartyForShare(party)}
                        className="px-3 py-1.5 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition"
                      >
                        Share Statement
                      </button>

                      <button
                        onClick={() => sendWhatsAppReminder(party)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {selectedPartyForShare && (
        <ShareModal
          isOpen={true}
          onClose={() => setSelectedPartyForShare(null)}
          title={`Khata - ${selectedPartyForShare.name}`}
          totalIn={selectedPartyForShare.totalIn}
          totalOut={selectedPartyForShare.totalOut}
          netBalance={selectedPartyForShare.netBalance}
          entryCount={selectedPartyForShare.entryCount}
          partyName={selectedPartyForShare.name}
          bookName={activeBusiness?.name}
        />
      )}

      <AuthModal />
    </div>
  );
}
