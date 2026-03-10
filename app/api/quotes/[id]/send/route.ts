import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;

  const quote = await prisma.quote.findFirst({
    where: { id, workspaceId },
    include: {
      workspace: true,
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!quote.customerEmail) {
    return NextResponse.json({ error: "Keine Kunden-E-Mail hinterlegt." }, { status: 400 });
  }

  const workspace = quote.workspace;
  const senderName = workspace.fromName || workspace.name || "OkunOS";
  const items = Array.isArray(quote.items) ? quote.items as any[] : [];

  const itemLines = items
    .map((item: any) => `  - ${item.description}: ${item.quantity}x ${item.unitPrice?.toFixed(2)} €`)
    .join("\n");

  const body = [
    `Sehr geehrte Damen und Herren,`,
    ``,
    `anbei erhalten Sie unser Angebot ${quote.quoteNumber}.`,
    ``,
    `Gesamtbetrag: ${quote.totalAmount.toFixed(2)} €`,
    quote.validUntil ? `Gültig bis: ${new Date(quote.validUntil).toLocaleDateString("de-DE")}` : "",
    ``,
    `Positionen:`,
    itemLines,
    ``,
    quote.notes ? `Hinweise: ${quote.notes}` : "",
    ``,
    `Mit freundlichen Grüßen`,
    senderName,
  ]
    .filter((l) => l !== "")
    .join("\n");

  const result = await sendEmail(
    {
      to: quote.customerEmail,
      subject: `Angebot ${quote.quoteNumber}`,
      text: body,
    },
    workspace
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "E-Mail konnte nicht gesendet werden." }, { status: 500 });
  }

  const updated = await prisma.quote.update({
    where: { id },
    data: {
      sentAt: new Date(),
      status: "SENT",
    },
  });

  await logActivity(workspaceId, "QUOTE_SENT", `Angebot gesendet: ${quote.quoteNumber} an ${quote.customerEmail}`, {
    entityId: quote.id,
    entityType: "Quote",
  });

  return NextResponse.json({ ok: true, quote: updated });
}
