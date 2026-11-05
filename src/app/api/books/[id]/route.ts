import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookId = params.id;
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        business: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
            categories: { orderBy: { name: "asc" } },
            paymentModes: { orderBy: { name: "asc" } },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // Verify membership
    const bizMember = book.business.members.find((m) => m.userId === session.id);
    if (!bizMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const bookMember = book.members.find((m) => m.userId === session.id);
    const userRole = bookMember ? bookMember.role : bizMember.role;

    // Aggregate summary stats
    const inAgg = await prisma.entry.aggregate({
      where: { bookId, type: "IN", isDeleted: false },
      _sum: { amount: true },
      _count: true,
    });
    const outAgg = await prisma.entry.aggregate({
      where: { bookId, type: "OUT", isDeleted: false },
      _sum: { amount: true },
      _count: true,
    });

    const totalCashIn = inAgg._sum.amount || 0;
    const totalCashOut = outAgg._sum.amount || 0;
    const netBalance = book.initialBalance + totalCashIn - totalCashOut;

    return NextResponse.json({
      book: {
        id: book.id,
        businessId: book.businessId,
        businessName: book.business.name,
        name: book.name,
        type: book.type,
        currency: book.currency,
        initialBalance: book.initialBalance,
        isArchived: book.isArchived,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        userRole,
        totalCashIn,
        totalCashOut,
        netBalance,
        entryCount: inAgg._count + outAgg._count,
        categories: book.business.categories,
        paymentModes: book.business.paymentModes,
        members: book.business.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          phone: m.user.phone,
          role: m.role,
        })),
      },
    });
  } catch (error: any) {
    console.error("Get book details error:", error);
    return NextResponse.json({ error: error.message || "Failed to load book" }, { status: 500 });
  }
}
