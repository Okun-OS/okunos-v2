import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

async function nextQuoteNumber(workspaceId: string): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.quoteCounter.upsert({
    where: { workspaceId },
    create: { workspaceId, year, counter: 1 },
    update: { counter: { increment: 1 } },
  });
  // Reset counter if year changed
  if (counter.year !== year) {
    const reset = await prisma.quoteCounter.update({
      where: { workspaceId },
      data: { year, counter: 1 },
    });
    return `AN-${year}-${String(reset.counter).padStart(4, "0")}`;
  }
  return `AN-${year}-${String(counter.counter).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const quotes = await prisma.quote.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { deal: { select: { firma: true } } },
  });

  return NextResponse.json(quotes);
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

  const { dealId, customerName, customerEmail, contactLine, validUntil, items, notes } = body;

  const quoteNumber = await nextQuoteNumber(workspaceId);

  const totalAmount = Array.isArray(items)
    ? items.reduce((sum: number, item: any) => sum + (item.quantity ?? 1) * (item.unitPrice ?? 0), 0)
    : 0;

  const quote = await prisma.quote.create({
    data: {
      workspaceId,
      dealId: dealId || null,
      quoteNumber,
      customerName: customerName?.trim() || null,
      customerEmail: customerEmail?.trim() || null,
      contactLine: contactLine?.trim() || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      items: items ?? [],
      totalAmount,
      notes: notes?.trim() || null,
      status: "DRAFT",
    },
  });

  await logActivity(workspaceId, "QUOTE", `Angebot erstellt: ${quote.quoteNumber}`, {
    entityId: quote.id,
    entityType: "Quote",
  });

  return NextResponse.json(quote, { status: 201 });
}
