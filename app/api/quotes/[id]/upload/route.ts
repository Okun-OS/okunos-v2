import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;

  const quote = await prisma.quote.findFirst({ where: { id, workspaceId } });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Keine Datei übergeben." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Nur PDF-Dateien erlaubt." }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "quotes", workspaceId);
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, `${id}.pdf`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/quotes/${workspaceId}/${id}.pdf`;

  const updated = await prisma.quote.update({
    where: { id },
    data: {
      fileUrl,
      isUpload: true,
    },
  });

  return NextResponse.json({ fileUrl, quote: updated });
}
