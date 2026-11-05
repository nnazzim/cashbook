import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fullUserData = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        businesses: {
          include: {
            business: {
              include: {
                books: {
                  include: {
                    entries: {
                      where: { isDeleted: false },
                      orderBy: { date: "asc" },
                    },
                  },
                },
                categories: true,
                paymentModes: true,
              },
            },
          },
        },
      },
    });

    const exportPayload = {
      app: "CashBook",
      exportedAt: new Date().toISOString(),
      user: {
        id: fullUserData?.id,
        name: fullUserData?.name,
        email: fullUserData?.email,
        phone: fullUserData?.phone,
        currency: fullUserData?.currency,
        language: fullUserData?.language,
      },
      businesses: fullUserData?.businesses.map((b) => b.business),
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);

    return new Response(jsonString, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="CashBook_Full_Backup_${Date.now()}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
