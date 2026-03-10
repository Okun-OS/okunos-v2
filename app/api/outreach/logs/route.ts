import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 100);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const sentAtFilter: Record<string, Date> = {};
  if (fromParam) {
    sentAtFilter.gte = new Date(fromParam);
  }
  if (toParam) {
    // Include the full day of "to" date
    const toDate = new Date(toParam);
    toDate.setHours(23, 59, 59, 999);
    sentAtFilter.lte = toDate;
  }

  const where = {
    workspaceId,
    ...(Object.keys(sentAtFilter).length > 0 ? { sentAt: sentAtFilter } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.outreachLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        subject: true,
        stage: true,
        sentAt: true,
      },
    }),
    prisma.outreachLog.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({ logs, total, page, pages });
}
