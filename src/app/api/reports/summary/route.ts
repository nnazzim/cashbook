import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const bookId = searchParams.get("bookId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const where: any = {
      isDeleted: false,
    };

    if (bookId && bookId !== "ALL") {
      where.bookId = bookId;
    } else {
      where.book = { businessId };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const entries = await prisma.entry.findMany({
      where,
      include: {
        book: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { date: "asc" },
    });

    // Compute Totals
    let totalIn = 0;
    let totalOut = 0;
    const categoryMap: { [cat: string]: { in: number; out: number; count: number } } = {};
    const modeMap: { [mode: string]: { in: number; out: number; count: number } } = {};
    const bookStatsMap: { [bId: string]: { name: string; in: number; out: number; net: number; count: number } } = {};
    const partyMap: { [party: string]: { in: number; out: number; net: number } } = {};

    entries.forEach((e) => {
      const isIn = e.type === "IN";
      if (isIn) totalIn += e.amount;
      else totalOut += e.amount;

      // Category breakdown
      const cat = e.categoryName || "Uncategorized";
      if (!categoryMap[cat]) categoryMap[cat] = { in: 0, out: 0, count: 0 };
      categoryMap[cat].count += 1;
      if (isIn) categoryMap[cat].in += e.amount;
      else categoryMap[cat].out += e.amount;

      // Mode breakdown
      const mode = e.paymentModeName || "Other / Not specified";
      if (!modeMap[mode]) modeMap[mode] = { in: 0, out: 0, count: 0 };
      modeMap[mode].count += 1;
      if (isIn) modeMap[mode].in += e.amount;
      else modeMap[mode].out += e.amount;

      // Book stats
      const bId = e.bookId;
      if (!bookStatsMap[bId]) bookStatsMap[bId] = { name: e.book.name, in: 0, out: 0, net: 0, count: 0 };
      bookStatsMap[bId].count += 1;
      if (isIn) bookStatsMap[bId].in += e.amount;
      else bookStatsMap[bId].out += e.amount;
      bookStatsMap[bId].net = bookStatsMap[bId].in - bookStatsMap[bId].out;

      // Party stats
      if (e.partyName) {
        if (!partyMap[e.partyName]) partyMap[e.partyName] = { in: 0, out: 0, net: 0 };
        if (isIn) partyMap[e.partyName].in += e.amount;
        else partyMap[e.partyName].out += e.amount;
        partyMap[e.partyName].net = partyMap[e.partyName].in - partyMap[e.partyName].out;
      }
    });

    const categories = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      ...data,
      total: data.in + data.out,
    })).sort((a, b) => b.total - a.total);

    const paymentModes = Object.entries(modeMap).map(([name, data]) => ({
      name,
      ...data,
      total: data.in + data.out,
    })).sort((a, b) => b.total - a.total);

    const bookStats = Object.entries(bookStatsMap).map(([id, data]) => ({
      id,
      ...data,
    }));

    const parties = Object.entries(partyMap).map(([name, data]) => ({
      name,
      ...data,
    })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    return NextResponse.json({
      summary: {
        totalIn,
        totalOut,
        netBalance: totalIn - totalOut,
        totalEntries: entries.length,
      },
      categories,
      paymentModes,
      bookStats,
      parties,
    });
  } catch (error: any) {
    console.error("Summary report error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
