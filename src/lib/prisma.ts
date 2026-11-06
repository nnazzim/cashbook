import { PrismaClient } from "@prisma/client";

const FALLBACK_DB_URL =
  "postgresql://neondb_owner:npg_CKrstL95iQhV@ep-still-mountain-bez1bkab-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15&connection_limit=5&pool_timeout=20";
const FALLBACK_DIRECT_URL =
  "postgresql://neondb_owner:npg_CKrstL95iQhV@ep-still-mountain-bez1bkab.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=15";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DB_URL;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = FALLBACK_DIRECT_URL;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || FALLBACK_DB_URL,
      },
    },
    log: ["error"],
  });

globalForPrisma.prisma = prisma;
