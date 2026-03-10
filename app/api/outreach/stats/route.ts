import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const now = new Date();

  // Get active enrollments that are due, grouped by step
  const dueEnrollments = await prisma.outreachEnrollment.findMany({
    where: {
      status: "ACTIVE",
      nextSendAt: { lte: now },
      lead: { workspaceId, optout: false, replied: false },
    },
    include: {
      sequence: {
        include: {
          stages: { orderBy: { stepNumber: "asc" } },
        },
      },
    },
  });

  // Build dueByStep: stepNumber => { subject, count }
  const stepMap = new Map<number, { subject: string; count: number }>();
  for (const enrollment of dueEnrollments) {
    const stages = enrollment.sequence.stages;
    const stage = stages[enrollment.currentStep];
    if (!stage) continue;

    const stepNumber = stage.stepNumber;
    const existing = stepMap.get(stepNumber);
    if (existing) {
      existing.count++;
    } else {
      stepMap.set(stepNumber, { subject: stage.subject, count: 1 });
    }
  }

  const dueByStep = Array.from(stepMap.entries())
    .map(([stepNumber, { subject, count }]) => ({ stepNumber, subject, count }))
    .sort((a, b) => a.stepNumber - b.stepNumber);

  const totalDueToday = dueEnrollments.length;

  // Recent sends
  const recentSends = await prisma.outreachLog.findMany({
    where: { workspaceId },
    orderBy: { sentAt: "desc" },
    take: 20,
    select: {
      id: true,
      leadId: true,
      email: true,
      subject: true,
      stage: true,
      sentAt: true,
    },
  });

  return NextResponse.json({ dueByStep, recentSends, totalDueToday });
}
