import * as XLSX from "xlsx";

export interface ColumnMapping {
  dateCol?: string;
  timeCol?: string;
  remarkCol?: string;
  // Layout A: Separate In/Out columns
  cashInCol?: string;
  cashOutCol?: string;
  // Layout B: Single amount + type column
  amountCol?: string;
  typeCol?: string;
  // Additional optional metadata
  categoryCol?: string;
  paymentModeCol?: string;
  partyCol?: string;
  balanceCol?: string;
}

export interface ParsedRowResult {
  rowNumber: number;
  original: Record<string, any>;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
  parsed?: {
    date: Date;
    dateStr: string;
    time?: string;
    remark: string;
    type: "IN" | "OUT";
    amount: number;
    category?: string;
    paymentMode?: string;
    party?: string;
    fileBalance?: number;
  };
}

/**
 * Normalizes any currency string, comma separation, or negative numbers to a clean float.
 * Examples: "Rs. 1,200.50" -> 1200.5, "₹ 5,000" -> 5000, "(450.00)" -> -450
 */
export function normalizeAmount(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return isNaN(value) ? null : value;

  let str = String(value).trim();
  // Check for accounting parentheses e.g. (1,200)
  const isParenthesesNegative = /^\(.*\)$/.test(str);
  str = str.replace(/[()]/g, "");

  // Strip currency symbols, commas, and letters except minus and dot
  // Retain leading minus if any
  const isNegative = isParenthesesNegative || str.startsWith("-");
  const clean = str.replace(/[^0-9.]/g, "");

  if (!clean) return null;
  const num = parseFloat(clean);
  if (isNaN(num)) return null;

  return isNegative ? -Math.abs(num) : num;
}

/**
 * Normalizes Excel dates (serial numbers e.g. 45231 or date strings like 15/04/2026, 2026-04-15)
 */
export function normalizeDate(value: any, preferredFormat: string = "AUTO"): Date | null {
  if (!value) return null;

  // If already a JS Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  // If Excel numeric serial date (e.g. 44000)
  if (typeof value === "number" || (!isNaN(Number(value)) && Number(value) > 20000 && Number(value) < 60000)) {
    try {
      const dateObj = XLSX.SSF.parse_date_code(Number(value));
      if (dateObj) {
        return new Date(dateObj.y, dateObj.m - 1, dateObj.d, dateObj.H || 0, dateObj.M || 0, dateObj.S || 0);
      }
    } catch (e) {
      // continue to string parsing
    }
  }

  const str = String(value).trim();
  if (!str) return null;

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
  if (dmyMatch && (preferredFormat === "DD/MM/YYYY" || preferredFormat === "AUTO")) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;

    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Standard date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

/**
 * Intelligent header auto-detection
 */
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  lowerHeaders.forEach((h, idx) => {
    const original = headers[idx];

    // Date
    if (!mapping.dateCol && /^(date|txn_date|transaction_date|transaction date|value_date|entry_date)$/i.test(h)) {
      mapping.dateCol = original;
    } else if (!mapping.dateCol && /date/i.test(h)) {
      mapping.dateCol = original;
    }

    // Time
    if (!mapping.timeCol && /^(time|txn_time|timestamp)$/i.test(h)) {
      mapping.timeCol = original;
    }

    // Remark / Description / Particulars
    if (!mapping.remarkCol && /^(remark|remarks|particulars|narration|description|details|note|notes)$/i.test(h)) {
      mapping.remarkCol = original;
    }

    // Cash In / Credit (matches "Credit", "Credit (Rs.)", "Cash In", "Cr", "Deposit", "Received", "In", "Income")
    if (!mapping.cashInCol && /^(cash_in|cash in|credit.*|cr|deposit|received|in|income)/i.test(h)) {
      mapping.cashInCol = original;
    }

    // Cash Out / Debit (matches "Debit", "Debit (Rs.)", "Cash Out", "Dr", "Withdrawal", "Paid", "Out", "Expense")
    if (!mapping.cashOutCol && /^(cash_out|cash out|debit.*|dr|withdrawal|paid|out|expense)/i.test(h)) {
      mapping.cashOutCol = original;
    }

    // Single Amount
    if (!mapping.amountCol && /^(amount.*|total|txn_amount|net_amount|value)/i.test(h)) {
      mapping.amountCol = original;
    }

    // Type
    if (!mapping.typeCol && /^(type|txn_type|in_out|cr_dr|direction)$/i.test(h)) {
      mapping.typeCol = original;
    }

    // Category
    if (!mapping.categoryCol && /^(category|head|expense_head|group)$/i.test(h)) {
      mapping.categoryCol = original;
    }

    // Payment Mode
    if (!mapping.paymentModeCol && /^(mode|payment_mode|payment_method|pay_mode|instrument)$/i.test(h)) {
      mapping.paymentModeCol = original;
    }

    // Party / Contact / Name
    if (!mapping.partyCol && /^(party|party_name|contact|customer|vendor|supplier|payee|name)$/i.test(h)) {
      mapping.partyCol = original;
    }

    // Balance
    if (!mapping.balanceCol && /^(balance|running_balance|net_balance|closing_balance)$/i.test(h)) {
      mapping.balanceCol = original;
    }
  });

  return mapping;
}

