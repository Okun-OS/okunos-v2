import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.deal.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      status: "LOST",
      closedAt: new Date(),
    },
  });

  await logActivity(workspaceId, "DEAL_LOST", `Deal verloren: ${deal.firma}`, {
    entityId: deal.id,
    entityType: "Deal",
  });

  return NextResponse.json({ deal });
}
