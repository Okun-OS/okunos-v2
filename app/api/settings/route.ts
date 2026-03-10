import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wsId = (session.user as any).workspaceId as string;

  const ws = await prisma.workspace.findUnique({
    where: { id: wsId },
    include: {
      members: { include: { user: { select: { email: true, name: true } } } },
    },
  });
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    name: ws.name,
    slug: ws.slug,
    plan: ws.plan,
    fromName: ws.fromName || "",
    fromEmail: ws.fromEmail || "",
    emailProvider: ws.emailProvider || "RESEND",
    smtpHost: ws.smtpHost || "",
    smtpPort: ws.smtpPort?.toString() || "587",
    smtpUser: ws.smtpUser || "",
    smtpPassword: "", // never expose
    outreachRunnerEnabled: ws.outreachRunnerEnabled,
    outreachRunnerTime: ws.outreachRunnerTime || "09:00",
    journeyRunnerEnabled: ws.journeyRunnerEnabled,
    journeyRunnerTime: ws.journeyRunnerTime || "10:00",
    maxEmailsPerDay: ws.maxEmailsPerDay?.toString() || "",
    maxEmailsPerRun: ws.maxEmailsPerRun?.toString() || "",
    randomDelayEnabled: ws.randomDelayEnabled,
    lastOutreachRunAt: ws.lastOutreachRunAt?.toISOString() || null,
    lastJourneyRunAt: ws.lastJourneyRunAt?.toISOString() || null,
    members: ws.members.map((m) => ({
      email: m.user.email,
      name: m.user.name,
      role: m.role,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wsId = (session.user as any).workspaceId as string;

  const body = await req.json();

  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.fromName !== undefined) data.fromName = body.fromName;
  if (body.fromEmail !== undefined) data.fromEmail = body.fromEmail;
  if (body.emailProvider !== undefined) data.emailProvider = body.emailProvider;
  if (body.smtpHost !== undefined) data.smtpHost = body.smtpHost;
  if (body.smtpPort !== undefined) data.smtpPort = parseInt(body.smtpPort) || 587;
  if (body.smtpUser !== undefined) data.smtpUser = body.smtpUser;
  if (body.smtpPassword && body.smtpPassword !== "") data.smtpPassword = body.smtpPassword;
  if (body.outreachRunnerEnabled !== undefined) data.outreachRunnerEnabled = body.outreachRunnerEnabled;
  if (body.outreachRunnerTime !== undefined) data.outreachRunnerTime = body.outreachRunnerTime;
  if (body.journeyRunnerEnabled !== undefined) data.journeyRunnerEnabled = body.journeyRunnerEnabled;
  if (body.journeyRunnerTime !== undefined) data.journeyRunnerTime = body.journeyRunnerTime;
  if (body.maxEmailsPerDay !== undefined) data.maxEmailsPerDay = body.maxEmailsPerDay ? parseInt(body.maxEmailsPerDay) : null;
  if (body.maxEmailsPerRun !== undefined) data.maxEmailsPerRun = body.maxEmailsPerRun ? parseInt(body.maxEmailsPerRun) : null;
  if (body.randomDelayEnabled !== undefined) data.randomDelayEnabled = body.randomDelayEnabled;
  if (body.onboardingDone !== undefined) data.onboardingDone = body.onboardingDone;

  await prisma.workspace.update({ where: { id: wsId }, data });
  return NextResponse.json({ ok: true });
}
