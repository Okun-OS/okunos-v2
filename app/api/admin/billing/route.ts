import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(user: any): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  return user.isSystemAdmin || adminEmails.includes((user.email || "").toLowerCase());
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscriptions = await prisma.workspaceSubscription.findMany({
    include: {
      workspace: { select: { name: true, plan: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = subscriptions.map((s) => ({
    id: s.id,
    workspaceId: s.workspaceId,
    workspaceName: s.workspace.name,
    plan: s.workspace.plan,
    planId: s.planId,
    status: s.status,
    currentPeriodEnd: s.currentPeriodEnd,
    stripeSubscriptionId: s.stripeSubscriptionId,
  }));

  return NextResponse.json({ subscriptions: result });
}
