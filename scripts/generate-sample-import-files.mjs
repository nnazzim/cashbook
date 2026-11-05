import * as XLSX from "xlsx";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const targetDir = path.join(process.cwd(), "public", "sample-imports");

async function generate() {
  await mkdir(targetDir, { recursive: true });

  // 1. Clean cashbook template (.xlsx)
  {
    const data = [
      { Date: "2026-11-01", Time: "09:30", Particulars: "Opening Cash Drawer", "Cash In": 8000, "Cash Out": "", Category: "Sales", "Payment Mode": "Cash", Party: "Self", Balance: 8000 },
      { Date: "2026-11-01", Time: "11:45", Particulars: "Morning Sales Counter", "Cash In": 12500, "Cash Out": "", Category: "Sales", "Payment Mode": "Cash", Party: "Store Retail", Balance: 20500 },
      { Date: "2026-11-01", Time: "14:15", Particulars: "Packaging Boxes & Tape", "Cash In": "", "Cash Out": 1450, Category: "Packaging & Bags", "Payment Mode": "UPI", Party: "Metro Packaging", Balance: 19050 },
      { Date: "2026-11-02", Time: "10:30", Particulars: "Bulk Wheat Flours Stock", "Cash In": "", "Cash Out": 6200, Category: "Wholesale Inventory", "Payment Mode": "Bank Transfer", Party: "Punjab Agro", Balance: 12850 },
      { Date: "2026-11-02", Time: "15:20", Particulars: "Customer Dues Received", "Cash In": 3500, "Cash Out": "", Category: "Customer Payment", "Payment Mode": "UPI", Party: "Sharma Ji", Balance: 16350 },
      { Date: "2026-11-03", Time: "17:00", Particulars: "Evening Cash Register", "Cash In": 9800, "Cash Out": "", Category: "Sales", "Payment Mode": "Cash", Party: "Walk-in", Balance: 26150 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "November Cashbook");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    await writeFile(path.join(targetDir, "clean_cashbook.xlsx"), buf);
    console.log("✔ Created clean_cashbook.xlsx");
  }

  // 2. Messy dates and formatted currencies (.xlsx)
  // Has Rs. 1,200.50, commas, DD/MM/YYYY, Excel serial dates, spaces
  {
    const data = [
      { "Transaction Date": "01/11/2026", Narration: "Supermarket Daily Inflow", "Credit (Rs.)": "Rs. 15,400.00", "Debit (Rs.)": "", Head: "Counter Sales", Instrument: "Cash", Contact: "Store Counter" },
      { "Transaction Date": "02-11-2026", Narration: "Diesel for delivery van", "Credit (Rs.)": "", "Debit (Rs.)": "₹ 2,450.50", Head: "Other Expenses", Instrument: "Card", Contact: "HP Petrol Pump" },
      { "Transaction Date": 46328, Narration: "Old Khata Clearance", "Credit (Rs.)": " 4,500 ", "Debit (Rs.)": "", Head: "Customer Payment", Instrument: "UPI / QR", Contact: "Alok Gupta" },
      { "Transaction Date": "2026/11/04", Narration: "Wholesale Edible Oil purchase", "Credit (Rs.)": "", "Debit (Rs.)": "Rs. 18,900", Head: "Wholesale Inventory", Instrument: "Bank Transfer", Contact: "Adani Wilmar Dist." },
      { "Transaction Date": "05.11.2026", Narration: "Tea snacks and biscuits", "Credit (Rs.)": "", "Debit (Rs.)": "320.00", Head: "Tea & Refreshments", Instrument: "Cash", Contact: "Chai Point" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Raw Ledger");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    await writeFile(path.join(targetDir, "messy_dates.xlsx"), buf);
    console.log("✔ Created messy_dates.xlsx");
  }

  // 3. Separate In / Out columns (.xlsx)
  {
    const data = [
      { Date: "2026-11-01", Details: "Counter Sales - Morning", "Cash In": 14000, "Cash Out": 0, Category: "Sales", "Payment Method": "Cash" },
      { Date: "2026-11-01", Details: "Store Helper Wages", "Cash In": 0, "Cash Out": 500, Category: "Staff Salary", "Payment Method": "Cash" },
      { Date: "2026-11-02", Details: "Counter Sales - Afternoon", "Cash In": 8200, "Cash Out": 0, Category: "Sales", "Payment Method": "UPI" },
      { Date: "2026-11-02", Details: "Cleaning supplies", "Cash In": 0, "Cash Out": 450, Category: "Other Expenses", "Payment Method": "Cash" },
      { Date: "2026-11-03", Details: "Supplier Settlement - Haldiram", "Cash In": 0, "Cash Out": 8500, Category: "Wholesale Inventory", "Payment Method": "Bank Transfer" },
      { Date: "2026-11-03", Details: "Customer Payment - Dr. Sen", "Cash In": 2800, "Cash Out": 0, Category: "Customer Payment", "Payment Method": "UPI" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    await writeFile(path.join(targetDir, "separate_in_out.xlsx"), buf);
    console.log("✔ Created separate_in_out.xlsx");
  }

  // 4. Single Amount + Type column (.csv)
  {
    const data = [
      { Date: "2026-11-01", Description: "Opening Cash Balance", Amount: 10000, Type: "IN", Category: "Sales", Mode: "Cash", Party: "Store" },
      { Date: "2026-11-01", Description: "Electricity Bill Commercial", Amount: 3200, Type: "OUT", Category: "Rent & Bills", Mode: "UPI", Party: "Discom" },
      { Date: "2026-11-02", Description: "GPay QR Receipts", Amount: 7500, Type: "IN", Category: "Sales", Mode: "UPI", Party: "Retail Customers" },
      { Date: "2026-11-02", Description: "Dairy Milk Supplies", Amount: 4200, Type: "OUT", Category: "Wholesale Inventory", Mode: "Cheque", Party: "Mother Dairy" },
      { Date: "2026-11-03", Description: "Card Swipe Settlement", Amount: 11200, Type: "IN", Category: "Sales", Mode: "Card", Party: "POS Swipe" },
      { Date: "2026-11-03", Description: "Shop Rent Advance", Amount: 15000, Type: "OUT", Category: "Rent & Bills", Mode: "Bank Transfer", Party: "Mr. Khanna" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    await writeFile(path.join(targetDir, "amount_and_type.csv"), csv, "utf-8");
    console.log("✔ Created amount_and_type.csv");
  }

  // 5. With errors, bad dates, conflict and duplicates (.xlsx)
  {
    const data = [
      // Valid row 1
      { Date: "2026-11-01", Narration: "Valid retail sale", "Cash In": 5000, "Cash Out": "", Category: "Sales" },
      // Duplicate row (exact same date, narration and amount)
      { Date: "2026-11-01", Narration: "Valid retail sale", "Cash In": 5000, "Cash Out": "", Category: "Sales" },
      // Bad date row
      { Date: "NOT_A_DATE_XYZ", Narration: "Row with invalid date", "Cash In": 2500, "Cash Out": "", Category: "Sales" },
      // Missing amount row
      { Date: "2026-11-02", Narration: "Row with no amounts filled", "Cash In": "", "Cash Out": "", Category: "Other" },
      // Conflicting row: both In and Out filled!
      { Date: "2026-11-02", Narration: "Row with both In and Out filled", "Cash In": 1500, "Cash Out": 1200, Category: "Error" },
      // Non-numeric amount
      { Date: "2026-11-03", Narration: "Row with non-numeric amount text", "Cash In": "Five Thousand", "Cash Out": "", Category: "Sales" },
      // Another Valid row
      { Date: "2026-11-04", Narration: "Valid vegetable purchase", "Cash In": "", "Cash Out": 850, Category: "Wholesale Inventory" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SheetWithErrors");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    await writeFile(path.join(targetDir, "errors_and_duplicates.xlsx"), buf);
    console.log("✔ Created errors_and_duplicates.xlsx");
  }

  console.log("🎉 All 5 sample import files generated successfully!");
}

generate().catch(console.error);
