import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

    const paymentModes = await prisma.paymentMode.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ paymentModes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, name, icon } = await req.json();
    if (!businessId || !name?.trim()) {
      return NextResponse.json({ error: "Business ID and Name required" }, { status: 400 });
    }

    const mode = await prisma.paymentMode.create({
      data: {
        businessId,
        name: name.trim(),
        icon: icon || "Wallet",
      },
    });

    return NextResponse.json({ success: true, paymentMode: mode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.paymentMode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
