import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const sequences = await prisma.emailSequence.findMany({
    where: { workspaceId },
    include: {
      stages: { orderBy: { stepNumber: "asc" } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sequences);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, isDefault, stages } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name ist Pflichtfeld." }, { status: 400 });
  }

  // If setting as default, unset others
  if (isDefault) {
    await prisma.emailSequence.updateMany({
      where: { workspaceId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const sequence = await prisma.emailSequence.create({
    data: {
      workspaceId,
      name: name.trim(),
      isDefault: !!isDefault,
      stages: {
        create: (stages ?? []).map((s: any) => ({
          stepNumber: s.stepNumber,
          delayDays: s.delayDays ?? 0,
          subject: s.subject ?? "",
          body: s.body ?? "",
        })),
      },
    },
    include: { stages: { orderBy: { stepNumber: "asc" } } },
  });

  return NextResponse.json(sequence, { status: 201 });
}
