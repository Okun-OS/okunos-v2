import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ jobId: string }>;
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

  const { jobId } = await params;

  const job = await prisma.mapsScrapeJob.findFirst({
    where: { id: jobId, workspaceId },
  });

  if (!job) {
    return NextResponse.json({ error: "Job nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(job);
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

  const { jobId } = await params;

  const job = await prisma.mapsScrapeJob.findFirst({
    where: { id: jobId, workspaceId },
  });

  if (!job) {
    return NextResponse.json({ error: "Job nicht gefunden" }, { status: 404 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { selectedResults, autoEnroll } = body as {
    selectedResults: number[];
    autoEnroll: boolean;
  };

  if (!Array.isArray(selectedResults) || selectedResults.length === 0) {
    return NextResponse.json(
      { error: "Keine Ergebnisse ausgewählt." },
      { status: 400 }
    );
  }

  const jobResults = Array.isArray(job.results) ? (job.results as any[]) : [];

  const selected = selectedResults
    .map((idx) => jobResults[idx])
    .filter(Boolean);

  // Find default sequence if autoEnroll
  let defaultSequenceId: string | null = null;
  if (autoEnroll) {
    const defaultSeq = await prisma.emailSequence.findFirst({
      where: { workspaceId, isDefault: true },
      select: { id: true },
    });
    defaultSequenceId = defaultSeq?.id ?? null;
  }

  let created = 0;
  let skipped = 0;

  for (const result of selected) {
    const name: string = result.name ?? "";
    const website: string | null = result.website ?? null;
    const phone: string | null = result.phone ?? null;
    const address: string | null = result.address ?? null;

    // Deduplication: check by website or company name
    const existing = await prisma.lead.findFirst({
      where: {
        workspaceId,
        OR: [
          ...(website ? [{ website: { equals: website, mode: "insensitive" as const } }] : []),
          { firma: { equals: name, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const lead = await prisma.lead.create({
      data: {
        workspaceId,
        firma: name,
        website: website || null,
        telefon: phone || null,
        quelle: "Google Maps",
        contactName: null,
      },
    });

    await logActivity(
      workspaceId,
      "LEAD",
      `Lead aus Google Maps importiert: ${lead.firma}`,
      { entityId: lead.id, entityType: "Lead" }
    );

    // Auto-enroll in default sequence if requested
    if (autoEnroll && defaultSequenceId) {
      const firstStage = await prisma.emailStage.findFirst({
        where: { sequenceId: defaultSequenceId },
        orderBy: { stepNumber: "asc" },
        select: { id: true },
      });

      if (firstStage) {
        await prisma.outreachEnrollment.create({
          data: {
            workspaceId,
            leadId: lead.id,
            sequenceId: defaultSequenceId,
            currentStageId: firstStage.id,
            status: "ACTIVE",
            nextSendAt: new Date(),
          },
        });
      }
    }

    created++;
  }

  return NextResponse.json({ created, skipped });
}
