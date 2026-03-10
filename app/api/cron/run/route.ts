import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runOutreachForWorkspace } from "@/lib/outreach-runner";
import { runJourneysForWorkspace } from "@/lib/journey-runner";

function timeMatches(targetTime: string): boolean {
  const [h, m] = targetTime.split(":").map(Number);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = h * 60 + m;
  return Math.abs(nowMinutes - targetMinutes) <= 5;
}

function shouldRun(lastRunAt: Date | null): boolean {
  if (!lastRunAt) return true;
  return Date.now() - lastRunAt.getTime() > 23 * 60 * 60 * 1000;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    where: { isActive: true },
  });

  let processed = 0;

  for (const ws of workspaces) {
    try {
      if (
        ws.outreachRunnerEnabled &&
        ws.outreachRunnerTime &&
        timeMatches(ws.outreachRunnerTime) &&
        shouldRun(ws.lastOutreachRunAt)
      ) {
        await runOutreachForWorkspace(ws.id);
        processed++;
      }
      if (
        ws.journeyRunnerEnabled &&
        ws.journeyRunnerTime &&
        timeMatches(ws.journeyRunnerTime) &&
        shouldRun(ws.lastJourneyRunAt)
      ) {
        await runJourneysForWorkspace(ws.id);
        processed++;
      }
    } catch {
      // continue with next workspace
    }
  }

  return NextResponse.json({ ok: true, processed });
}
