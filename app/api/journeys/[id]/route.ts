import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { id } = await params;

  const journey = await prisma.customerJourney.findFirst({
    where: { id, workspaceId },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      enrollments: {
        include: { client: { select: { id: true, firmenname: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!journey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(journey);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { id } = await params;

  const existing = await prisma.customerJourney.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, description } = body;

  const updated = await prisma.customerJourney.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  await logActivity(workspaceId, "JOURNEY_UPDATED", `Journey "${updated.name}" aktualisiert`, {
    entityId: id,
    entityType: "CustomerJourney",
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { id } = await params;

  const existing = await prisma.customerJourney.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.customerJourney.delete({ where: { id } });

  await logActivity(workspaceId, "JOURNEY_DELETED", `Journey "${existing.name}" gelöscht`, {
    entityId: id,
    entityType: "CustomerJourney",
  });

  return NextResponse.json({ ok: true });
}
