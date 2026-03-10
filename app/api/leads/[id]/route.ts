import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, workspaceId },
    include: {
      enrollments: {
        include: {
          sequence: { select: { name: true } },
          currentStage: { select: { subject: true, stepNumber: true } },
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.lead.findFirst({ where: { id, workspaceId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowedFields = [
    "firma",
    "email",
    "telefon",
    "website",
    "quelle",
    "anrede",
    "nachname",
    "status",
    "outStatus",
    "optout",
    "kommentar",
    "nextAction",
    "nextDate",
    "foundEmails",
    "archivStatus",
  ];

  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: updateData,
  });

  if (updateData.status === "ARCHIVED") {
    await logActivity(
      workspaceId,
      "LEAD",
      `Lead archiviert: ${lead.firma}`,
      { entityId: lead.id, entityType: "Lead" }
    );
  }

  return NextResponse.json(lead);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.lead.findFirst({ where: { id, workspaceId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft-delete by archiving
  const lead = await prisma.lead.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await logActivity(
    workspaceId,
    "LEAD",
    `Lead archiviert: ${lead.firma}`,
    { entityId: lead.id, entityType: "Lead" }
  );

  return NextResponse.json({ ok: true });
}
