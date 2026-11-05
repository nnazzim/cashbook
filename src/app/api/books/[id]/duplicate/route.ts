import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sourceBookId = params.id;
    const { includeEntries } = await req.json().catch(() => ({ includeEntries: false }));

    const sourceBook = await prisma.book.findUnique({
      where: { id: sourceBookId },
      include: {
        entries: {
          where: { isDeleted: false },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!sourceBook) return NextResponse.json({ error: "Source book not found" }, { status: 404 });

    const newBook = await prisma.book.create({
      data: {
        businessId: sourceBook.businessId,
        name: `${sourceBook.name} (Copy)`,
        type: sourceBook.type,
        currency: sourceBook.currency,
        initialBalance: sourceBook.initialBalance,
        members: {
          create: [{ userId: session.id, role: "OWNER" }],
        },
      },
    });

    if (includeEntries && sourceBook.entries.length > 0) {
      for (const entry of sourceBook.entries) {
        await prisma.entry.create({
          data: {
            bookId: newBook.id,
            type: entry.type,
            amount: entry.amount,
            date: entry.date,
            time: entry.time,
            remark: entry.remark,
            categoryId: entry.categoryId,
            categoryName: entry.categoryName,
            paymentModeId: entry.paymentModeId,
            paymentModeName: entry.paymentModeName,
            partyName: entry.partyName,
            partyPhone: entry.partyPhone,
            runningBalance: entry.runningBalance,
            createdBy: session.id,
            createdByName: session.name,
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        businessId: sourceBook.businessId,
        bookId: newBook.id,
        userId: session.id,
        userName: session.name,
        action: "BOOK_DUPLICATED",
        details: `Duplicated book '${sourceBook.name}' into '${newBook.name}'`,
      },
    });

    return NextResponse.json({ success: true, book: newBook });
  } catch (error: any) {
    console.error("Duplicate book error:", error);
    return NextResponse.json({ error: error.message || "Failed to duplicate book" }, { status: 500 });
  }
}
