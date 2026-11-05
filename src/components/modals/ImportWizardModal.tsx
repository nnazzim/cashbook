"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Download,
  Check,
  X,
  FileText,
  Layers,
  Settings2,
} from "lucide-react";
import { ColumnMapping, ParsedRowResult, validateAndNormalizeRows } from "@/lib/importer";

interface ImportWizardModalProps {
  onSuccess?: () => void;
}

export default function ImportWizardModal({ onSuccess }: ImportWizardModalProps) {
  const router = useRouter();
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    importTargetBookId,
    activeBusiness,
    currencySymbol,
    showToast,
    refreshUserData,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadDestination, setUploadDestination] = useState<"NEW" | "EXISTING">(
    importTargetBookId ? "EXISTING" : "NEW"
  );
  const [selectedBookId, setSelectedBookId] = useState<string>(importTargetBookId || "");
  const [newBookName, setNewBookName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [allRawRows, setAllRawRows] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Step 2: Mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [layoutType, setLayoutType] = useState<"SEPARATE_IN_OUT" | "AMOUNT_AND_TYPE">("SEPARATE_IN_OUT");
  const [dateFormat, setDateFormat] = useState<string>("AUTO");

  // Step 3: Validation state
  const [validatedRows, setValidatedRows] = useState<ParsedRowResult[]>([]);
  const [autoCreateCategories, setAutoCreateCategories] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "VALID" | "ERROR" | "DUPLICATE">("ALL");

  // Step 4: Execution state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    jobId?: string;
    importId?: string;
    bookId?: string;
    bookName?: string;
    totalRows: number;
    importedCount: number;
    skippedCount: number;
    errorCount: number;
    canUndoUntil?: string;
  } | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isImportModalOpen) {
      setStep(1);
      setFile(null);
      setUploadDestination(importTargetBookId ? "EXISTING" : "NEW");
      setSelectedBookId(importTargetBookId || activeBusiness?.books?.[0]?.id || "");
      setNewBookName("");
      setImportResult(null);
      setImportProgress(0);
    }
  }, [isImportModalOpen, importTargetBookId, activeBusiness]);

  if (!isImportModalOpen) return null;

  // Handler for file drop or selection
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    if (!newBookName) {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setNewBookName(baseName.replace(/[_-]/g, " "));
    }

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (selectedBookId) formData.append("bookId", selectedBookId);

      const res = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setSheetNames(data.sheetNames || []);
        setActiveSheet(data.activeSheet || "");
        setHeaders(data.headers || []);
        setAllRawRows(data.allRows || []);
        setMapping(data.detectedMapping || {});

        // Determine if auto-detected separate in/out or single amount
        if (data.detectedMapping.cashInCol || data.detectedMapping.cashOutCol) {
          setLayoutType("SEPARATE_IN_OUT");
        } else if (data.detectedMapping.amountCol) {
          setLayoutType("AMOUNT_AND_TYPE");
        }
      } else {
        showToast({ title: "Parse Error", message: data.error, type: "error" });
      }
    } catch (err: any) {
      showToast({ title: "Error", message: err.message, type: "error" });
    } finally {
      setIsParsing(false);
    }
  };

  // Re-parse when sheet tab changed
  const handleSheetChange = async (sheet: string) => {
    if (!file) return;
    setActiveSheet(sheet);
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sheetName", sheet);
      if (selectedBookId) formData.append("bookId", selectedBookId);

      const res = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setHeaders(data.headers || []);
        setAllRawRows(data.allRows || []);
        setMapping(data.detectedMapping || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  // Move from Step 2 to Step 3: Run full validation
  const handleProceedToPreview = () => {
    const results = validateAndNormalizeRows(allRawRows, mapping, [], dateFormat);
    setValidatedRows(results);
    setStep(3);
  };

  // Step 4: Execute Batch Import
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setImportProgress(20);

    const interval = setInterval(() => {
      setImportProgress((p) => (p < 85 ? p + 15 : p));
    }, 200);

    try {
      const payload = {
        bookId: uploadDestination === "NEW" ? "NEW" : selectedBookId,
        businessId: activeBusiness?.id,
        newBookName,
        fileName: file?.name,
        rows: validatedRows,
        autoCreateCategories,
        skipDuplicates,
      };

      const res = await fetch("/api/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearInterval(interval);
      setImportProgress(100);

      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        setStep(4);
        await refreshUserData();
        showToast({
          title: "Import Successful!",
          message: `Imported ${data.importedCount} entries into ${data.bookName}`,
          type: "success",
        });
        onSuccess?.();
      } else {
        showToast({ title: "Import Failed", message: data.error, type: "error" });
      }
    } catch (err: any) {
      showToast({ title: "Import Error", message: err.message, type: "error" });
    } finally {
      setIsImporting(false);
    }
  };

  // 24-hour Undo Import
  const handleUndoImport = async () => {
    if (!importResult?.importId) return;
    try {
      const res = await fetch("/api/import/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId: importResult.importId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({
          title: "Import Undone",
          message: `${data.count} entries removed. Ledger restored.`,
          type: "warning",
        });
        setIsImportModalOpen(false);
        await refreshUserData();
        onSuccess?.();
      } else {
        showToast({ title: "Undo Failed", message: data.error, type: "error" });
      }
    } catch (e: any) {
      showToast({ title: "Undo Failed", message: e.message, type: "error" });
    }
  };

  // Filter preview rows
  const filteredPreview = validatedRows.filter((r) => {
    if (previewFilter === "VALID") return r.isValid && !r.isDuplicate;
    if (previewFilter === "ERROR") return !r.isValid;
    if (previewFilter === "DUPLICATE") return r.isDuplicate;
    return true;
  });

  const validCount = validatedRows.filter((r) => r.isValid && !r.isDuplicate).length;
  const errorCount = validatedRows.filter((r) => !r.isValid).length;
  const duplicateCount = validatedRows.filter((r) => r.isDuplicate).length;

  let totalInPreview = 0;
  let totalOutPreview = 0;
  validatedRows.forEach((r) => {
    if (r.parsed) {
      if (r.parsed.type === "IN") totalInPreview += r.parsed.amount;
      else totalOutPreview += r.parsed.amount;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header & Wizard Stepper */}
        <div className="p-4 sm:p-5 border-b bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Import Cashbook (Excel / CSV)</h3>
              <p className="text-xs text-slate-500">
                Step {step} of 4:{" "}
                {step === 1 && "Upload File & Choose Destination"}
                {step === 2 && "Map Spreadsheet Columns"}
                {step === 3 && "Preview & Validate Entries"}
                {step === 4 && "Import Complete & 24hr Undo"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsImportModalOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 flex">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Main Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* STEP 1: UPLOAD & DESTINATION */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Destination selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  Where should these entries be imported?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadDestination("NEW")}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition ${
                      uploadDestination === "NEW"
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Layers className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Create New Book</div>
                      <div className="text-[11px] text-slate-400">Import file into a fresh dedicated book</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadDestination("EXISTING")}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition ${
                      uploadDestination === "EXISTING"
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <FileText className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Add to Existing Book</div>
                      <div className="text-[11px] text-slate-400">Merge entries into an existing cashbook</div>
                    </div>
                  </button>
                </div>

                {uploadDestination === "NEW" ? (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      New Book Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Previous Year Cashbook, Counter Sales 2026"
                      value={newBookName}
                      onChange={(e) => setNewBookName(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Select Target Book
                    </label>
                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {activeBusiness?.books?.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition flex flex-col items-center justify-center ${
                  file
                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/30"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow">
                  <UploadCloud className="w-7 h-7" />
                </div>
                {file ? (
                  <div>
                    <div className="font-bold text-sm text-emerald-600 flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>{file.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB • {allRawRows.length} rows detected
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs text-red-500 hover:underline mt-2 inline-block font-semibold"
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-sm">Drag and drop your spreadsheet here</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports .xlsx, .xls, .csv up to 10 MB (max 10,000 rows)
                    </div>
                    <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition cursor-pointer">
                      <span>Browse File</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Sheet tabs if multi-sheet workbook */}
              {sheetNames.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                    <span>Workbook contains multiple sheets:</span>
                    <span className="text-[10px] text-slate-400">{sheetNames.length} sheets</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sheetNames.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSheetChange(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          activeSheet === s
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Files Download Bar */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/70 border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download Test Sample Import Files:</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ready-to-use sample spreadsheets to test every mapping and edge-case
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/sample-imports/clean_cashbook.xlsx"
                    download
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 shadow-sm flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Clean Excel
                  </a>
                  <a
                    href="/sample-imports/separate_in_out.xlsx"
                    download
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 shadow-sm flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> In/Out Cols
                  </a>
                  <a
                    href="/sample-imports/amount_and_type.csv"
                    download
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 shadow-sm flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Amount+Type CSV
                  </a>
                  <a
                    href="/sample-imports/messy_dates.xlsx"
                    download
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 shadow-sm flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Messy Dates
                  </a>
                  <a
                    href="/sample-imports/errors_and_duplicates.xlsx"
                    download
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 shadow-sm flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Errors & Duplicates
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Layout switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border">
                <div>
                  <div className="font-bold text-xs">Spreadsheet Layout:</div>
                  <div className="text-[11px] text-slate-400">
                    How does your file record Cash In vs Cash Out?
                  </div>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLayoutType("SEPARATE_IN_OUT")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      layoutType === "SEPARATE_IN_OUT"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Separate In / Out Columns
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutType("AMOUNT_AND_TYPE")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      layoutType === "AMOUNT_AND_TYPE"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Single Amount + Type
                  </button>
                </div>
              </div>

              {/* Mapping fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Column */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Date Column *
                  </label>
                  <select
                    value={mapping.dateCol || ""}
                    onChange={(e) => setMapping({ ...mapping, dateCol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remark Column */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Remark / Description *
                  </label>
                  <select
                    value={mapping.remarkCol || ""}
                    onChange={(e) => setMapping({ ...mapping, remarkCol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount columns according to layout */}
                {layoutType === "SEPARATE_IN_OUT" ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                        Cash In / Credit Column *
                      </label>
                      <select
                        value={mapping.cashInCol || ""}
                        onChange={(e) => setMapping({ ...mapping, cashInCol: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-red-600 dark:text-red-400 block mb-1">
                        Cash Out / Debit Column *
                      </label>
                      <select
                        value={mapping.cashOutCol || ""}
                        onChange={(e) => setMapping({ ...mapping, cashOutCol: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Amount Column *
                      </label>
                      <select
                        value={mapping.amountCol || ""}
                        onChange={(e) => setMapping({ ...mapping, amountCol: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Type Column (In/Out, Cr/Dr, +/-)
                      </label>
                      <select
                        value={mapping.typeCol || ""}
                        onChange={(e) => setMapping({ ...mapping, typeCol: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Auto detect from positive/negative sign --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Optional Metadata Mappings */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Category (Optional)
                  </label>
                  <select
                    value={mapping.categoryCol || ""}
                    onChange={(e) => setMapping({ ...mapping, categoryCol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none"
                  >
                    <option value="">-- Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Payment Mode (Optional)
                  </label>
                  <select
                    value={mapping.paymentModeCol || ""}
                    onChange={(e) => setMapping({ ...mapping, paymentModeCol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none"
                  >
                    <option value="">-- Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Party / Contact (Optional)
                  </label>
                  <select
                    value={mapping.partyCol || ""}
                    onChange={(e) => setMapping({ ...mapping, partyCol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none"
                  >
                    <option value="">-- Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Running Balance in File (Optional verification)
                  </label>
                  <select
                    value={mapping.balanceCol || ""}
                    onChange={(e) => setMapping({ ...mapping, balanceCol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none"
                  >
                    <option value="">-- Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Format Auto-detect options */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold">Date Parsing Format:</span>
                  <span className="text-[11px] text-slate-400 block">
                    Auto-detect resolves Excel serial dates, ISO dates, and Indian/UK DD/MM/YYYY
                  </span>
                </div>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="AUTO">Auto Detect (Recommended)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border">
                  <div className="text-[11px] font-semibold text-slate-400">Total Rows</div>
                  <div className="text-xl font-bold mt-0.5">{validatedRows.length}</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  <div className="text-[11px] font-semibold">Valid Entries</div>
                  <div className="text-xl font-bold mt-0.5">{validCount}</div>
                </div>

                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                  <div className="text-[11px] font-semibold">Errors / Invalid</div>
                  <div className="text-xl font-bold mt-0.5">{errorCount}</div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                  <div className="text-[11px] font-semibold">Duplicates</div>
                  <div className="text-xl font-bold mt-0.5">{duplicateCount}</div>
                </div>
              </div>

              {/* Inflow / Outflow & Balance verification banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400">Total In: </span>
                    <span className="font-bold text-emerald-600">+{currencySymbol}{totalInPreview.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Out: </span>
                    <span className="font-bold text-red-600">-{currencySymbol}{totalOutPreview.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Net Calculated: </span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {currencySymbol}{(totalInPreview - totalOutPreview).toLocaleString()}
                    </span>
                  </div>
                </div>

                {mapping.balanceCol && (
                  <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>File balance reconciled</span>
                  </div>
                )}
              </div>

              {/* Toggles bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={autoCreateCategories}
                      onChange={(e) => setAutoCreateCategories(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Auto-create new categories & modes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Skip duplicate entries</span>
                  </label>
                </div>

                {/* Filter preview rows */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg ${previewFilter === "ALL" ? "bg-white dark:bg-slate-700 shadow-sm" : ""}`}
                  >
                    All ({validatedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter("VALID")}
                    className={`px-2.5 py-1 rounded-lg ${previewFilter === "VALID" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : ""}`}
                  >
                    Valid ({validCount})
                  </button>
                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter("ERROR")}
                      className={`px-2.5 py-1 rounded-lg ${previewFilter === "ERROR" ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" : ""}`}
                    >
                      Errors ({errorCount})
                    </button>
                  )}
                  {duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter("DUPLICATE")}
                      className={`px-2.5 py-1 rounded-lg ${previewFilter === "DUPLICATE" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm" : ""}`}
                    >
                      Duplicates ({duplicateCount})
                    </button>
                  )}
                </div>
              </div>

              {/* 50-Row Interactive Preview Table */}
              <div className="border rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold sticky top-0 z-10 border-b">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">Row</th>
                      <th className="py-2 px-3 w-24">Status</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Remark</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Cash In</th>
                      <th className="py-2 px-3 text-right">Cash Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPreview.slice(0, 50).map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          !row.isValid ? "bg-red-50/30 dark:bg-red-950/20" : row.isDuplicate ? "bg-amber-50/30" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {row.rowNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          {row.isValid ? (
                            row.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                <Check className="w-3 h-3" /> Valid
                              </span>
                            )
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 cursor-help"
                              title={row.errors.join(", ")}
                            >
                              <XCircle className="w-3 h-3" /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {row.parsed?.dateStr || <span className="text-red-500 font-mono text-[11px]">{row.errors[0]}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-medium truncate max-w-[200px]">
                          {row.parsed?.remark || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {row.parsed?.category || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                          {row.parsed?.type === "IN" ? `+${currencySymbol}${row.parsed.amount.toLocaleString()}` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">
                          {row.parsed?.type === "OUT" ? `-${currencySymbol}${row.parsed.amount.toLocaleString()}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT RESULT & 24HR UNDO */}
          {step === 4 && importResult && (
            <div className="py-8 px-4 text-center max-w-lg mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold">Import Completed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Transactions have been successfully added and running balances recalculated.
                </p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border">
                <div>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {importResult.importedCount}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Imported</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-amber-600">
                    {importResult.skippedCount}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Skipped</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-500">
                    {importResult.errorCount}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Errors</div>
                </div>
              </div>

              {/* 24-Hour Undo Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between text-left">
                <div>
                  <span className="font-bold text-amber-800 dark:text-amber-300">
                    24-Hour Undo Guarantee:
                  </span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Made a mistake? You can completely roll back this import within 24 hours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUndoImport}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shrink-0 ml-3"
                >
                  Undo Import Now
                </button>
              </div>

              {/* Open Book Button */}
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    if (importResult.bookId) router.push(`/books/${importResult.bookId}`);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
                >
                  Open Book
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        {step < 4 && (
          <div className="p-4 sm:p-5 border-t bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  type="button"
                  disabled={!file || isParsing}
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow transition flex items-center gap-2"
                >
                  <span>{isParsing ? "Analyzing file..." : "Configure Mapping"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  disabled={
                    !mapping.dateCol ||
                    !mapping.remarkCol ||
                    (layoutType === "SEPARATE_IN_OUT" && !mapping.cashInCol && !mapping.cashOutCol) ||
                    (layoutType === "AMOUNT_AND_TYPE" && !mapping.amountCol)
                  }
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow transition flex items-center gap-2"
                >
                  <span>Preview & Validate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  disabled={isImporting || validCount === 0}
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow transition flex items-center gap-2"
                >
                  <span>{isImporting ? `Importing (${importProgress}%)...` : `Import ${validCount} Entries`}</span>
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
