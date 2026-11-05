"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "@/lib/translations";

export interface Business {
  id: string;
  name: string;
  type: string;
  currency: string;
  role: string;
  books?: any[];
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: "success" | "error" | "info" | "warning";
  undoAction?: () => void;
  undoLabel?: string;
  duration?: number;
}

interface AppContextType {
  user: any;
  loading: boolean;
  businesses: Business[];
  activeBusiness: Business | null;
  language: Language;
  currency: string;
  currencySymbol: string;
  theme: "light" | "dark";
  toasts: ToastItem[];
  t: typeof translations.en;
  setUser: (user: any) => void;
  setActiveBusiness: (b: Business | null) => void;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: string) => void;
  toggleTheme: () => void;
  showToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  refreshUserData: () => Promise<void>;
  createBusiness: (data: { name: string; type?: string; currency?: string; initialBookName?: string }) => Promise<any>;
  // Modals trigger state
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isNewBusinessModalOpen: boolean;
  setIsNewBusinessModalOpen: (open: boolean) => void;
  isNewBookModalOpen: boolean;
  setIsNewBookModalOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  importTargetBookId?: string;
  openImportModal: (targetBookId?: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  SAR: "SAR ",
  SGD: "S$",
  CAD: "CA$",
  AUD: "A$",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [language, setLanguageState] = useState<Language>("en");
  const [currency, setCurrencyState] = useState<string>("INR");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewBusinessModalOpen, setIsNewBusinessModalOpen] = useState(false);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetBookId, setImportTargetBookId] = useState<string | undefined>(undefined);

  const t = translations[language] || translations.en;
  const currencySymbol = currencySymbols[currency] || "₹";

  const showToast = (toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev, item]);

    const dur = toast.duration || (toast.undoAction ? 6000 : 4000);
    setTimeout(() => {
      removeToast(id);
    }, dur);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("cashbook_theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") localStorage.setItem("cashbook_lang", lang);
  };

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    if (typeof window !== "undefined") localStorage.setItem("cashbook_currency", curr);
  };

  const openImportModal = (targetBookId?: string) => {
    setImportTargetBookId(targetBookId);
    setIsImportModalOpen(true);
  };

  const refreshUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setBusinesses(data.user.businesses || []);
        if (data.user.businesses?.length > 0) {
          // Keep active business or select first
          setActiveBusiness((prev) => {
            if (prev) {
              const stillExists = data.user.businesses.find((b: any) => b.id === prev.id);
              if (stillExists) return stillExists;
            }
            return data.user.businesses[0];
          });
        }
        if (data.user.language) setLanguageState(data.user.language as Language);
        if (data.user.currency) setCurrencyState(data.user.currency);
      } else {
        setUser(null);
        setBusinesses([]);
        setActiveBusiness(null);
      }
    } catch (e) {
      console.error("Failed to load user session:", e);
    } finally {
      setLoading(false);
    }
  };

  const createBusiness = async (params: {
    name: string;
    type?: string;
    currency?: string;
    initialBookName?: string;
  }) => {
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create business");
    }
    await refreshUserData();
    if (data.business) {
      setActiveBusiness(data.business);
    }
    return data.business;
  };

  useEffect(() => {
    // Check saved theme
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("cashbook_theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === "dark") document.documentElement.classList.add("dark");
      }
      const savedLang = localStorage.getItem("cashbook_lang") as Language | null;
      if (savedLang) setLanguageState(savedLang);
      const savedCurr = localStorage.getItem("cashbook_currency");
      if (savedCurr) setCurrencyState(savedCurr);
    }

    refreshUserData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        businesses,
        activeBusiness,
        language,
        currency,
        currencySymbol,
        theme,
        toasts,
        t,
        setUser,
        setActiveBusiness,
        setLanguage,
        setCurrency,
        toggleTheme,
        showToast,
        removeToast,
        refreshUserData,
        createBusiness,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isNewBusinessModalOpen,
        setIsNewBusinessModalOpen,
        isNewBookModalOpen,
        setIsNewBookModalOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        importTargetBookId,
        openImportModal,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 ${
              toast.type === "error"
                ? "bg-red-500/90 text-white border-red-600"
                : toast.type === "warning"
                ? "bg-amber-500/90 text-white border-amber-600"
                : "bg-slate-900/95 dark:bg-slate-800/95 text-white border-slate-700"
            }`}
          >
            <div className="flex-1">
              <div className="font-semibold">{toast.title}</div>
              {toast.message && <div className="text-xs opacity-90 mt-0.5">{toast.message}</div>}
            </div>
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  removeToast(toast.id);
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition shadow"
              >
                {toast.undoLabel || "Undo"}
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs opacity-70 hover:opacity-100 px-1 py-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
