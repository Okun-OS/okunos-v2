import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const clients = await prisma.client.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const body = await req.json();
  const { firmenname, ansprechpartner, email, telefon, website, startdatum, status, notes } = body;

  if (!firmenname) {
    return NextResponse.json({ error: "firmenname is required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      workspaceId,
      firmenname,
      ansprechpartner: ansprechpartner || null,
      email: email || null,
      telefon: telefon || null,
      website: website || null,
      startdatum: startdatum ? new Date(startdatum) : null,
      status: status || "Aktiv",
      notes: notes || null,
    },
  });

  await logActivity(workspaceId, "CLIENT_CREATED", `Kunde "${firmenname}" erstellt`, {
    entityId: client.id,
    entityType: "Client",
  });

  return NextResponse.json(client, { status: 201 });
}
