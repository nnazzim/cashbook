import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOTP } from "@/lib/otp";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { phone, otp, name } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const isValid = verifyOTP(cleanPhone, otp);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP. Use demo OTP 123456" }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { phone: cleanPhone },
    });

    let requiresOnboarding = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: name?.trim() || `User ${cleanPhone.slice(-4)}`,
          language: "en",
          currency: "INR",
        },
      });
      requiresOnboarding = true;
    } else {
      // Check if user has any businesses
      const memberCount = await prisma.businessMember.count({
        where: { userId: user.id },
      });
      if (memberCount === 0) {
        requiresOnboarding = true;
      }
    }

    await setSessionCookie(user.id);

    return NextResponse.json({
      success: true,
      user,
      requiresOnboarding,
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify OTP" }, { status: 500 });
  }
}
