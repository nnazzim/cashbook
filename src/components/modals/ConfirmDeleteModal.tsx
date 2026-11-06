"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  itemType: "book" | "business";
  itemName: string;
  warningText?: string;
  subWarning?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemType,
  itemName,
  warningText,
  subWarning,
}: ConfirmDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to delete ${itemType}`);
    } finally {
      setLoading(false);
    }
  };

  const defaultTitle =
    title || (itemType === "business" ? "Delete Business" : "Delete Book");
  const defaultWarning =
    warningText ||
    (itemType === "business"
      ? `Are you sure you want to delete the business "${itemName}"?`
      : `Are you sure you want to delete the book "${itemName}"?`);
  const defaultSubWarning =
    subWarning ||
    (itemType === "business"
      ? "This action will permanently remove this business along with ALL its books, entries, ledgers, categories, and transactions. This action cannot be undone."
      : "This action will permanently remove this cashbook and all associated cash-in / cash-out records, attachments, and logs. This action cannot be undone.");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-red-100 dark:border-red-950/60 shadow-2xl overflow-hidden p-6 sm:p-7">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        {/* Modal Title & Warning */}
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {defaultTitle}
        </h3>

        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {defaultWarning}
        </p>

        <div className="mt-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 leading-relaxed">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{defaultSubWarning}</span>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-100 dark:bg-red-900/50 text-xs font-semibold text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/30 transition flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>
                  Delete {itemType === "business" ? "Business" : "Book"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
