import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recalculateRunningBalances } from "@/lib/ledger";

// GET entries with filters and search
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });

    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type"); // "IN", "OUT", or null/all
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");
    const paymentModeId = searchParams.get("paymentModeId");
    const partyName = searchParams.get("partyName");
    const createdBy = searchParams.get("createdBy");
    const sortOrder = searchParams.get("sortOrder") || "desc"; // desc or asc

    // Build filter clause
    const where: any = {
      bookId,
      isDeleted: false,
    };

    if (type && (type === "IN" || type === "OUT")) {
      where.type = type;
    }

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (paymentModeId && paymentModeId !== "ALL") {
      where.paymentModeId = paymentModeId;
    }

    if (partyName && partyName !== "ALL") {
      where.partyName = { contains: partyName };
    }

    if (createdBy && createdBy !== "ALL") {
      where.createdBy = createdBy;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (search) {
      const searchNum = parseFloat(search.replace(/[^0-9.]/g, ""));
      where.OR = [
        { remark: { contains: search } },
        { partyName: { contains: search } },
        { categoryName: { contains: search } },
        { paymentModeName: { contains: search } },
        ...(isNaN(searchNum) ? [] : [{ amount: searchNum }]),
      ];
    }

    // Fetch entries
    const entries = await prisma.entry.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        paymentMode: { select: { id: true, name: true, icon: true } },
        attachments: true,
      },
      orderBy: [
        { date: sortOrder === "asc" ? "asc" : "desc" },
        { createdAt: sortOrder === "asc" ? "asc" : "desc" },
      ],
    });

    // Compute aggregate for filtered entries
    const inSum = entries.filter((e) => e.type === "IN").reduce((acc, curr) => acc + curr.amount, 0);
    const outSum = entries.filter((e) => e.type === "OUT").reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      entries,
      summary: {
        totalIn: inSum,
        totalOut: outSum,
        netBalance: inSum - outSum,
        count: entries.length,
      },
    });
  } catch (error: any) {
    console.error("List entries error:", error);
    return NextResponse.json({ error: error.message || "Failed to load entries" }, { status: 500 });
  }
}

// POST create entry
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const {
      bookId,
      type,
      amount,
      date,
      time,
      remark,
      categoryId,
      categoryName,
      paymentModeId,
      paymentModeName,
      partyName,
      partyPhone,
      attachments,
    } = data;

    if (!bookId || !type || !amount || !remark?.trim()) {
      return NextResponse.json({ error: "Book ID, type (IN/OUT), amount, and remark are required" }, { status: 400 });
    }

    const numAmount = Math.abs(parseFloat(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Please enter a valid amount greater than 0" }, { status: 400 });
    }

    const entryDate = date ? new Date(date) : new Date();

    // Verify book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { business: true },
    });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // Format time if missing
    const formattedTime = time || `${String(entryDate.getHours()).padStart(2, "0")}:${String(entryDate.getMinutes()).padStart(2, "0")}`;

    const entry = await prisma.entry.create({
      data: {
        bookId,
        type: type === "OUT" ? "OUT" : "IN",
        amount: numAmount,
        date: entryDate,
        time: formattedTime,
        remark: remark.trim(),
        categoryId: categoryId || null,
        categoryName: categoryName || null,
        paymentModeId: paymentModeId || null,
        paymentModeName: paymentModeName || null,
        partyName: partyName?.trim() || null,
        partyPhone: partyPhone?.trim() || null,
        createdBy: session.id,
        createdByName: session.name,
        attachments: attachments && Array.isArray(attachments) && attachments.length > 0 ? {
          create: attachments.map((att: any) => ({
            fileName: att.fileName || "receipt",
            fileUrl: att.fileUrl,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
          })),
        } : undefined,
      },
      include: {
        category: true,
        paymentMode: true,
        attachments: true,
      },
    });

    // Recalculate running balances
    await recalculateRunningBalances(bookId);

    // Fetch updated entry with running balance
    const updatedEntry = await prisma.entry.findUnique({
      where: { id: entry.id },
      include: {
        category: true,
        paymentMode: true,
        attachments: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        businessId: book.businessId,
        bookId,
        userId: session.id,
        userName: session.name,
        action: "ENTRY_CREATED",
        details: `Added ${entry.type === "IN" ? "Cash In" : "Cash Out"} of ₹${numAmount.toLocaleString()} - ${entry.remark}`,
      },
    });

    return NextResponse.json({ success: true, entry: updatedEntry });
  } catch (error: any) {
    console.error("Create entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to create entry" }, { status: 500 });
  }
}

// PATCH update entry
export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const {
      entryId,
      type,
      amount,
      date,
      time,
      remark,
      categoryId,
      categoryName,
      paymentModeId,
      paymentModeName,
      partyName,
      partyPhone,
    } = data;

    if (!entryId) return NextResponse.json({ error: "entryId is required" }, { status: 400 });

    const existing = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { book: true },
    });
    if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const updateData: any = {};
    if (type) updateData.type = type;
    if (amount !== undefined) {
      const numAmount = Math.abs(parseFloat(amount));
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      updateData.amount = numAmount;
    }
    if (date) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (remark !== undefined) updateData.remark = remark.trim();
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (categoryName !== undefined) updateData.categoryName = categoryName || null;
    if (paymentModeId !== undefined) updateData.paymentModeId = paymentModeId || null;
    if (paymentModeName !== undefined) updateData.paymentModeName = paymentModeName || null;
    if (partyName !== undefined) updateData.partyName = partyName?.trim() || null;
    if (partyPhone !== undefined) updateData.partyPhone = partyPhone?.trim() || null;

    const updated = await prisma.entry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        category: true,
        paymentMode: true,
        attachments: true,
      },
    });

    await recalculateRunningBalances(existing.bookId);

    // Fetch updated with running balance
    const refreshed = await prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        category: true,
        paymentMode: true,
        attachments: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: existing.book.businessId,
        bookId: existing.bookId,
        userId: session.id,
        userName: session.name,
        action: "ENTRY_UPDATED",
        details: `Updated entry '${existing.remark}' to ₹${(updateData.amount || existing.amount).toLocaleString()}`,
      },
    });

    return NextResponse.json({ success: true, entry: refreshed });
  } catch (error: any) {
    console.error("Update entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to update entry" }, { status: 500 });
  }
}

// DELETE soft delete entry
export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get("entryId");
    if (!entryId) return NextResponse.json({ error: "entryId is required" }, { status: 400 });

    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { book: true },
    });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    // Soft delete
    await prisma.entry.update({
      where: { id: entryId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await recalculateRunningBalances(entry.bookId);

    await prisma.activityLog.create({
      data: {
        businessId: entry.book.businessId,
        bookId: entry.bookId,
        userId: session.id,
        userName: session.name,
        action: "ENTRY_DELETED",
        details: `Deleted entry '${entry.remark}' (₹${entry.amount})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Entry deleted. You can undo this action.",
      entryId,
    });
  } catch (error: any) {
    console.error("Delete entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete entry" }, { status: 500 });
  }
}
