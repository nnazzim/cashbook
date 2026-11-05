import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const bookId = searchParams.get("bookId");

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (bookId) where.bookId = bookId;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load activity logs" }, { status: 500 });
  }
}
