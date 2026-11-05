import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessType: true,
        currency: true,
        language: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, phone, currency, language, businessType } = await req.json();

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone ? phone.replace(/\D/g, "").slice(-10) : null } : {}),
        ...(currency ? { currency } : {}),
        ...(language ? { language } : {}),
        ...(businessType ? { businessType } : {}),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
