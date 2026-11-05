import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET members and invitations for a business
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "businessId is required" }, { status: 400 });

    const members = await prisma.businessMember.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const invitations = await prisma.invitation.findMany({
      where: { businessId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role,
        createdAt: m.createdAt,
      })),
      invitations,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load team" }, { status: 500 });
  }
}

// POST invite member
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId, name, email, phone, role } = await req.json();
    if (!businessId || (!email && !phone)) {
      return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
    }

    // Check user is OWNER or ADMIN
    const currentMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: session.id } },
    });
    if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN")) {
      return NextResponse.json({ error: "Only Owner or Admin can invite members" }, { status: 403 });
    }

    const assignedRole = role || "EDITOR";
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    // Check if user already exists
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existingUser) {
      // Add directly as business member if not already added
      const alreadyMember = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: existingUser.id } },
      });

      if (alreadyMember) {
        return NextResponse.json({ error: "This user is already a member of this business" }, { status: 400 });
      }

      const newMember = await prisma.businessMember.create({
        data: {
          businessId,
          userId: existingUser.id,
          role: assignedRole,
        },
      });

      // Also add to all business books
      const books = await prisma.book.findMany({ where: { businessId } });
      for (const b of books) {
        await prisma.bookMember.create({
          data: {
            bookId: b.id,
            userId: existingUser.id,
            role: assignedRole,
          },
        }).catch(() => {});
      }

      await prisma.activityLog.create({
        data: {
          businessId,
          userId: session.id,
          userName: session.name,
          action: "MEMBER_ADDED",
          details: `Added ${existingUser.name} as ${assignedRole}`,
        },
      });

      return NextResponse.json({ success: true, message: `Added ${existingUser.name} directly to the business` });
    }

    // Create an invitation token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const invitation = await prisma.invitation.create({
      data: {
        businessId,
        email: cleanEmail,
        phone: cleanPhone,
        role: assignedRole,
        token,
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId,
        userId: session.id,
        userName: session.name,
        action: "MEMBER_INVITED",
        details: `Invited ${cleanEmail || cleanPhone} as ${assignedRole}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation generated for ${cleanEmail || cleanPhone}`,
      invitation,
      inviteLink: `/join?token=${token}`,
    });
  } catch (error: any) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: error.message || "Failed to invite member" }, { status: 500 });
  }
}

// PATCH update member role
export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { memberId, role } = await req.json();
    if (!memberId || !role) {
      return NextResponse.json({ error: "memberId and role are required" }, { status: 400 });
    }

    const member = await prisma.businessMember.findUnique({
      where: { id: memberId },
    });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const currentMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: member.businessId, userId: session.id } },
    });
    if (!currentMember || currentMember.role !== "OWNER") {
      return NextResponse.json({ error: "Only the business OWNER can change member roles" }, { status: 403 });
    }

    const updated = await prisma.businessMember.update({
      where: { id: memberId },
      data: { role },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update role" }, { status: 500 });
  }
}

// DELETE remove member
export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 });

    const member = await prisma.businessMember.findUnique({
      where: { id: memberId },
    });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    if (member.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove the owner of the business" }, { status: 400 });
    }

    await prisma.businessMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to remove member" }, { status: 500 });
  }
}
