import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [sequences, enrollments, sentToday, totalActive, workspace, totalLogs, repliedLeads] =
    await Promise.all([
      prisma.emailSequence.findMany({
        where: { workspaceId },
        include: {
          _count: { select: { stages: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.outreachEnrollment.findMany({
        where: {
          lead: { workspaceId },
          status: { in: ["ACTIVE", "DONE"] },
        },
        include: {
          lead: { select: { firma: true } },
          sequence: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.outreachLog.count({
        where: { workspaceId, sentAt: { gte: startOfToday } },
      }),
      prisma.outreachEnrollment.count({
        where: { lead: { workspaceId }, status: "ACTIVE" },
      }),
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
      prisma.outreachLog.count({ where: { workspaceId } }),
      prisma.lead.count({ where: { workspaceId, replied: true } }),
    ]);

  const replyRate =
    totalLogs > 0 ? ((repliedLeads / totalLogs) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    sequences,
    enrollments,
    sentToday,
    totalActive,
    replyRate,
    lastOutreachRunAt: workspace?.lastOutreachRunAt ?? null,
  });
}
