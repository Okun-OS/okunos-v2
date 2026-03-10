import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runJourneysForWorkspace } from "@/lib/journey-runner";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const result = await runJourneysForWorkspace(workspaceId);

  return NextResponse.json({ ok: true, ...result });
}
