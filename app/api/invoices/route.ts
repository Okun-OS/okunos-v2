import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

async function nextInvoiceNumber(workspaceId: string): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.invoiceCounter.upsert({
    where: { workspaceId },
    create: { workspaceId, year, counter: 1 },
    update: { counter: { increment: 1 } },
  });
  if (counter.year !== year) {
    const reset = await prisma.invoiceCounter.update({
      where: { workspaceId },
      data: { year, counter: 1 },
    });
    return `RE-${year}-${String(reset.counter).padStart(4, "0")}`;
  }
  return `RE-${year}-${String(counter.counter).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const invoices = await prisma.invoice.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      deal: { select: { firma: true } },
      client: { select: { firmenname: true } },
    },
  });

  return NextResponse.json(invoices);
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

  const {
    dealId,
    clientId,
    customerName,
    customerEmail,
    contactLine,
    dueDate,
    taxMode,
    items,
    notes,
  } = body;

  const invoiceNumber = await nextInvoiceNumber(workspaceId);

  const totalAmount = Array.isArray(items)
    ? items.reduce((sum: number, item: any) => sum + (item.quantity ?? 1) * (item.unitPrice ?? 0), 0)
    : 0;

  const invoice = await prisma.invoice.create({
    data: {
      workspaceId,
      dealId: dealId || null,
      clientId: clientId || null,
      invoiceNumber,
      customerName: customerName?.trim() || null,
      customerEmail: customerEmail?.trim() || null,
      contactLine: contactLine?.trim() || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      taxMode: taxMode || "NONE",
      items: items ?? [],
      totalAmount,
      notes: notes?.trim() || null,
      status: "DRAFT",
    },
  });

  await logActivity(workspaceId, "INVOICE", `Rechnung erstellt: ${invoice.invoiceNumber}`, {
    entityId: invoice.id,
    entityType: "Invoice",
  });

  return NextResponse.json(invoice, { status: 201 });
}