/**
 * Validates and normalizes raw rows according to the mapping configuration
 */
export function validateAndNormalizeRows(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  existingEntries: { dateStr: string; amount: number; remark: string }[] = [],
  dateFormat: string = "AUTO"
): ParsedRowResult[] {
  const results: ParsedRowResult[] = [];
  const seenSet = new Set<string>();

  existingEntries.forEach((e) => {
    seenSet.add(`${e.dateStr}_${e.amount}_${e.remark.toLowerCase().trim()}`);
  });

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // considering row 1 is header
    const errors: string[] = [];

    // Date validation
    const rawDate = mapping.dateCol ? row[mapping.dateCol] : null;
    const date = normalizeDate(rawDate, dateFormat);
    if (!date) {
      errors.push(`Invalid or missing date (found: "${rawDate || "empty"}")`);
    }

    // Remark validation
    const rawRemark = mapping.remarkCol ? row[mapping.remarkCol] : null;
    const remark = rawRemark ? String(rawRemark).trim() : "Imported Entry";

    // Amount & Type resolution
    let type: "IN" | "OUT" = "IN";
    let amount = 0;

    const hasSeparateCols = !!(mapping.cashInCol || mapping.cashOutCol);

    if (hasSeparateCols) {
      const rawIn = mapping.cashInCol ? row[mapping.cashInCol] : null;
      const rawOut = mapping.cashOutCol ? row[mapping.cashOutCol] : null;

      const numIn = normalizeAmount(rawIn);
      const numOut = normalizeAmount(rawOut);

      const hasIn = numIn !== null && numIn > 0;
      const hasOut = numOut !== null && numOut > 0;

      if (hasIn && hasOut) {
        errors.push("Both Cash In and Cash Out values are populated in the same row");
      } else if (!hasIn && !hasOut) {
        errors.push("Missing amount: neither Cash In nor Cash Out is specified");
      } else if (hasIn) {
        type = "IN";
        amount = numIn;
      } else {
        type = "OUT";
        amount = numOut!;
      }
    } else if (mapping.amountCol) {
      // Single amount column + type column or signed amount
      const rawAmount = row[mapping.amountCol];
      const parsedAmount = normalizeAmount(rawAmount);

      if (parsedAmount === null) {
        errors.push(`Invalid or non-numeric amount: "${rawAmount || "empty"}"`);
      } else {
        amount = Math.abs(parsedAmount);

        if (mapping.typeCol && row[mapping.typeCol]) {
          const typeStr = String(row[mapping.typeCol]).toLowerCase().trim();
          if (/^(in|cr|credit|\+|cash in|deposit|income)$/i.test(typeStr)) {
            type = "IN";
          } else if (/^(out|dr|debit|\-|cash out|withdrawal|expense)$/i.test(typeStr)) {
            type = "OUT";
          } else {
            type = parsedAmount >= 0 ? "IN" : "OUT";
          }
        } else {
          // Determine from sign
          type = parsedAmount >= 0 ? "IN" : "OUT";
        }
      }
    } else {
      errors.push("No amount column configured");
    }

    // Optional metadata
    const category = mapping.categoryCol && row[mapping.categoryCol] ? String(row[mapping.categoryCol]).trim() : undefined;
    const paymentMode = mapping.paymentModeCol && row[mapping.paymentModeCol] ? String(row[mapping.paymentModeCol]).trim() : undefined;
    const party = mapping.partyCol && row[mapping.partyCol] ? String(row[mapping.partyCol]).trim() : undefined;
    const rawTime = mapping.timeCol && row[mapping.timeCol] ? String(row[mapping.timeCol]).trim() : undefined;
    const fileBalance = mapping.balanceCol ? normalizeAmount(row[mapping.balanceCol]) || undefined : undefined;

    const dateStr = date ? date.toISOString().split("T")[0] : "";
    const key = `${dateStr}_${amount}_${remark.toLowerCase()}`;
    const isDuplicate = seenSet.has(key);
    // Add to seen set so subsequent identical rows in the same spreadsheet are also flagged as duplicates
    if (key && amount > 0) {
      seenSet.add(key);
    }

    const isValid = errors.length === 0 && !!date && amount > 0;

    results.push({
      rowNumber,
      original: row,
      isValid,
      errors,
      isDuplicate,
      parsed: isValid
        ? {
            date: date!,
            dateStr,
            time: rawTime,
            remark,
            type,
            amount,
            category,
            paymentMode,
            party,
            fileBalance,
          }
        : undefined,
    });
  });

  return results;
}
