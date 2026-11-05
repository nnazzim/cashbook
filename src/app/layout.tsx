import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "CashBook - Digital Cash In & Cash Out Ledger",
  description: "Modern digital cash ledger for businesses, shops and personal finance with real-time running balances, Excel import, and team collaboration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
