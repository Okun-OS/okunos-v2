import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const { id } = await params;

  const lead = await prisma.lead.findFirst({ where: { id, workspaceId } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Create Deal from Lead data
  const deal = await prisma.deal.create({
    data: {
      workspaceId,
      leadId: lead.id,
      firma: lead.firma,
      email: lead.email ?? null,
      anrede: lead.anrede ?? null,
      nachname: lead.nachname ?? null,
      telefon: lead.telefon ?? null,
      website: lead.website ?? null,
      status: "ACTIVE",
    },
  });

  // Update lead status to ACTIVE
  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "ACTIVE" },
  });

  await logActivity(
    workspaceId,
    "DEAL",
    `Lead in Pipeline verschoben: ${lead.firma}`,
    { entityId: deal.id, entityType: "Deal" }
  );

  return NextResponse.json({ deal }, { status: 201 });
}
