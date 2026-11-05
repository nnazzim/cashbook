"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  BookOpen,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  PlusCircle,
  UploadCloud,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Store,
  Plus,
  Check,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const {
    t,
    setIsNewBookModalOpen,
    setIsNewBusinessModalOpen,
    openImportModal,
    activeBusiness,
    businesses,
    setActiveBusiness,
  } = useApp();

  const navLinks = [
    {
      name: t.books,
      href: "/dashboard",
      icon: BookOpen,
      match: (p: string) => p === "/dashboard" || p.startsWith("/books/"),
    },
    {
      name: t.khata,
      href: "/khata",
      icon: CreditCard,
      match: (p: string) => p.startsWith("/khata"),
    },
    {
      name: t.reports,
      href: "/reports",
      icon: BarChart3,
      match: (p: string) => p.startsWith("/reports"),
    },
    {
      name: t.team,
      href: "/team",
      icon: Users,
      match: (p: string) => p.startsWith("/team"),
    },
    {
      name: t.settings,
      href: "/settings",
      icon: Settings,
      match: (p: string) => p.startsWith("/settings"),
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r md:min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Quick Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => setIsNewBookModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.newBook}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsNewBusinessModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-xs transition active:scale-[0.98]"
            >
              <Store className="w-3.5 h-3.5" />
              <span>+ Business</span>
            </button>

            <button
              onClick={() => openImportModal()}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition active:scale-[0.98]"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main Menu
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Businesses Switcher in Sidebar */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Businesses
            </span>
            <button
              onClick={() => setIsNewBusinessModalOpen(true)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {businesses.map((biz) => {
              const isSelected = activeBusiness?.id === biz.id;
              return (
                <button
                  key={biz.id}
                  onClick={() => setActiveBusiness(biz)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Store className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="truncate">{biz.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Free Plan Limit Badge */}
      <div className="pt-4 border-t mt-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/50 border border-blue-100 dark:border-slate-700 text-xs">
          <div className="flex items-center justify-between font-semibold text-blue-900 dark:text-blue-300">
            <span>Free Tier</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Unlimited entries & Excel imports. Up to 5 active cashbooks.
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-blue-600 h-full w-2/5 rounded-full"></div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-medium">
            <span>Unlimited Books & Entries</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">100% Free</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
