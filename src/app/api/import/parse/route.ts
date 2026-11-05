import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { autoDetectColumns, validateAndNormalizeRows } from "@/lib/importer";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const selectedSheet = formData.get("sheetName") as string | null;
    const bookId = formData.get("bookId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check size limit: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Read workbook with SheetJS (macros are never executed)
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, dense: true });
    const sheetNames = workbook.SheetNames;

    if (!sheetNames || sheetNames.length === 0) {
      return NextResponse.json({ error: "The uploaded workbook has no sheets" }, { status: 400 });
    }

    const targetSheetName = selectedSheet && sheetNames.includes(selectedSheet) ? selectedSheet : sheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];

    // Convert sheet to JSON rows
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "The selected sheet contains no data rows" }, { status: 400 });
    }

    if (rawRows.length > 10000) {
      return NextResponse.json({ error: "File exceeds the 10,000 rows limit" }, { status: 400 });
    }

    // Extract headers
    const headers = Object.keys(rawRows[0] || {});
    const detectedMapping = autoDetectColumns(headers);

    // Fetch existing entries for duplicate detection if bookId is provided
    let existingEntries: { dateStr: string; amount: number; remark: string }[] = [];
    if (bookId) {
      const existing = await prisma.entry.findMany({
        where: { bookId, isDeleted: false },
        select: { date: true, amount: true, remark: true },
      });
      existingEntries = existing.map((e) => ({
        dateStr: e.date.toISOString().split("T")[0],
        amount: e.amount,
        remark: e.remark,
      }));
    }

    // Validate preview rows (first 50 rows)
    const validatedRows = validateAndNormalizeRows(rawRows, detectedMapping, existingEntries);

    const validCount = validatedRows.filter((r) => r.isValid).length;
    const errorCount = validatedRows.filter((r) => !r.isValid).length;
    const duplicateCount = validatedRows.filter((r) => r.isDuplicate).length;

    let previewIn = 0;
    let previewOut = 0;
    validatedRows.forEach((r) => {
      if (r.parsed) {
        if (r.parsed.type === "IN") previewIn += r.parsed.amount;
        else previewOut += r.parsed.amount;
      }
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      sheetNames,
      activeSheet: targetSheetName,
      totalRows: rawRows.length,
      headers,
      detectedMapping,
      summary: {
        totalRows: rawRows.length,
        validCount,
        errorCount,
        duplicateCount,
        totalIn: previewIn,
        totalOut: previewOut,
        netBalance: previewIn - previewOut,
      },
      previewRows: validatedRows.slice(0, 50),
      // Return raw data stringified or cache token
      allRows: rawRows,
    });
  } catch (error: any) {
    console.error("Parse file error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse file" }, { status: 500 });
  }
}
