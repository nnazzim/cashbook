import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recalculateRunningBalances } from "@/lib/ledger";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entryId = params.id;
    const { targetBookId } = await req.json();

    if (!targetBookId) return NextResponse.json({ error: "targetBookId is required" }, { status: 400 });

    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { book: true },
    });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const targetBook = await prisma.book.findUnique({
      where: { id: targetBookId },
    });
    if (!targetBook) return NextResponse.json({ error: "Target book not found" }, { status: 404 });

    const oldBookId = entry.bookId;

    // Move entry
    await prisma.entry.update({
      where: { id: entryId },
      data: { bookId: targetBookId },
    });

    // Recalculate both books
    await recalculateRunningBalances(oldBookId);
    await recalculateRunningBalances(targetBookId);

    await prisma.activityLog.create({
      data: {
        businessId: targetBook.businessId,
        bookId: targetBookId,
        userId: session.id,
        userName: session.name,
        action: "ENTRY_MOVED",
        details: `Moved entry '${entry.remark}' from '${entry.book.name}' to '${targetBook.name}'`,
      },
    });

    return NextResponse.json({ success: true, message: "Entry moved successfully" });
  } catch (error: any) {
    console.error("Move entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to move entry" }, { status: 500 });
  }
}
