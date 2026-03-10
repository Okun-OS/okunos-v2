import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface Params {
  params: Promise<{ id: string }>;
}

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

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.deal.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      status: "WON",
      closedAt: now,
    },
  });

  // Create Client if email doesn't already exist in workspace
  let client = null;
  if (deal.email) {
    client = await prisma.client.findFirst({
      where: { workspaceId, email: deal.email },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          workspaceId,
          firmenname: deal.firma,
          ansprechpartner: deal.nachname
            ? `${deal.anrede ?? ""} ${deal.nachname}`.trim()
            : null,
          email: deal.email,
          telefon: deal.telefon ?? null,
          website: deal.website ?? null,
          startdatum: now,
          status: "Aktiv",
        },
      });
    }
  } else {
    // Create client without email
    client = await prisma.client.create({
      data: {
        workspaceId,
        firmenname: deal.firma,
        ansprechpartner: deal.nachname
          ? `${deal.anrede ?? ""} ${deal.nachname}`.trim()
          : null,
        telefon: deal.telefon ?? null,
        website: deal.website ?? null,
        startdatum: now,
        status: "Aktiv",
      },
    });
  }

  await logActivity(workspaceId, "DEAL_WON", `Deal gewonnen: ${deal.firma}`, {
    entityId: deal.id,
    entityType: "Deal",
  });

  // ─── Auto-create Invoice ───────────────────────────────────────────────────
  let invoice = null;
  if (!deal.invoiceCreated) {
    // Check if deal has any quotes
    const quotes = await prisma.quote.findMany({
      where: { dealId: deal.id },
      orderBy: { createdAt: "desc" },
    });

    const quote = quotes.length > 0 ? quotes[0] : null;
    const invoiceNumber = await nextInvoiceNumber(workspaceId);

    invoice = await prisma.invoice.create({
      data: {
        workspaceId,
        dealId: deal.id,
        clientId: client.id,
        invoiceNumber,
        customerName: deal.firma,
        customerEmail: deal.email ?? null,
        items: quote ? (quote.items as any) : [],
        totalAmount: quote ? quote.totalAmount : 0,
        status: "DRAFT",
      },
    });

    // Mark deal as invoiceCreated
    await prisma.deal.update({
      where: { id: deal.id },
      data: { invoiceCreated: true },
    });

    await logActivity(
      workspaceId,
      "INVOICE_CREATED",
      `Rechnung ${invoiceNumber} automatisch erstellt`,
      { entityId: invoice.id, entityType: "Invoice" }
    );
  }

  // ─── Auto-start Customer Journey ──────────────────────────────────────────
  let enrollment = null;
  const journey = await prisma.customerJourney.findFirst({
    where: { workspaceId },
    include: {
      steps: {
        orderBy: { stepNumber: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (journey && journey.steps.length > 0) {
    const firstStep = journey.steps[0];
    const delayMs = (firstStep.delayDays ?? 0) * 24 * 60 * 60 * 1000;
    const nextSendAt = new Date(now.getTime() + delayMs);

    enrollment = await prisma.journeyEnrollment.create({
      data: {
        clientId: client.id,
        journeyId: journey.id,
        currentStep: 1,
        status: "ACTIVE",
        nextSendAt,
      },
    });

    await logActivity(
      workspaceId,
      "JOURNEY_STARTED",
      `Customer Journey gestartet für ${client.firmenname}`,
      { entityId: client.id, entityType: "Client" }
    );
  }

  return NextResponse.json({ deal, client, invoice, enrollment });
}
