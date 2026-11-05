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
  const cookieStore = cookies();
  const isSecure = process.env.NODE_ENV === "production" && (process.env.NEXTAUTH_URL?.startsWith("https") || false);
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
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
    return user;
  } catch (error) {
    console.error("Error reading session user:", error);
    return null;
  }
}
