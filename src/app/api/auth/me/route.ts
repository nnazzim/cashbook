import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const userWithBusinesses = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        businesses: {
          include: {
            business: {
              include: {
                books: {
                  where: { isArchived: false },
                  select: { id: true, name: true, type: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        phone: session.phone,
        businessType: session.businessType,
        currency: session.currency,
        language: session.language,
        businesses: userWithBusinesses?.businesses.map((b) => ({
          id: b.business.id,
          name: b.business.name,
          type: b.business.type,
          currency: b.business.currency,
          role: b.role,
          books: b.business.books,
        })) || [],
      },
    });
  } catch (error: any) {
    console.error("Get session error:", error);
    return NextResponse.json({ user: null });
  }
}
