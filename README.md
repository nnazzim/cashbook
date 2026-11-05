# CashBook 💰📖

A full-stack modern digital cash-in / cash-out ledger web application built for small businesses, retail stores, freelancers, and personal finance management. Replicates the capabilities of CashBook with original branding, clean fintech UI, real-time running balance recalculation, team sharing, advanced PDF & Excel reports, and a 4-step Excel/CSV import wizard.

---

## 🌟 Key Features

1. **Clean Fintech Ledger (Core Screen)**
   - Header stat cards: Total Cash In (+), Total Cash Out (-), and Net Running Balance.
   - Big **+ Cash In** (green) and **- Cash Out** (red) buttons with keyboard shortcuts (`+`, `-`, `N`).
   - Interactive transaction table: date, time, remark, category tag, payment mode, party name, running balance, receipt attachment preview, and creator author tag.
   - Real-time search by remark, contact name, or amount.
   - Filters: Type (All / In / Out), Date presets (Today, Yesterday, This Week, This Month, Custom Range), Category, Payment Mode, Member.
   - View mode toggle: List, Daily grouping, or Monthly grouping.
   - Entry Actions: Edit, Duplicate, Move to another book, Soft Delete with **5-second Undo Toast**.

2. **Add / Edit Entry Modal with Built-in Calculator**
   - Built-in interactive calculator keypad (`+`, `-`, `*`, `/`, `=`, `C`) with inline expression evaluation.
   - Date and time pickers.
   - Category selector with colored badges.
   - Payment Mode selector (Cash, UPI, Bank Transfer, Card, Cheque).
   - Party name and phone tracking.
   - Bill image / receipt PDF attachment upload and preview.
   - "Save & Add New" for rapid counter entry.

3. **Multi-Business & Unlimited Books**
   - Multi-business switcher: create, rename, delete, switch between businesses.
   - Unlimited books per business (Daily Cashbook, Supplier Khata, Bank Account, Trip Expenses).
   - Book cards show: Net balance, total In/Out, last updated, member count, and type badge.
   - Duplicate book (with or without existing entries).
   - Archive and restore books.

4. **Supplier & Customer Khata (Credit / Debit Books)**
   - Party-wise dues tracking: Total You Will Receive (+) vs Total You Will Give (-).
   - Net outstanding balance per customer or vendor.
   - 1-click **WhatsApp Reminder Generator** with customizable payment reminder templates.

5. **4-Step Excel & CSV Import Engine (Highlights)**
   - Supports `.xlsx`, `.xls`, `.csv` up to 10 MB and 10,000 rows.
   - **Step 1 Upload**: Drag-and-drop file uploader, multi-sheet workbook selector, destination picker (create new book or merge into existing).
   - **Step 2 Column Mapping**: Smart header auto-detection (Date, Remark, In, Out, Amount, Type, Category, Mode, Party, Balance). Supports Layout A (Separate In/Out columns) or Layout B (Single Amount + Type column). Auto-detects Excel serial dates, Indian/UK `DD/MM/YYYY`, US `MM/DD/YYYY`, and ISO formats.
   - **Step 3 Preview & Validation**: 50-row preview table with live status badges. Identifies invalid dates, missing amounts, or conflicting In/Out rows. Duplicate detection (Date + Amount + Remark). Auto-creates missing categories and modes. Reconciles computed balance with file's balance column.
   - **Step 4 Transactional Import & 24-Hour Undo**: Batch inserts in chunks of 500 inside database transactions. Complete **24-hour 1-click Undo** to roll back all imported records without affecting manual entries.

6. **5 Sample Import Files Included** (in `public/sample-imports/`):
   - `clean_cashbook.xlsx`: Standard formatted template with separate In/Out columns.
   - `messy_dates.xlsx`: Messy dates (serial codes, DD/MM/YYYY), currency formatting (`Rs. 1,200.50`, `₹ 2,450.50`).
   - `separate_in_out.xlsx`: Two dedicated columns for Cash In and Cash Out.
   - `amount_and_type.csv`: Single Amount column with Type (`IN`/`OUT`).
   - `errors_and_duplicates.xlsx`: Contains invalid dates, missing amounts, In/Out conflicts, and duplicate records.

