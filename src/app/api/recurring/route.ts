import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recalculateRunningBalances } from "@/lib/ledger";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });

    const recurring = await prisma.recurringEntry.findMany({
      where: { bookId },
      orderBy: { nextRunDate: "asc" },
    });

    return NextResponse.json({ recurring });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const {
      bookId,
      type,
      amount,
      remark,
      categoryName,
      paymentModeName,
      partyName,
      frequency,
      nextRunDate,
    } = data;

    if (!bookId || !amount || !remark) {
      return NextResponse.json({ error: "bookId, amount and remark required" }, { status: 400 });
    }

    const item = await prisma.recurringEntry.create({
      data: {
        bookId,
        type: type || "OUT",
        amount: parseFloat(amount),
        remark: remark.trim(),
        categoryName,
        paymentModeName,
        partyName,
        frequency: frequency || "MONTHLY",
        nextRunDate: nextRunDate ? new Date(nextRunDate) : new Date(),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, recurring: item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Apply a recurring entry to the ledger now
export async function PUT(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    const rec = await prisma.recurringEntry.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const formattedTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    await prisma.entry.create({
      data: {
        bookId: rec.bookId,
        type: rec.type,
        amount: rec.amount,
        date: now,
        time: formattedTime,
        remark: `${rec.remark} (Recurring)`,
        categoryName: rec.categoryName,
        paymentModeName: rec.paymentModeName,
        partyName: rec.partyName,
        createdBy: session.id,
        createdByName: session.name,
      },
    });

    // Advance next run date
    const nextDate = new Date(rec.nextRunDate);
    if (rec.frequency === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
    else if (rec.frequency === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
    else nextDate.setMonth(nextDate.getMonth() + 1);

    await prisma.recurringEntry.update({
      where: { id: rec.id },
      data: { nextRunDate: nextDate },
    });

    await recalculateRunningBalances(rec.bookId);

    return NextResponse.json({ success: true, message: "Recurring entry posted to ledger" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
