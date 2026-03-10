import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { id } = await params;
  const body = await req.json();
  const { journeyId } = body;

  if (!journeyId) {
    return NextResponse.json({ error: "journeyId is required" }, { status: 400 });
  }

  // Verify client belongs to workspace
  const client = await prisma.client.findFirst({
    where: { id, workspaceId },
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Verify journey belongs to workspace
  const journey = await prisma.customerJourney.findFirst({
    where: { id: journeyId, workspaceId },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });
  if (!journey) return NextResponse.json({ error: "Journey not found" }, { status: 404 });

  // Check if already enrolled and active
  const existing = await prisma.journeyEnrollment.findFirst({
    where: { clientId: id, journeyId, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ error: "Client is already enrolled in this journey" }, { status: 409 });
  }

  // Compute first nextSendAt based on first step's delayDays
  const firstStep = journey.steps[0];
  const nextSendAt = firstStep
    ? new Date(Date.now() + firstStep.delayDays * 86400000)
    : null;

  const enrollment = await prisma.journeyEnrollment.create({
    data: {
      clientId: id,
      journeyId,
      currentStep: 0,
      status: "ACTIVE",
      nextSendAt,
    },
  });

  await logActivity(
    workspaceId,
    "JOURNEY_ENROLLED",
    `Kunde "${client.firmenname}" in Journey "${journey.name}" eingeschrieben`,
    { entityId: enrollment.id, entityType: "JourneyEnrollment" }
  );

  return NextResponse.json(enrollment, { status: 201 });
}
