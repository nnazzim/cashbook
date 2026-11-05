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
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { book: true },
    });

    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    await prisma.entry.update({
      where: { id: entryId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    await recalculateRunningBalances(entry.bookId);

    await prisma.activityLog.create({
      data: {
        businessId: entry.book.businessId,
        bookId: entry.bookId,
        userId: session.id,
        userName: session.name,
        action: "ENTRY_RESTORED",
        details: `Restored deleted entry '${entry.remark}' (₹${entry.amount})`,
      },
    });

    return NextResponse.json({ success: true, message: "Entry restored successfully" });
  } catch (error: any) {
    console.error("Restore entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore entry" }, { status: 500 });
  }
}
