import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string; stepId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stepId } = await params;
  const step = await prisma.journeyStep.findUnique({ where: { id: stepId } }) as any;
  if (!step) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attachments = (step.attachments as any[]) ?? [];
  return NextResponse.json({ attachments });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stepId } = await params;
  const step = await prisma.journeyStep.findUnique({ where: { id: stepId } }) as any;
  if (!step) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(process.cwd(), "public", "uploads", "journey-attachments", stepId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);

  const url = `/uploads/journey-attachments/${stepId}/${filename}`;
  const existing = (step.attachments as any[]) ?? [];
  const updated = [...existing, { filename, url }];

  await (prisma.journeyStep as any).update({
    where: { id: stepId },
    data: { attachments: updated },
  });

  return NextResponse.json({ url, filename });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stepId } = await params;
  const step = await prisma.journeyStep.findUnique({ where: { id: stepId } }) as any;
  if (!step) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { url } = body as { url: string };
  if (!url) return NextResponse.json({ error: "No url" }, { status: 400 });

  // Remove from filesystem
  try {
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath);
  } catch {}

  const existing = (step.attachments as any[]) ?? [];
  const updated = existing.filter((a: any) => a.url !== url);

  await (prisma.journeyStep as any).update({
    where: { id: stepId },
    data: { attachments: updated },
  });

  return NextResponse.json({ ok: true });
}
