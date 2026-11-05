"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Share2, MessageSquare, Mail, Copy, Check, X } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalIn: number;
  totalOut: number;
  netBalance: number;
  entryCount: number;
  partyName?: string;
  bookName?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  totalIn,
  totalOut,
  netBalance,
  entryCount,
  partyName,
  bookName,
}: ShareModalProps) {
  const { currencySymbol, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://cashbook.app";

  const messageText = partyName
    ? `Hello ${partyName},\nThis is a statement from ${bookName || "our store"}:\n• Total Credit: ${currencySymbol}${totalIn.toLocaleString()}\n• Total Debit: ${currencySymbol}${totalOut.toLocaleString()}\n• Net Outstanding Balance: ${currencySymbol}${Math.abs(netBalance).toLocaleString()} (${netBalance >= 0 ? "You will receive" : "Pending payment"})\n\nGenerated via CashBook Ledger App.`
    : `📊 *${title} - CashBook Summary*\n• Total Cash In: ${currencySymbol}${totalIn.toLocaleString()}\n• Total Cash Out: ${currencySymbol}${totalOut.toLocaleString()}\n• Net Balance: ${currencySymbol}${netBalance.toLocaleString()}\n• Total Entries: ${entryCount}\n• Generated on: ${new Date().toLocaleDateString("en-IN")}\n\nView details: ${currentUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    showToast({ title: "Copied to clipboard", message: "Summary text ready to paste", type: "success" });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${title} - Statement`);
    const body = encodeURIComponent(messageText);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border shadow-2xl overflow-hidden p-6 sm:p-7">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Share Ledger Statement</h3>
            <p className="text-xs text-slate-500">Send via WhatsApp, Email, or copy message</p>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto mb-5 leading-relaxed">
          {messageText}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition"
          >
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleEmail}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition"
          >
            <Mail className="w-5 h-5 text-blue-600" />
            <span>Email</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-slate-500" />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