7. **Reports & Exports**
   - Download styled **Excel workbook** (`.xlsx`) generated with ExcelJS featuring colored headers, currency formatting, and totals.
   - Printable **PDF ledger statements**.
   - Cross-book summary report with category progress distribution and payment mode charts.
   - Share statement via WhatsApp, Email, or copy text summary.

8. **Team Collaboration & Activity Audit Trail**
   - Invite members by phone or email.
   - Roles: **Owner**, **Admin**, **Editor**, **Viewer**.
   - Real-time audit activity log tracking who created, edited, deleted, or imported every entry.

9. **Settings & Customization**
   - Multi-currency: ₹ INR, $ USD, € EUR, £ GBP, AED, SAR.
   - Multi-language support: **English**, **हिन्दी (Hindi)**, **മലയാളം (Malayalam)**.
   - Custom categories & payment modes management.
   - Full data backup export (complete JSON dump).
   - Dark mode & Light mode toggle.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Database**: PostgreSQL (Neon Serverless PostgreSQL) via **Prisma ORM** (also SQLite compatible for local dev)
- **Hosting Target**: **Vercel**
- **Authentication**: Phone OTP Mock + Email/Password + 1-Click Demo Login
- **Spreadsheet Processing**: SheetJS (`xlsx`) + `exceljs`
- **File Uploads**: Local storage (`public/uploads`) with serverless base64 fallback

---

## ☁️ Deploying to Vercel with Neon PostgreSQL

The project is pre-configured and production-ready for deployment to **Vercel** with the **Neon PostgreSQL** database.

### Step 1: Push Code to GitHub

```bash
cd /Users/mohammednazim/.gemini/antigravity/scratch/cashbook

# If you haven't added a remote yet:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git branch -M main
git push -u origin main
```

### Step 2: Import Project into Vercel
1. Log in to [vercel.com](https://vercel.com) and click **"Add New..." > "Project"**.
2. Select your imported GitHub repository.
3. Keep the default Framework Preset as **Next.js**.

### Step 3: Add Environment Variables in Vercel
Under **Settings -> Environment Variables**, add the following 4 environment variables:

| Variable Name | Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_CKrstL95iQhV@ep-still-mountain-bez1bkab-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require` | Neon connection pooler for serverless queries |
| `DIRECT_URL` | `postgresql://neondb_owner:npg_CKrstL95iQhV@ep-still-mountain-bez1bkab.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require` | Direct connection for Prisma schema sync/migrations |
| `NEXTAUTH_SECRET` | `cashbook-secret-jwt-key-32-chars-long` | Secret used to sign session cookies |
| `NEXTAUTH_URL` | `https://<your-project-name>.vercel.app` | Your deployed Vercel domain |

> 💡 **Build Command**: The included `vercel.json` and `package.json` automatically run `prisma generate && next build`.

### Step 4: Click "Deploy"
Vercel will build and deploy the app. Once finished, open your live URL to start managing your ledger!

---

## 🚀 Local Development Setup

### 1. Prerequisites
Node.js 18+ (tested on Node v20/v24).

### 2. Environment Setup
The environment file `.env` is configured as follows:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="cashbook-secret-jwt-key-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Migration & Seed
```bash
# Push schema to SQLite dev.db
npx prisma db push

# Seed demo business with 2 books and 30 realistic entries
node scripts/seed.mjs

# Generate all 5 sample import files in public/sample-imports/
node scripts/generate-sample-import-files.mjs
```

### 4. Start the Application
```bash
# Start development server
npm run dev

# Or build and start production server
npm run build
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Login Credentials

You can log in instantly with **1-Click** from the login modal:
- **Store Owner**:
  - Email: `demo@cashbook.in`
  - Phone: `9876543210`
  - Password: `password123`
  - Phone OTP: `123456`
- **Staff Editor**:
  - Email: `rahul@cashbook.in`
  - Password: `password123`

---

## 🧪 Running Automated Verification Tests

The repository includes an end-to-end test suite (`scripts/test-app-flows.mjs`) verifying all 16 major flows:
```bash
node scripts/test-app-flows.mjs
```
Verifies:
1. Landing page rendering
2. Demo user login & JWT cookie session
3. Multi-business & book loading
4. Running balance recalculations
5. Soft-delete and restore undo
6. **All 5 Excel & CSV sample files import**
7. 24-hour undo rollback
8. Excel `.xlsx` file download
9. Customer & supplier khata balance calculations
10. Cross-book analytics
