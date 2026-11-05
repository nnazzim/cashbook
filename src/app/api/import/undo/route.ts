import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recalculateRunningBalances } from "@/lib/ledger";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { importId, jobId } = await req.json();

    let job: any = null;
    if (jobId) {
      job = await prisma.importJob.findUnique({
        where: { id: jobId },
        include: { book: true },
      });
    } else if (importId) {
      job = await prisma.importJob.findFirst({
        where: { errorLog: { contains: importId } }, // or lookup
        include: { book: true },
      });
    }

    // Fallback: find entries directly with importId
    const entries = await prisma.entry.findMany({
      where: { importId, isDeleted: false },
      select: { id: true, bookId: true },
    });

    if (entries.length === 0 && !job) {
      return NextResponse.json({ error: "No active entries found for this import or already undone" }, { status: 404 });
    }

    const bookId = job ? job.bookId : entries[0]?.bookId;

    if (job && new Date() > new Date(job.canUndoUntil)) {
      return NextResponse.json({ error: "The 24-hour undo window has expired" }, { status: 400 });
    }

    // Soft delete all imported entries with this importId
    const updated = await prisma.entry.updateMany({
      where: { importId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    if (job) {
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          isUndone: true,
          status: "UNDONE",
        },
      });
    }

    if (bookId) {
      await recalculateRunningBalances(bookId);

      const book = await prisma.book.findUnique({ where: { id: bookId } });
      await prisma.activityLog.create({
        data: {
          businessId: book?.businessId,
          bookId,
          userId: session.id,
          userName: session.name,
          action: "IMPORT_UNDONE",
          details: `Undid import (${updated.count} entries removed)`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully undone import. ${updated.count} entries removed.`,
      count: updated.count,
    });
  } catch (error: any) {
    console.error("Undo import error:", error);
    return NextResponse.json({ error: error.message || "Failed to undo import" }, { status: 500 });
  }
}
