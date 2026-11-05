import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET all businesses for current user
export async function GET() {
  try {
    const session = await getSessionUser();
    let userId = session?.id;
    if (!userId) {
      const u = await prisma.user.findFirst();
      userId = u?.id;
    }

    if (!userId) {
      return NextResponse.json({ businesses: [] });
    }

    const memberships = await prisma.businessMember.findMany({
      where: { userId },
      include: {
        business: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
            books: {
              select: {
                id: true,
                name: true,
                type: true,
                currency: true,
                initialBalance: true,
                isArchived: true,
                updatedAt: true,
                _count: { select: { entries: { where: { isDeleted: false } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (memberships.length === 0) {
      const allBiz = await prisma.business.findMany({
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          books: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
              initialBalance: true,
              isArchived: true,
              updatedAt: true,
              _count: { select: { entries: { where: { isDeleted: false } } } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({
        businesses: allBiz.map((b) => ({
          ...b,
          role: "OWNER",
          memberCount: b.members.length,
          bookCount: b.books.filter((bk) => !bk.isArchived).length,
        })),
      });
    }

    const businesses = memberships.map((m) => ({
      ...m.business,
      role: m.role,
      memberCount: m.business.members.length,
      bookCount: m.business.books.filter((b) => !b.isArchived).length,
    }));

    return NextResponse.json({ businesses });
  } catch (error: any) {
    console.error("List businesses error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch businesses" }, { status: 500 });
  }
}

// POST create a new business
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    let userId = session?.id;

    // Ensure valid user in DB for relation
    let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user) {
      user = await prisma.user.findFirst();
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: session?.name || "Nazim Merchant",
          email: session?.email || "demo@cashbook.in",
          phone: session?.phone || "9876543210",
        },
      });
    }
    userId = user.id;

    const { name, type, currency, initialBookName } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const business = await prisma.business.create({
      data: {
        name: name.trim(),
        type: type || "Kirana / Retail Store",
        currency: currency || session?.currency || user.currency || "INR",
        members: {
          create: [{ userId, role: "OWNER" }],
        },
        books: {
          create: [
            {
              name: initialBookName?.trim() || "Main Cashbook",
              type: "CASH",
              initialBalance: 0,
              currency: currency || session?.currency || user.currency || "INR",
              members: {
                create: [{ userId, role: "OWNER" }],
              },
            },
          ],
        },
        categories: {
          create: [
            { name: "Sales / Income", type: "IN", color: "#10b981", icon: "TrendingUp" },
            { name: "Customer Payment", type: "IN", color: "#059669", icon: "UserCheck" },
            { name: "Supplies & Inventory", type: "OUT", color: "#2563eb", icon: "Package" },
            { name: "Rent & Bills", type: "OUT", color: "#d97706", icon: "Home" },
            { name: "Staff Salary", type: "OUT", color: "#9333ea", icon: "Users" },
            { name: "Tea & Refreshments", type: "OUT", color: "#e11d48", icon: "Coffee" },
            { name: "General Expense", type: "BOTH", color: "#64748b", icon: "MoreHorizontal" },
          ],
        },
        paymentModes: {
          create: [
            { name: "Cash", icon: "Banknote" },
            { name: "UPI / QR Code", icon: "QrCode" },
            { name: "Bank Transfer", icon: "Building2" },
            { name: "Card", icon: "CreditCard" },
          ],
        },
      },
      include: {
        books: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: business.id,
        userId,
        userName: session?.name || user.name || "Finance Manager",
        action: "BUSINESS_CREATED",
        details: `Created new business '${business.name}'`,
      },
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    console.error("Create business error:", error);
    return NextResponse.json({ error: error.message || "Failed to create business" }, { status: 500 });
  }
}

// PATCH rename / update business
export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    let userId = session?.id;
    if (!userId) {
      const u = await prisma.user.findFirst();
      userId = u?.id;
    }

    const { businessId, name, type, currency, phone, address } = await req.json();
    if (!businessId) return NextResponse.json({ error: "businessId is required" }, { status: 400 });

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
        ...(currency ? { currency } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update business" }, { status: 500 });
  }
}

// DELETE delete business
export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    let userId = session?.id;
    if (!userId) {
      const u = await prisma.user.findFirst();
      userId = u?.id;
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "businessId is required" }, { status: 400 });

    await prisma.business.delete({ where: { id: businessId } });
    return NextResponse.json({ success: true, message: "Business deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete business" }, { status: 500 });
  }
}
