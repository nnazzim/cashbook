import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessName, businessType, bookName, initialBalance } = await req.json();

    const bizType = businessType || "Kirana / Retail Store";
    const bizName = businessName?.trim() || `${session.name}'s Business`;

    // Update user business type
    await prisma.user.update({
      where: { id: session.id },
      data: { businessType: bizType },
    });

    // Create Business, Categories, Modes, Book
    const business = await prisma.business.create({
      data: {
        name: bizName,
        type: bizType,
        currency: session.currency || "INR",
        members: {
          create: [{ userId: session.id, role: "OWNER" }],
        },
        books: {
          create: [
            {
              name: bookName?.trim() || "Daily Cashbook",
              type: "CASH",
              initialBalance: parseFloat(initialBalance) || 0,
              currency: session.currency || "INR",
              members: {
                create: [{ userId: session.id, role: "OWNER" }],
              },
            },
          ],
        },
        categories: {
          create: [
            { name: "Sales / Income", type: "IN", color: "#10b981", icon: "TrendingUp" },
            { name: "Customer Payment", type: "IN", color: "#059669", icon: "UserCheck" },
            { name: "Stock / Supplies", type: "OUT", color: "#2563eb", icon: "Package" },
            { name: "Rent & Bills", type: "OUT", color: "#d97706", icon: "Home" },
            { name: "Staff Wages", type: "OUT", color: "#9333ea", icon: "Users" },
            { name: "General Expenses", type: "BOTH", color: "#64748b", icon: "MoreHorizontal" },
          ],
        },
        paymentModes: {
          create: [
            { name: "Cash", icon: "Banknote" },
            { name: "UPI / QR Code", icon: "QrCode" },
            { name: "Bank Transfer", icon: "Building2" },
            { name: "Card / POS", icon: "CreditCard" },
          ],
        },
      },
      include: {
        books: true,
      },
    });

    return NextResponse.json({
      success: true,
      business,
      bookId: business.books[0]?.id,
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete onboarding" }, { status: 500 });
  }
}
