import { prisma } from "./prisma";

/**
 * Recomputes running balances for all non-deleted entries in a book
 * ordered strictly by date ASC, then createdAt ASC.
 */
export async function recalculateRunningBalances(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { initialBalance: true },
  });

  if (!book) return;

  const entries = await prisma.entry.findMany({
    where: {
      bookId,
      isDeleted: false,
    },
    orderBy: [
      { date: "asc" },
      { createdAt: "asc" },
    ],
    select: {
      id: true,
      type: true,
      amount: true,
    },
  });

  let currentBalance = book.initialBalance || 0;

  // Batch update inside transaction
  const updates = entries.map((entry) => {
    if (entry.type === "IN") {
      currentBalance += entry.amount;
    } else {
      currentBalance -= entry.amount;
    }
    return prisma.entry.update({
      where: { id: entry.id },
      data: { runningBalance: Math.round(currentBalance * 100) / 100 },
    });
  });

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  // Update book updatedAt timestamp
  await prisma.book.update({
    where: { id: bookId },
    data: { updatedAt: new Date() },
  });
}
