import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;

  const sequence = await prisma.emailSequence.findFirst({
    where: { id, workspaceId },
    include: {
      stages: { orderBy: { stepNumber: "asc" } },
      enrollments: {
        include: { lead: { select: { id: true, firma: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(sequence);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.emailSequence.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, isDefault, stages } = body;

  // If setting as default, unset others
  if (isDefault) {
    await prisma.emailSequence.updateMany({
      where: { workspaceId, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  // Update sequence
  await prisma.emailSequence.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(isDefault !== undefined ? { isDefault } : {}),
    },
  });

  // Replace stages if provided
  if (stages !== undefined) {
    await prisma.emailStage.deleteMany({ where: { sequenceId: id } });
    if (stages.length > 0) {
      await prisma.emailStage.createMany({
        data: stages.map((s: any) => ({
          sequenceId: id,
          stepNumber: s.stepNumber,
          delayDays: s.delayDays ?? 0,
          subject: s.subject ?? "",
          body: s.body ?? "",
        })),
      });
    }
  }

  const updated = await prisma.emailSequence.findFirst({
    where: { id },
    include: { stages: { orderBy: { stepNumber: "asc" } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.emailSequence.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emailSequence.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
