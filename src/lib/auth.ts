import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "cashbook_token";

export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  businessType: string | null;
  currency: string;
  language: string;
}

export async function setSessionCookie(userId: string) {
  try {
    const cookieStore = cookies();
    const isSecure = process.env.NODE_ENV === "production" && (process.env.NEXTAUTH_URL?.startsWith("https") || false);
    cookieStore.set(COOKIE_NAME, userId, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch {
    // Ignore in contexts where cookies are read-only
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Ignore
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  let token: string | undefined;
  try {
    const cookieStore = cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  } catch {
    // Ignore
  }

  try {
    if (token) {
      const user = await prisma.user.findUnique({
        where: { id: token },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessType: true,
          currency: true,
          language: true,
        },
      });
      if (user) return user;
    }

    // Auto-login without login process: Always resolve the primary finance ledger user
    let defaultUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "demo@cashbook.in" },
          { name: { contains: "Nazim" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessType: true,
        currency: true,
        language: true,
      },
    });

    if (!defaultUser) {
      defaultUser = await prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessType: true,
          currency: true,
          language: true,
        },
      });
    }

    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          name: "Nazim Merchant",
          email: "demo@cashbook.in",
          phone: "9876543210",
          businesses: {
            create: {
              role: "OWNER",
              business: {
                create: {
                  name: "SSF Anakkayam Sector Finance ledger",
                  type: "Services & Non-Profit",
                  currency: "INR",
                  books: {
                    create: [
                      {
                        name: "Daily Counter Cashbook",
                        type: "CASH",
                        initialBalance: 0,
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          businessType: true,
          currency: true,
          language: true,
        },
      });
    }

    return defaultUser;
  } catch (error) {
    console.error("Error reading session user:", error);
    return null;
  }
}
