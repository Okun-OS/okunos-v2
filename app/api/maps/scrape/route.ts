import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, getPlanLimits } from "@/lib/plan-gates";
import { scrapeGoogleMaps } from "@/lib/maps-scraper";

async function getWorkspacePlan(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  });
  return (workspace?.plan ?? "FREE") as
    | "FREE"
    | "STARTER"
    | "PRO"
    | "AGENCY";
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

  const { keyword, location, maxResults } = body;

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

  // Start scraping
  let results: any[] = [];
  let finalStatus = "DONE";
  let errorMsg: string | null = null;

  try {
    results = await scrapeGoogleMaps(keyword.trim(), location.trim(), max);
  } catch (err: any) {
    finalStatus = "ERROR";
    errorMsg = err?.message ?? String(err);
  }

  // Update job with results
  await prisma.mapsScrapeJob.update({
    where: { id: job.id },
    data: {
      status: finalStatus,
      results: errorMsg ? { error: errorMsg } : results,
    },
  });

  if (finalStatus === "ERROR") {
    return NextResponse.json(
      { error: `Scraping fehlgeschlagen: ${errorMsg}`, jobId: job.id },
      { status: 500 }
    );
  }

  return NextResponse.json({ jobId: job.id, results });
}
