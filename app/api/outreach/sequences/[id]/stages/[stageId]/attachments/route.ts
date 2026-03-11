import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string; stageId: string }>;
}

async function getStageForWorkspace(stageId: string, workspaceId: string) {
  const stage = await prisma.emailStage.findUnique({
    where: { id: stageId },
    include: { sequence: { select: { workspaceId: true } } },
  }) as any;
  if (!stage || stage.sequence.workspaceId !== workspaceId) return null;
  return stage;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { stageId } = await params;
  const stage = await getStageForWorkspace(stageId, workspaceId);
  if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attachments = (stage.attachments as any[]) ?? [];
  return NextResponse.json({ attachments });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { stageId } = await params;
  const stage = await getStageForWorkspace(stageId, workspaceId);
  if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(process.cwd(), "public", "uploads", "email-attachments", stageId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);

  const url = `/uploads/email-attachments/${stageId}/${filename}`;
  const existing = (stage.attachments as any[]) ?? [];
  const updated = [...existing, { filename, url }];

  await (prisma.emailStage as any).update({
    where: { id: stageId },
    data: { attachments: updated },
  });

  return NextResponse.json({ url, filename });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { stageId } = await params;
  const stage = await getStageForWorkspace(stageId, workspaceId);
  if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { url } = body as { url: string };
  if (!url) return NextResponse.json({ error: "No url" }, { status: 400 });

  try {
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath);
  } catch {}

  const existing = (stage.attachments as any[]) ?? [];
  const updated = existing.filter((a: any) => a.url !== url);

  await (prisma.emailStage as any).update({
    where: { id: stageId },
    data: { attachments: updated },
  });

  return NextResponse.json({ ok: true });
}
