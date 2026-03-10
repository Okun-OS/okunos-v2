import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    fromEmail?: string;
    subject?: string;
    body?: string;
    toEmail?: string;
    workspaceId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fromEmail, subject, body: emailBody, toEmail, workspaceId: providedWorkspaceId } = body;

  if (!fromEmail) {
    return NextResponse.json({ error: "fromEmail is required" }, { status: 400 });
  }

  // Workspace detection
  let workspaceId: string | null = providedWorkspaceId ?? null;

  if (!workspaceId && toEmail) {
    // Try matching workspace.fromEmail
    const wsFromEmail = await prisma.workspace.findFirst({
      where: { fromEmail: toEmail },
      select: { id: true },
    });

    if (wsFromEmail) {
      workspaceId = wsFromEmail.id;
    } else {
      // Try slug from toEmail like "slug@reply.okunos.com"
      const slugMatch = toEmail.match(/^([^@]+)@reply\./);
      if (slugMatch) {
        const slug = slugMatch[1];
        const wsFromSlug = await prisma.workspace.findFirst({
          where: { slug },
          select: { id: true },
        });
        if (wsFromSlug) {
          workspaceId = wsFromSlug.id;
        }
      }
    }
  }

  const workspaceFound = !!workspaceId;

  if (!workspaceId) {
    // Still save with a fallback – but we can't associate. Return early.
    return NextResponse.json({ success: false, leadFound: false, workspaceFound: false });
  }

  // Lead matching
  const lead = await prisma.lead.findFirst({
    where: { email: fromEmail, workspaceId },
  });

  const leadFound = !!lead;

  // Save InboundEmail
  await prisma.inboundEmail.create({
    data: {
      workspaceId,
      leadId: lead?.id ?? null,
      fromEmail,
      subject: subject ?? null,
      body: emailBody ?? null,
    },
  });

  if (lead) {
    // Update lead
    await prisma.lead.update({
      where: { id: lead.id },
      data: { replied: true, outStatus: "DONE" },
    });

    // Update active enrollments
    await prisma.outreachEnrollment.updateMany({
      where: { leadId: lead.id, status: "ACTIVE" },
      data: { status: "DONE" },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        workspaceId,
        type: "REPLY_RECEIVED",
        message: `Antwort von ${fromEmail}`,
        entityId: lead.id,
        entityType: "Lead",
      },
    });
  }

  return NextResponse.json({ success: true, leadFound, workspaceFound });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get("take") ?? "50"), 100);

  const emails = await prisma.inboundEmail.findMany({
    where: { workspaceId },
    orderBy: { receivedAt: "desc" },
    take,
    include: {
      lead: { select: { id: true, firma: true, email: true } },
    },
  });

  return NextResponse.json({ emails });
}
