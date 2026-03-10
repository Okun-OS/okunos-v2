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

  const journeys = await prisma.customerJourney.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { steps: true, enrollments: true } },
      enrollments: { where: { status: "ACTIVE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(journeys);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const body = await req.json();
  const { name, description, steps } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const journey = await prisma.customerJourney.create({
    data: {
      workspaceId,
      name,
      description: description || null,
      steps: {
        create: (steps || []).map((s: any, i: number) => ({
          stepNumber: s.stepNumber ?? i + 1,
          delayDays: s.delayDays ?? 0,
          subject: s.subject,
          body: s.body,
          type: s.type ?? "EMAIL",
        })),
      },
    },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  await logActivity(workspaceId, "JOURNEY_CREATED", `Journey "${name}" erstellt`, {
    entityId: journey.id,
    entityType: "CustomerJourney",
  });

  return NextResponse.json(journey, { status: 201 });
}
