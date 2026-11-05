import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, businessType, businessName } = await req.json();

    if (!name || !password || (!email && !phone)) {
      return NextResponse.json({ error: "Name, password, and email or phone are required" }, { status: 400 });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
      }
    }

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const existingPhone = await prisma.user.findFirst({
        where: { phone: cleanPhone },
      });
      if (existingPhone) {
        return NextResponse.json({ error: "An account with this phone already exists" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email ? email.toLowerCase().trim() : null,
        phone: cleanPhone,
        passwordHash,
        businessType: businessType || "Kirana / Retail Store",
        currency: "INR",
        language: "en",
      },
    });

    // Auto-create initial business and first book
    const bizName = businessName?.trim() || `${user.name}'s Business`;
    const business = await prisma.business.create({
      data: {
        name: bizName,
        type: businessType || "Kirana / Retail Store",
        currency: "INR",
        members: {
          create: [{ userId: user.id, role: "OWNER" }],
        },
        books: {
          create: [
            {
              name: "Cash In / Cash Out",
              type: "CASH",
              initialBalance: 0,
              currency: "INR",
              members: {
                create: [{ userId: user.id, role: "OWNER" }],
              },
            },
          ],
        },
        categories: {
          create: [
            { name: "Sales", type: "IN", color: "#10b981", icon: "TrendingUp" },
            { name: "Customer Dues", type: "IN", color: "#059669", icon: "UserCheck" },
            { name: "Inventory", type: "OUT", color: "#2563eb", icon: "Package" },
            { name: "Rent & Bills", type: "OUT", color: "#d97706", icon: "Home" },
            { name: "Salary", type: "OUT", color: "#9333ea", icon: "Users" },
            { name: "Other Expenses", type: "BOTH", color: "#64748b", icon: "MoreHorizontal" },
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
    });

    await setSessionCookie(user.id);

    return NextResponse.json({
      success: true,
      user,
      business,
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
