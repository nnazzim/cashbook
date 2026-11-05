import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    const businessId = searchParams.get("businessId");

    const where: any = {
      isDeleted: false,
      partyName: { not: null },
    };

    if (bookId && bookId !== "ALL") {
      where.bookId = bookId;
    } else if (businessId) {
      where.book = { businessId };
    }

    const entries = await prisma.entry.findMany({
      where,
      select: {
        id: true,
        partyName: true,
        partyPhone: true,
        type: true,
        amount: true,
        date: true,
        remark: true,
        book: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { date: "desc" },
    });

    // Group by party
    const partyMap: {
      [name: string]: {
        name: string;
        phone: string | null;
        totalIn: number;
        totalOut: number;
        netBalance: number;
        entryCount: number;
        lastTransactionDate: Date;
        entries: any[];
      };
    } = {};

    entries.forEach((e) => {
      const p = e.partyName?.trim();
      if (!p) return;

      if (!partyMap[p]) {
        partyMap[p] = {
          name: p,
          phone: e.partyPhone || null,
          totalIn: 0,
          totalOut: 0,
          netBalance: 0,
          entryCount: 0,
          lastTransactionDate: e.date,
          entries: [],
        };
      }

      if (e.partyPhone && !partyMap[p].phone) {
        partyMap[p].phone = e.partyPhone;
      }

      partyMap[p].entryCount += 1;
      if (e.type === "IN") {
        partyMap[p].totalIn += e.amount;
      } else {
        partyMap[p].totalOut += e.amount;
      }

      partyMap[p].netBalance = partyMap[p].totalIn - partyMap[p].totalOut;
      if (partyMap[p].entries.length < 5) {
        partyMap[p].entries.push(e);
      }
    });

    const parties = Object.values(partyMap).sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));

    return NextResponse.json({ parties });
  } catch (error: any) {
    console.error("Parties error:", error);
    return NextResponse.json({ error: error.message || "Failed to load parties" }, { status: 500 });
  }
}
