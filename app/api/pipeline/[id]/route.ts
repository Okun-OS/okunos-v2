import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;
  const deal = await prisma.deal.findFirst({ where: { id, workspaceId } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(deal);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.deal.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status, notes, value, firma, email, anrede, nachname, telefon, website, closedAt } = body;

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(value !== undefined ? { value: value !== null ? parseFloat(value) : null } : {}),
      ...(firma !== undefined ? { firma } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(anrede !== undefined ? { anrede } : {}),
      ...(nachname !== undefined ? { nachname } : {}),
      ...(telefon !== undefined ? { telefon } : {}),
      ...(website !== undefined ? { website } : {}),
      ...(closedAt !== undefined ? { closedAt: closedAt ? new Date(closedAt) : null } : {}),
    },
  });

  await logActivity(workspaceId, "DEAL", `Deal aktualisiert: ${deal.firma}`, {
    entityId: deal.id,
    entityType: "Deal",
  });

  return NextResponse.json(deal);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.deal.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deal.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
