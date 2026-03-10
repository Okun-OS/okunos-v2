import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scrapeWebsite, normalizeUrl } from "@/lib/website-scraper-enhanced";
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

  if (!lead.website) {
    return NextResponse.json(
      { error: "Lead hat keine Website-URL." },
      { status: 400 }
    );
  }

  const normalizedWebsite = normalizeUrl(lead.website);
  const { emails, error } = await scrapeWebsite(normalizedWebsite);

  if (error && emails.length === 0) {
    return NextResponse.json({ error }, { status: 422 });
  }

  // Store found emails back on the lead
  if (emails.length > 0) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { foundEmails: emails.join(",") },
    });

    await logActivity(
      workspaceId,
      "LEAD",
      `Website gescannt: ${emails.length} E-Mail(s) gefunden für ${lead.firma}`,
      { entityId: lead.id, entityType: "Lead" }
    );
  }

  return NextResponse.json({ emails });
}
