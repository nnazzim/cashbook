import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recalculateRunningBalances } from "@/lib/ledger";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      bookId,
      businessId,
      newBookName,
      fileName,
      rows, // array of validated rows from client wizard
      autoCreateCategories = true,
      skipDuplicates = true,
    } = body;

    let targetBookId = bookId;

    // Check permissions
    if (businessId && (!targetBookId || targetBookId === "NEW")) {
      const bizMember = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: session.id } },
      });
      if (!bizMember || bizMember.role === "VIEWER") {
        return NextResponse.json({ error: "Only Owner, Admin, or Editor can import books" }, { status: 403 });
      }

      // Create new book
      const newBook = await prisma.book.create({
        data: {
          businessId,
          name: newBookName?.trim() || `Imported Book (${new Date().toLocaleDateString("en-IN")})`,
          type: "CASH",
          initialBalance: 0,
          currency: "INR",
          members: {
            create: [{ userId: session.id, role: "OWNER" }],
          },
        },
      });
      targetBookId = newBook.id;
    } else {
      const book = await prisma.book.findUnique({
        where: { id: targetBookId },
        include: { business: { include: { members: true } } },
      });
      if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

      const member = book.business.members.find((m) => m.userId === session.id);
      if (!member || member.role === "VIEWER") {
        return NextResponse.json({ error: "Permission denied. Viewers cannot import entries." }, { status: 403 });
      }
    }

    const targetBook = await prisma.book.findUnique({
      where: { id: targetBookId },
    });
    if (!targetBook) return NextResponse.json({ error: "Target book missing" }, { status: 404 });

    const importId = `imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const canUndoUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Fetch existing categories and payment modes for the business
    const existingCats = await prisma.category.findMany({
      where: { businessId: targetBook.businessId },
    });
    const catMap = new Map<string, string>();
    existingCats.forEach((c) => catMap.set(c.name.toLowerCase().trim(), c.id));

    const existingModes = await prisma.paymentMode.findMany({
      where: { businessId: targetBook.businessId },
    });
    const modeMap = new Map<string, string>();
    existingModes.forEach((m) => modeMap.set(m.name.toLowerCase().trim(), m.id));

    // Filter rows to insert
    const toInsert: any[] = [];
    let skippedCount = 0;
    let errorCount = 0;
    const errorsList: any[] = [];

    for (const item of rows) {
      if (!item.isValid || !item.parsed) {
        errorCount++;
        errorsList.push({ row: item.rowNumber, errors: item.errors });
        continue;
      }

      if (skipDuplicates && item.isDuplicate) {
        skippedCount++;
        continue;
      }

      const p = item.parsed;

      // Handle category auto-creation
      let categoryId: string | null = null;
      if (p.category) {
        const catKey = p.category.toLowerCase().trim();
        if (catMap.has(catKey)) {
          categoryId = catMap.get(catKey)!;
        } else if (autoCreateCategories) {
          const newCat = await prisma.category.create({
            data: {
              businessId: targetBook.businessId,
              name: p.category.trim(),
              type: p.type === "IN" ? "IN" : "OUT",
              color: p.type === "IN" ? "#10b981" : "#ef4444",
            },
          });
          catMap.set(catKey, newCat.id);
          categoryId = newCat.id;
        }
      }

      // Handle payment mode auto-creation
      let paymentModeId: string | null = null;
      if (p.paymentMode) {
        const modeKey = p.paymentMode.toLowerCase().trim();
        if (modeMap.has(modeKey)) {
          paymentModeId = modeMap.get(modeKey)!;
        } else if (autoCreateCategories) {
          const newMode = await prisma.paymentMode.create({
            data: {
              businessId: targetBook.businessId,
              name: p.paymentMode.trim(),
              icon: "Wallet",
            },
          });
          modeMap.set(modeKey, newMode.id);
          paymentModeId = newMode.id;
        }
      }

      toInsert.push({
        bookId: targetBookId,
        type: p.type,
        amount: p.amount,
        date: new Date(p.date),
        time: p.time || null,
        remark: p.remark,
        categoryId,
        categoryName: p.category || null,
        paymentModeId,
        paymentModeName: p.paymentMode || null,
        partyName: p.party || null,
        createdBy: session.id,
        createdByName: session.name,
        importId,
      });
    }

    // Batch insert in chunks of 500 inside transactions
    const CHUNK_SIZE = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      await prisma.$transaction(
        chunk.map((entryData) =>
          prisma.entry.create({
            data: entryData,
          })
        )
      );
    }

    // Recalculate running balance
    await recalculateRunningBalances(targetBookId);

    // Save ImportJob
    const job = await prisma.importJob.create({
      data: {
        userId: session.id,
        bookId: targetBookId,
        fileName: fileName || "import.xlsx",
        status: "COMPLETED",
        totalRows: rows.length,
        importedRows: toInsert.length,
        skippedRows: skippedCount,
        errorRows: errorCount,
        errorLog: errorsList.length > 0 ? JSON.stringify(errorsList) : null,
        canUndoUntil,
      },
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        businessId: targetBook.businessId,
        bookId: targetBookId,
        userId: session.id,
        userName: session.name,
        action: "IMPORT_COMPLETED",
        details: `Imported ${toInsert.length} entries from '${fileName || "file"}' into '${targetBook.name}'`,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      importId,
      bookId: targetBookId,
      bookName: targetBook.name,
      totalRows: rows.length,
      importedCount: toInsert.length,
      skippedCount,
      errorCount,
      canUndoUntil: canUndoUntil.toISOString(),
    });
  } catch (error: any) {
    console.error("Execute import error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute import" }, { status: 500 });
  }
}
