import { NextRequest, NextResponse } from "next/server";
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.workspace.update({
    where: { id },
    data: { isActive: !workspace.isActive },
  });

  return NextResponse.json({ ok: true, isActive: updated.isActive });
}
