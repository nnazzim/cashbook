import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { role } = await req.json(); // "owner" or "staff"
    const targetEmail = role === "staff" ? "rahul@cashbook.in" : "demo@cashbook.in";

    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      // Fallback: get first user
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ error: "Demo user not found. Please run seed script." }, { status: 404 });
    }

    await setSessionCookie(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessType: user.businessType,
        currency: user.currency,
        language: user.language,
      },
    });
  } catch (error: any) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: error.message || "Failed demo login" }, { status: 500 });
  }
}
