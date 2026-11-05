"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Calculator,
  Calendar,
  Clock,
  Tag,
  CreditCard,
  User,
  Paperclip,
  Check,
  Plus,
  Trash2,
  Copy,
  ArrowRightLeft,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  initialType?: "IN" | "OUT";
  entryToEdit?: any;
  onEntrySaved?: () => void;
  availableBooks?: { id: string; name: string }[];
  categories?: any[];
  paymentModes?: any[];
}

export default function EntryModal({
  isOpen,
  onClose,
  bookId,
  initialType = "IN",
  entryToEdit,
  onEntrySaved,
  availableBooks = [],
  categories = [],
  paymentModes = [],
}: EntryModalProps) {
  const { currencySymbol, showToast, refreshUserData } = useApp();

  const [type, setType] = useState<"IN" | "OUT">(initialType);
  const [amountStr, setAmountStr] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [remark, setRemark] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(
    `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`
  );
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [paymentModeName, setPaymentModeName] = useState("Cash");
  const [partyName, setPartyName] = useState("");
  const [partyPhone, setPartyPhone] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Move to book modal
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetBookId, setTargetBookId] = useState("");

  // Sync state when opening or switching entryToEdit
  useEffect(() => {
    if (entryToEdit) {
      setType(entryToEdit.type);
      setAmountStr(String(entryToEdit.amount));
      setRemark(entryToEdit.remark);
      setDate(new Date(entryToEdit.date).toISOString().split("T")[0]);
      setTime(entryToEdit.time || "12:00");
      setCategoryId(entryToEdit.categoryId || "");
      setCategoryName(entryToEdit.categoryName || "");
      setPaymentModeName(entryToEdit.paymentModeName || "Cash");
      setPartyName(entryToEdit.partyName || "");
      setPartyPhone(entryToEdit.partyPhone || "");
      setAttachments(entryToEdit.attachments || []);
    } else {
      setType(initialType);
      setAmountStr("");
      setRemark("");
      setDate(new Date().toISOString().split("T")[0]);
      setTime(
        `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`
      );
      setCategoryId(categories[0]?.id || "");
      setCategoryName(categories[0]?.name || "");
      setPaymentModeName("Cash");
      setPartyName("");
      setPartyPhone("");
      setAttachments([]);
    }
    setError(null);
  }, [entryToEdit, initialType, isOpen, categories]);

  if (!isOpen) return null;

  // Safe Calculator Evaluation
  const evaluateCalculator = () => {
    try {
      // allow only numbers and basic operators
      const sanitized = amountStr.replace(/[^0-9+\-*/.]/g, "");
      if (!sanitized) return;
      // evaluate math
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (!isNaN(result) && isFinite(result)) {
        setAmountStr(String(Math.round(result * 100) / 100));
      }
    } catch (e) {
      // ignore eval error
    }
  };

  const handleCalcButton = (char: string) => {
    if (char === "C") {
      setAmountStr("");
    } else if (char === "=") {
      evaluateCalculator();
    } else {
      setAmountStr((prev) => prev + char);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/entries/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAttachments((prev) => [...prev, data]);
        showToast({ title: "Receipt uploaded", type: "success" });
      } else {
        showToast({ title: "Upload failed", message: data.error, type: "error" });
      }
    } catch (err: any) {
      showToast({ title: "Upload failed", message: err.message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (andAddNew = false) => {
    // Evaluate if there is an uncalculated expression in amountStr
    evaluateCalculator();
    const finalAmount = parseFloat(amountStr);

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!remark.trim()) {
      setError("Please enter a remark or particulars for this transaction");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      bookId,
      type,
      amount: finalAmount,
      date,
      time,
      remark: remark.trim(),
      categoryId: categoryId || null,
      categoryName: categoryName || null,
      paymentModeName,
      partyName: partyName.trim() || null,
      partyPhone: partyPhone.trim() || null,
      attachments,
    };

    try {
      let res;
      if (entryToEdit) {
        res = await fetch("/api/entries", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: entryToEdit.id, ...payload }),
        });
      } else {
        res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        showToast({
          title: entryToEdit ? "Entry Updated" : "Entry Added",
          message: `${type === "IN" ? "Cash In" : "Cash Out"} of ${currencySymbol}${finalAmount.toLocaleString()}`,
          type: "success",
        });

        onEntrySaved?.();

        if (andAddNew) {
          setAmountStr("");
          setRemark("");
          setPartyName("");
          setAttachments([]);
          // keep date and mode for faster repeated entries
        } else {
          onClose();
        }
      } else {
        setError(data.error || "Failed to save entry");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entryToEdit) return;
    const entryId = entryToEdit.id;
    const oldEntry = entryToEdit;

    try {
      const res = await fetch(`/api/entries?entryId=${entryId}`, { method: "DELETE" });
      if (res.ok) {
        onClose();
        onEntrySaved?.();
        showToast({
          title: "Entry Deleted",
          message: `${oldEntry.remark} (${currencySymbol}${oldEntry.amount}) removed`,
          type: "warning",
          undoLabel: "Undo Delete",
          undoAction: async () => {
            await fetch(`/api/entries/${entryId}/restore`, { method: "POST" });
            onEntrySaved?.();
            showToast({ title: "Restored", message: "Entry recovered", type: "success" });
          },
        });
      }
    } catch (e: any) {
      showToast({ title: "Delete failed", message: e.message, type: "error" });
    }
  };

  const handleMoveToBook = async () => {
    if (!targetBookId || !entryToEdit) return;
    try {
      const res = await fetch(`/api/entries/${entryToEdit.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetBookId }),
      });
      if (res.ok) {
        showToast({ title: "Entry Moved", message: "Successfully moved to new book", type: "success" });
        setMoveModalOpen(false);
        onClose();
        onEntrySaved?.();
      }
    } catch (e: any) {
      showToast({ title: "Move failed", message: e.message, type: "error" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Type Selector Header */}
        <div className="p-4 sm:p-5 border-b bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex bg-slate-200 dark:bg-slate-700/80 p-1 rounded-xl w-60">
            <button
              type="button"
              onClick={() => setType("IN")}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                type === "IN"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-600"
              }`}
            >
              <span>+ Cash In</span>
            </button>
            <button
              type="button"
              onClick={() => setType("OUT")}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                type === "OUT"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-red-600"
              }`}
            >
              <span>- Cash Out</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Input with Calculator Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Amount ({currencySymbol})
              </label>
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className={`text-xs flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg border transition ${
                  showCalculator
                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculator {showCalculator ? "▲" : "▼"}</span>
              </button>
            </div>

            <div className="relative">
              <span
                className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${
                  type === "IN" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {currencySymbol}
              </span>
              <input
                type="text"
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                onBlur={evaluateCalculator}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    evaluateCalculator();
                  }
                }}
                className={`w-full pl-12 pr-4 py-3 text-2xl sm:text-3xl font-extrabold rounded-2xl border bg-slate-50 dark:bg-slate-800/80 outline-none transition focus:ring-2 ${
                  type === "IN"
                    ? "focus:ring-emerald-500 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
                    : "focus:ring-red-500 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                }`}
              />
            </div>

            {/* Built-in Calculator Keypad */}
            {showCalculator && (
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border grid grid-cols-4 gap-1.5 animate-in slide-in-from-top-2">
                {["7", "8", "9", "/"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleCalcButton(b)}
                    className="py-2 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    {b}
                  </button>
                ))}
                {["4", "5", "6", "*"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleCalcButton(b)}
                    className="py-2 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    {b}
                  </button>
                ))}
                {["1", "2", "3", "-"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleCalcButton(b)}
                    className="py-2 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    {b}
                  </button>
                ))}
                {["C", "0", ".", "+"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleCalcButton(b)}
                    className={`py-2 rounded-xl font-bold text-sm shadow-sm ${
                      b === "C"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200"
                        : "bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {b}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleCalcButton("=")}
                  className="col-span-4 py-2 mt-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow"
                >
                  = Calculate
                </button>
              </div>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Remark / Particulars */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
              Remark / Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Counter sales, Shop rent, Wholesale stock"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Category
              </label>
              <select
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  const found = categories.find((c) => c.name === e.target.value);
                  if (found) setCategoryId(found.id);
                }}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                Payment Mode
              </label>
              <select
                value={paymentModeName}
                onChange={(e) => setPaymentModeName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI / QR Code">UPI / QR Code</option>
                <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                {paymentModes
                  .filter((m) => !["Cash", "UPI / QR Code", "Bank Transfer (NEFT/IMPS)", "Cheque", "Credit / Debit Card"].includes(m.name))
                  .map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Party Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Party / Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Traders, Walk-in"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                Party Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={partyPhone}
                onChange={(e) => setPartyPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bill Receipt Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              Attach Bill / Receipt (Image or PDF)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-2 rounded-xl border border-dashed hover:border-blue-500 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 transition">
                <Paperclip className="w-3.5 h-3.5" />
                <span>{uploading ? "Uploading..." : "Upload File"}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="max-w-[120px] truncate">{att.fileName}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {entryToEdit ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {availableBooks.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMoveModalOpen(true)}
                  className="p-2.5 rounded-xl border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  title="Move to another book"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {!entryToEdit && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Save & Add New
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition ${
                type === "IN"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-red-600 hover:bg-red-700 shadow-red-500/20"
              }`}
            >
              {saving ? "Saving..." : entryToEdit ? "Update Entry" : `Save ${type === "IN" ? "Cash In" : "Cash Out"}`}
            </button>
          </div>
        </div>

        {/* Move Book Sub-Modal */}
        {moveModalOpen && (
          <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-6 flex flex-col justify-center animate-in fade-in">
            <h4 className="text-base font-bold mb-2">Move Entry to Another Book</h4>
            <p className="text-xs text-slate-500 mb-4">
              Balances will be automatically recalculated in both books.
            </p>
            <select
              value={targetBookId}
              onChange={(e) => setTargetBookId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Target Book</option>
              {availableBooks
                .filter((b) => b.id !== bookId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMoveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMoveToBook}
                disabled={!targetBookId}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Confirm Move
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
