import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { leadId, sequenceId } = body;
  if (!leadId || !sequenceId) {
    return NextResponse.json({ error: "leadId und sequenceId sind Pflichtfelder." }, { status: 400 });
  }

  // Verify lead belongs to workspace
  const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead) return NextResponse.json({ error: "Lead nicht gefunden." }, { status: 404 });

  // Verify sequence belongs to workspace
  const sequence = await prisma.emailSequence.findFirst({
    where: { id: sequenceId, workspaceId },
    include: { stages: { orderBy: { stepNumber: "asc" } } },
  });
  if (!sequence) return NextResponse.json({ error: "Sequenz nicht gefunden." }, { status: 404 });

  // Check if already enrolled
  const existing = await prisma.outreachEnrollment.findFirst({
    where: { leadId, sequenceId, status: { in: ["ACTIVE", "PAUSED"] } },
  });
  if (existing) {
    return NextResponse.json({ error: "Lead ist bereits in dieser Sequenz eingeschrieben." }, { status: 409 });
  }

  // Compute nextSendAt from first stage delayDays
  const firstStage = sequence.stages[0];
  const nextSendAt = firstStage
    ? new Date(Date.now() + firstStage.delayDays * 86400000)
    : null;

  const enrollment = await prisma.outreachEnrollment.create({
    data: {
      leadId,
      sequenceId,
      currentStep: 0,
      status: "ACTIVE",
      nextSendAt,
      currentStageId: firstStage?.id ?? null,
    },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
