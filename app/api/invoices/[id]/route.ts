import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, workspaceId },
    include: {
      deal: true,
      client: true,
      workspace: {
        select: {
          name: true,
          fromName: true,
          fromEmail: true,
        },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.invoice.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    status,
    customerName,
    customerEmail,
    contactLine,
    dueDate,
    taxMode,
    items,
    notes,
    sentAt,
    paidAt,
  } = body;

  const totalAmount =
    items !== undefined
      ? Array.isArray(items)
        ? items.reduce((sum: number, item: any) => sum + (item.quantity ?? 1) * (item.unitPrice ?? 0), 0)
        : 0
      : existing.totalAmount;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(customerName !== undefined ? { customerName } : {}),
      ...(customerEmail !== undefined ? { customerEmail } : {}),
      ...(contactLine !== undefined ? { contactLine } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(taxMode !== undefined ? { taxMode } : {}),
      ...(items !== undefined ? { items, totalAmount } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(sentAt !== undefined ? { sentAt: sentAt ? new Date(sentAt) : null } : {}),
      ...(paidAt !== undefined ? { paidAt: paidAt ? new Date(paidAt) : null } : {}),
      // If marking as PAID, set paidAt to now if not provided
      ...(status === "PAID" && paidAt === undefined ? { paidAt: new Date() } : {}),
    },
  });

  if (status === "PAID") {
    await logActivity(workspaceId, "INVOICE_PAID", `Rechnung als bezahlt markiert: ${invoice.invoiceNumber}`, {
      entityId: invoice.id,
      entityType: "Invoice",
    });
  }

  return NextResponse.json(invoice);
}
