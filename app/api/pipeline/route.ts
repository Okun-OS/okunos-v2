import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");

  const deals = await prisma.deal.findMany({
    where: {
      workspaceId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deals);
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

  const { firma, email, anrede, nachname, telefon, website, value, notes } = body;
  if (!firma?.trim()) {
    return NextResponse.json({ error: "Firma ist Pflichtfeld." }, { status: 400 });
  }

  const deal = await prisma.deal.create({
    data: {
      workspaceId,
      firma: firma.trim(),
      email: email?.trim() || null,
      anrede: anrede?.trim() || null,
      nachname: nachname?.trim() || null,
      telefon: telefon?.trim() || null,
      website: website?.trim() || null,
      value: value ? parseFloat(value) : null,
      notes: notes?.trim() || null,
    },
  });

  await logActivity(workspaceId, "DEAL", `Neuer Deal erstellt: ${deal.firma}`, {
    entityId: deal.id,
    entityType: "Deal",
  });

  return NextResponse.json(deal, { status: 201 });
}
