import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plan-gates";
import { scrapeGoogleMaps } from "@/lib/maps-scraper";
import { scrapeWebsite } from "@/lib/scraper";
import { extractContactName } from "@/lib/website-scraper-enhanced";
import { logActivity } from "@/lib/activity";

async function getWorkspacePlan(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  });
  return (workspace?.plan ?? "FREE") as "FREE" | "STARTER" | "PRO" | "AGENCY";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const jobs = await prisma.mapsScrapeJob.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      keyword: true,
      location: true,
      maxResults: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  // Check plan gate
  const plan = await getWorkspacePlan(workspaceId);
  if (!canUseFeature(plan, "mapsImport")) {
    return NextResponse.json(
      {
        error:
          "Google Maps Import erfordert PRO oder AGENCY Plan. Bitte upgrade dein Abonnement.",
      },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    keyword,
    location,
    maxResults,
    scrapeWebsites = false,
    autoCreateLeads = false,
    autoEnroll = false,
    sequenceId,
  } = body;

  if (!keyword?.trim()) {
    return NextResponse.json(
      { error: "Keyword ist ein Pflichtfeld." },
      { status: 400 }
    );
  }
  if (!location?.trim()) {
    return NextResponse.json(
      { error: "Ort ist ein Pflichtfeld." },
      { status: 400 }
    );
  }

  const max = Math.min(Math.max(parseInt(maxResults) || 20, 1), 50);

  // Create job with PENDING status
  const job = await prisma.mapsScrapeJob.create({
    data: {
      workspaceId,
      keyword: keyword.trim(),
      location: location.trim(),
      maxResults: max,
      status: "PENDING",
    },
  });

  // Step 1: Scrape Google Maps
  let mapsResults: any[] = [];
  let finalStatus = "DONE";
  let errorMsg: string | null = null;

  try {
    mapsResults = await scrapeGoogleMaps(keyword.trim(), location.trim(), max);
  } catch (err: any) {
    finalStatus = "ERROR";
    errorMsg = err?.message ?? String(err);
  }

  if (finalStatus === "ERROR") {
    await prisma.mapsScrapeJob.update({
      where: { id: job.id },
      data: { status: "ERROR", results: { error: errorMsg } },
    });
    return NextResponse.json(
      { error: `Scraping fehlgeschlagen: ${errorMsg}`, jobId: job.id },
      { status: 500 }
    );
  }

  // Step 2: Optionally scrape websites for emails & contact names
  let enrichedResults = mapsResults;
  if (scrapeWebsites) {
    enrichedResults = await Promise.all(
      mapsResults.map(async (r) => {
        if (!r.website) return r;
        try {
          const { emails } = await scrapeWebsite(r.website);
          const contactName = emails.length > 0 ? null : null; // contact name comes from HTML
          return {
            ...r,
            foundEmails: emails,
            email: emails[0] ?? null,
          };
        } catch {
          return r;
        }
      })
    );
  }

  // Update job with results
  await prisma.mapsScrapeJob.update({
    where: { id: job.id },
    data: { status: "DONE", results: enrichedResults },
  });

  // Step 3: Optionally create leads
  let leadsCreated = 0;
  let leadsSkipped = 0;
  const createdLeadIds: string[] = [];

  if (autoCreateLeads) {
    // Load existing data for deduplication
    const existingLeads = await prisma.lead.findMany({
      where: { workspaceId },
      select: { email: true, website: true, firma: true },
    });
    const existingEmails = new Set(
      existingLeads.map((l) => l.email?.toLowerCase()).filter(Boolean)
    );
    const existingWebsites = new Set(
      existingLeads.map((l) => l.website?.toLowerCase()).filter(Boolean)
    );
    const existingFirmen = new Set(
      existingLeads.map((l) => l.firma?.toLowerCase()).filter(Boolean)
    );

    for (const r of enrichedResults) {
      if (!r.name) continue;

      const firma = r.name.trim();
      const email = r.email?.toLowerCase() || r.foundEmails?.[0]?.toLowerCase() || null;
      const website = r.website?.toLowerCase() || null;

      // Deduplication
      const isDuplicate =
        (email && existingEmails.has(email)) ||
        (website && existingWebsites.has(website)) ||
        existingFirmen.has(firma.toLowerCase());

      if (isDuplicate) {
        leadsSkipped++;
        continue;
      }

      try {
        const lead = await prisma.lead.create({
          data: {
            workspaceId,
            firma,
            email: email || null,
            telefon: r.phone || null,
            website: r.website || null,
            quelle: `Google Maps: ${keyword.trim()} ${location.trim()}`,
            foundEmails: r.foundEmails?.join(",") || null,
          },
        });
        createdLeadIds.push(lead.id);
        leadsCreated++;

        // Track for in-batch deduplication
        if (email) existingEmails.add(email);
        if (website) existingWebsites.add(website);
        existingFirmen.add(firma.toLowerCase());
      } catch {
        leadsSkipped++;
      }
    }

    if (leadsCreated > 0) {
      await logActivity(
        workspaceId,
        "LEAD",
        `Maps Autopilot: ${leadsCreated} Leads aus "${keyword.trim()} ${location.trim()}" erstellt`
      );
    }
  }

  // Step 4: Optionally enroll leads in sequence
  let enrolled = 0;
  let enrollErrors = 0;

  if (autoEnroll && createdLeadIds.length > 0) {
    // Determine sequence: use provided sequenceId or find default sequence
    let targetSequenceId = sequenceId;
    if (!targetSequenceId) {
      const defaultSeq = await prisma.emailSequence.findFirst({
        where: { workspaceId, isDefault: true },
        include: { stages: { orderBy: { stepNumber: "asc" }, take: 1 } },
      });
      targetSequenceId = defaultSeq?.id;
    }

    if (targetSequenceId) {
      const sequence = await prisma.emailSequence.findFirst({
        where: { id: targetSequenceId, workspaceId },
        include: { stages: { orderBy: { stepNumber: "asc" } } },
      });

      if (sequence && sequence.stages.length > 0) {
        const firstStage = sequence.stages[0];
        const nextSendAt = new Date(
          Date.now() + firstStage.delayDays * 86400000
        );

        for (const leadId of createdLeadIds) {
          try {
            // Check not already enrolled
            const existing = await prisma.outreachEnrollment.findFirst({
              where: { leadId, sequenceId: targetSequenceId, status: { in: ["ACTIVE", "PAUSED"] } },
            });
            if (existing) continue;

            await prisma.outreachEnrollment.create({
              data: {
                leadId,
                sequenceId: targetSequenceId,
                currentStep: 0,
                status: "ACTIVE",
                nextSendAt,
                currentStageId: firstStage.id,
              },
            });
            enrolled++;
          } catch {
            enrollErrors++;
          }
        }

        if (enrolled > 0) {
          await logActivity(
            workspaceId,
            "OUTREACH",
            `Maps Autopilot: ${enrolled} Leads in Sequenz "${sequence.name}" eingeschrieben`
          );
        }
      }
    }
  }

  return NextResponse.json({
    jobId: job.id,
    results: enrichedResults,
    pipeline: autoCreateLeads
      ? { leadsCreated, leadsSkipped, enrolled, enrollErrors }
      : undefined,
  });
}
