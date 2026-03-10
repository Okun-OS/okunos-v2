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

  const invoice = await prisma.invoice.findFirst({
    where: { id, workspaceId },
    include: { workspace: true },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!invoice.customerEmail) {
    return NextResponse.json({ error: "Keine Kunden-E-Mail hinterlegt." }, { status: 400 });
  }

  const workspace = invoice.workspace;
  const senderName = workspace.fromName || workspace.name || "OkunOS";
  const items = Array.isArray(invoice.items) ? invoice.items as any[] : [];

  const itemLines = items
    .map((item: any) => `  - ${item.description}: ${item.quantity}x ${item.unitPrice?.toFixed(2)} €`)
    .join("\n");

  let taxLine = "";
  if (invoice.taxMode === "MWST") {
    const net = invoice.totalAmount;
    const vat = net * (invoice.vatRate ?? 0.19);
    const gross = net + vat;
    taxLine = `\nNettobetrag: ${net.toFixed(2)} €\nMwSt. (${((invoice.vatRate ?? 0.19) * 100).toFixed(0)}%): ${vat.toFixed(2)} €\nGesamtbetrag (brutto): ${gross.toFixed(2)} €`;
  } else if (invoice.taxMode === "KLEINUNTERNEHMER") {
    taxLine = `\nGesamtbetrag: ${invoice.totalAmount.toFixed(2)} €\n(Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.)`;
  } else {
    taxLine = `\nGesamtbetrag: ${invoice.totalAmount.toFixed(2)} €`;
  }

  const body = [
    `Sehr geehrte Damen und Herren,`,
    ``,
    `anbei erhalten Sie unsere Rechnung ${invoice.invoiceNumber}.`,
    ``,
    ...(invoice.dueDate
      ? [`Fälligkeitsdatum: ${new Date(invoice.dueDate).toLocaleDateString("de-DE")}`]
      : []),
    ``,
    `Positionen:`,
    itemLines,
    taxLine,
    ``,
    invoice.notes ? `Hinweise: ${invoice.notes}` : "",
    ``,
    `Mit freundlichen Grüßen`,
    senderName,
  ]
    .filter((l) => l !== "")
    .join("\n");

  const result = await sendEmail(
    {
      to: invoice.customerEmail,
      subject: `Rechnung ${invoice.invoiceNumber}`,
      text: body,
    },
    workspace
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "E-Mail konnte nicht gesendet werden." }, { status: 500 });
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      sentAt: new Date(),
      status: "SENT",
    },
  });

  await logActivity(
    workspaceId,
    "INVOICE_SENT",
    `Rechnung gesendet: ${invoice.invoiceNumber} an ${invoice.customerEmail}`,
    { entityId: invoice.id, entityType: "Invoice" }
  );

  return NextResponse.json({ ok: true, invoice: updated });
}
