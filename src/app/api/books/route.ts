import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET books for a business
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const includeArchived = searchParams.get("includeArchived") === "true";

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    // Verify user belongs to business
    const bizMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: session.id } },
    });
    if (!bizMember) {
      return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });
    }

    const books = await prisma.book.findMany({
      where: {
        businessId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        _count: {
          select: { entries: { where: { isDeleted: false } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Compute balance for each book
    const booksWithBalances = await Promise.all(
      books.map(async (book) => {
        const inAgg = await prisma.entry.aggregate({
          where: { bookId: book.id, type: "IN", isDeleted: false },
          _sum: { amount: true },
        });
        const outAgg = await prisma.entry.aggregate({
          where: { bookId: book.id, type: "OUT", isDeleted: false },
          _sum: { amount: true },
        });

        const totalIn = (inAgg._sum.amount || 0) + (book.initialBalance > 0 ? book.initialBalance : 0);
        const totalOut = (outAgg._sum.amount || 0) + (book.initialBalance < 0 ? Math.abs(book.initialBalance) : 0);
        const netBalance = (book.initialBalance || 0) + (inAgg._sum.amount || 0) - (outAgg._sum.amount || 0);

        // Get user role in this book (if specific bookMember exists, else fallback to business role)
        const bookMember = book.members.find((m) => m.userId === session.id);
        const effectiveRole = bookMember ? bookMember.role : bizMember.role;

        return {
          id: book.id,
          businessId: book.businessId,
          name: book.name,
          type: book.type,
          currency: book.currency,
          initialBalance: book.initialBalance,
          isArchived: book.isArchived,
          updatedAt: book.updatedAt,
          createdAt: book.createdAt,
          entryCount: book._count.entries,
          totalIn,
          totalOut,
          netBalance,
          userRole: effectiveRole,
          members: book.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            phone: m.user.phone,
            role: m.role,
          })),
        };
      })
    );

    return NextResponse.json({ books: booksWithBalances });
  } catch (error: any) {
    console.error("List books error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch books" }, { status: 500 });
  }
}

// POST create new book
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, name, type, initialBalance, currency } = await req.json();

    if (!businessId || !name?.trim()) {
      return NextResponse.json({ error: "Business ID and Book name are required" }, { status: 400 });
    }

    let bizMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: session.id } },
    });
    if (!bizMember) {
      bizMember = await prisma.businessMember.create({
        data: { businessId, userId: session.id, role: "OWNER" },
      });
    }

    const initBal = parseFloat(initialBalance) || 0;

    const book = await prisma.book.create({
      data: {
        businessId,
        name: name.trim(),
        type: type || "CASH",
        initialBalance: initBal,
        currency: currency || session.currency || "INR",
        members: {
          create: [{ userId: session.id, role: "OWNER" }],
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId,
        bookId: book.id,
        userId: session.id,
        userName: session.name,
        action: "BOOK_CREATED",
        details: `Created new book '${book.name}' (${book.type}) with initial balance ${initBal}`,
      },
    });

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    console.error("Create book error:", error);
    return NextResponse.json({ error: error.message || "Failed to create book" }, { status: 500 });
  }
}

// PATCH update / archive / restore book
export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookId, name, type, initialBalance, isArchived } = await req.json();
    if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { business: { include: { members: true } } },
    });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const member = book.business.members.find((m) => m.userId === session.id);
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
        ...(initialBalance !== undefined ? { initialBalance: parseFloat(initialBalance) || 0 } : {}),
        ...(isArchived !== undefined ? { isArchived } : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: book.businessId,
        bookId: book.id,
        userId: session.id,
        userName: session.name,
        action: isArchived !== undefined ? (isArchived ? "BOOK_ARCHIVED" : "BOOK_RESTORED") : "BOOK_UPDATED",
        details: `Updated book '${updated.name}'`,
      },
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update book" }, { status: 500 });
  }
}

// DELETE delete book
export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { business: { include: { members: true } } },
    });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const member = book.business.members.find((m) => m.userId === session.id);
    if (!member || member.role !== "OWNER") {
      return NextResponse.json({ error: "Only the OWNER can delete books" }, { status: 403 });
    }

    await prisma.book.delete({ where: { id: bookId } });

    return NextResponse.json({ success: true, message: "Book deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete book" }, { status: 500 });
  }
}
