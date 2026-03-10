import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(user: any): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  return user.isSystemAdmin || adminEmails.includes((user.email || "").toLowerCase());
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [workspaces, users, leads, emails, deals] = await Promise.all([
    prisma.workspace.count(),
    prisma.user.count(),
    prisma.lead.count(),
    prisma.outreachLog.count(),
    prisma.deal.count(),
  ]);

  return NextResponse.json({ workspaces, users, leads, emails, deals });
}
