import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

async function getWorkspaceClient(clientId: string, workspaceId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, workspaceId },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, workspaceId },
    include: {
      invoices: { orderBy: { createdAt: "desc" } },
      journeyEnrollments: {
        include: {
          journey: {
            include: {
              steps: { select: { id: true }, orderBy: { stepNumber: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(client);
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

  const existing = await getWorkspaceClient(id, workspaceId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { firmenname, ansprechpartner, email, telefon, website, startdatum, status, notes } = body;

  const updated = await prisma.client.update({
    where: { id },
    data: {
      ...(firmenname !== undefined && { firmenname }),
      ...(ansprechpartner !== undefined && { ansprechpartner }),
      ...(email !== undefined && { email }),
      ...(telefon !== undefined && { telefon }),
      ...(website !== undefined && { website }),
      ...(startdatum !== undefined && { startdatum: startdatum ? new Date(startdatum) : null }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  await logActivity(workspaceId, "CLIENT_UPDATED", `Kunde "${updated.firmenname}" aktualisiert`, {
    entityId: id,
    entityType: "Client",
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

  const existing = await getWorkspaceClient(id, workspaceId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id } });

  await logActivity(workspaceId, "CLIENT_DELETED", `Kunde "${existing.firmenname}" gelöscht`, {
    entityId: id,
    entityType: "Client",
  });

  return NextResponse.json({ ok: true });
}
