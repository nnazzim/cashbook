import { NextResponse } from "next/server";
import { generateOTP } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const otp = generateOTP(cleanPhone);

    return NextResponse.json({
      success: true,
      message: `OTP sent to +91 ${cleanPhone}`,
      otp, // Exposed for testability & demo convenience
      phone: cleanPhone,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}
