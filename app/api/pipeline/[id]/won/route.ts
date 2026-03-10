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

  const now = new Date();

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      status: "WON",
      closedAt: now,
    },
  });

  // Create Client if email doesn't already exist in workspace
  let client = null;
  if (deal.email) {
    client = await prisma.client.findFirst({
      where: { workspaceId, email: deal.email },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          workspaceId,
          firmenname: deal.firma,
          ansprechpartner: deal.nachname
            ? `${deal.anrede ?? ""} ${deal.nachname}`.trim()
            : null,
          email: deal.email,
          telefon: deal.telefon ?? null,
          website: deal.website ?? null,
          startdatum: now,
          status: "Aktiv",
        },
      });
    }
  } else {
    // Create client without email
    client = await prisma.client.create({
      data: {
        workspaceId,
        firmenname: deal.firma,
        ansprechpartner: deal.nachname
          ? `${deal.anrede ?? ""} ${deal.nachname}`.trim()
          : null,
        telefon: deal.telefon ?? null,
        website: deal.website ?? null,
        startdatum: now,
        status: "Aktiv",
      },
    });
  }

  await logActivity(workspaceId, "DEAL_WON", `Deal gewonnen: ${deal.firma}`, {
    entityId: deal.id,
    entityType: "Deal",
  });

  return NextResponse.json({ deal, client });
}
