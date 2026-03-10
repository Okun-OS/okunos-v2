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

  const quote = await prisma.quote.findFirst({
    where: { id, workspaceId },
    include: {
      deal: true,
      workspace: {
        select: {
          name: true,
          fromName: true,
          fromEmail: true,
        },
      },
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(quote);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.quote.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { customerName, customerEmail, contactLine, validUntil, items, notes, status, sentAt } = body;

  const totalAmount =
    items !== undefined
      ? Array.isArray(items)
        ? items.reduce((sum: number, item: any) => sum + (item.quantity ?? 1) * (item.unitPrice ?? 0), 0)
        : 0
      : existing.totalAmount;

  const quote = await prisma.quote.update({
    where: { id },
    data: {
      ...(customerName !== undefined ? { customerName } : {}),
      ...(customerEmail !== undefined ? { customerEmail } : {}),
      ...(contactLine !== undefined ? { contactLine } : {}),
      ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
      ...(items !== undefined ? { items, totalAmount } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(sentAt !== undefined ? { sentAt: sentAt ? new Date(sentAt) : null } : {}),
    },
  });

  return NextResponse.json(quote);
}
