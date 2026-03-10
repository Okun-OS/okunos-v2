import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runOutreachForWorkspace } from "@/lib/outreach-runner";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  try {
    const result = await runOutreachForWorkspace(workspaceId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Runner failed" }, { status: 500 });
  }
}
