import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    const businessId = searchParams.get("businessId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    let entries: any[] = [];
    let title = "CashBook Ledger Report";
    let subtitle = "";

    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: { business: true },
      });
      if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
      title = `${book.name} - ${book.business.name}`;
      subtitle = `Currency: ${book.currency}`;

      const where: any = { bookId, isDeleted: false };
      if (type && (type === "IN" || type === "OUT")) where.type = type;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.date.lte = end;
        }
      }

      entries = await prisma.entry.findMany({
        where,
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      });
    } else if (businessId) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });
      if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
      title = `${business.name} - All Books Combined`;

      entries = await prisma.entry.findMany({
        where: {
          book: { businessId },
          isDeleted: false,
        },
        include: { book: { select: { name: true } } },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      });
    }

    // Build Excel workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CashBook Ledger App";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Ledger Statement", {
      views: [{ showGridLines: true }],
    });

    // Title Row
    sheet.mergeCells("A1:H1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = title.toUpperCase();
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" }, // Dark Blue
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 36;

    // Subtitle Row
    sheet.mergeCells("A2:H2");
    const subCell = sheet.getCell("A2");
    subCell.value = `Generated on: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })} | ${subtitle || "Full Transaction History"}`;
    subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF475569" } };
    subCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(2).height = 20;

    // Blank row
    sheet.addRow([]);

    // Headers
    const headers = [
      "Date",
      "Time",
      "Particulars / Remark",
      "Category",
      "Payment Mode",
      "Party / Contact",
      "Cash In (+)",
      "Cash Out (-)",
      "Running Balance",
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF334155" }, // Slate 700
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "medium" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Populate data
    let totalIn = 0;
    let totalOut = 0;

    entries.forEach((e) => {
      const isIn = e.type === "IN";
      const cashIn = isIn ? e.amount : null;
      const cashOut = !isIn ? e.amount : null;

      if (isIn) totalIn += e.amount;
      else totalOut += e.amount;

      const dateStr = new Date(e.date).toLocaleDateString("en-IN");
      const row = sheet.addRow([
        dateStr,
        e.time || "-",
        e.remark,
        e.categoryName || "-",
        e.paymentModeName || "-",
        e.partyName || "-",
        cashIn,
        cashOut,
        e.runningBalance,
      ]);

      row.height = 22;
      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(2).alignment = { horizontal: "center" };
      row.getCell(3).alignment = { horizontal: "left" };
      row.getCell(4).alignment = { horizontal: "left" };
      row.getCell(5).alignment = { horizontal: "center" };
      row.getCell(6).alignment = { horizontal: "left" };

      // Formatting Cash In cell (Green)
      const inCell = row.getCell(7);
      if (cashIn !== null) {
        inCell.numFmt = "₹#,##0.00";
        inCell.font = { bold: true, color: { argb: "FF047857" } };
        inCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
      }

      // Formatting Cash Out cell (Red)
      const outCell = row.getCell(8);
      if (cashOut !== null) {
        outCell.numFmt = "₹#,##0.00";
        outCell.font = { bold: true, color: { argb: "FFB91C1C" } };
        outCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };
      }

      // Formatting Balance cell
      const balCell = row.getCell(9);
      balCell.numFmt = "₹#,##0.00";
      balCell.font = { bold: true };
    });

    // Summary Totals Row
    sheet.addRow([]);
    const summaryRow = sheet.addRow([
      "TOTALS",
      "",
      `Total Entries: ${entries.length}`,
      "",
      "",
      "",
      totalIn,
      totalOut,
      totalIn - totalOut,
    ]);
    summaryRow.height = 28;
    summaryRow.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 11, bold: true };
      cell.border = { top: { style: "double" }, bottom: { style: "double" } };
      if (colNumber === 7) {
        cell.numFmt = "₹#,##0.00";
        cell.font = { bold: true, color: { argb: "FF047857" }, size: 12 };
      }
      if (colNumber === 8) {
        cell.numFmt = "₹#,##0.00";
        cell.font = { bold: true, color: { argb: "FFB91C1C" }, size: 12 };
      }
      if (colNumber === 9) {
        cell.numFmt = "₹#,##0.00";
        cell.font = { bold: true, size: 12 };
      }
    });

    // Auto-fit columns
    sheet.columns = [
      { width: 14 },
      { width: 10 },
      { width: 34 },
      { width: 22 },
      { width: 18 },
      { width: 22 },
      { width: 16 },
      { width: 16 },
      { width: 18 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="CashBook_Export_${Date.now()}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("Excel export error:", error);
    return NextResponse.json({ error: error.message || "Failed to export Excel" }, { status: 500 });
  }
}
