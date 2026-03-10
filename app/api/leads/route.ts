import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const leads = await prisma.lead.findMany({
    where: {
      workspaceId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { firma: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { firma, email, telefon, website, quelle, anrede, nachname } = body;

  if (!firma?.trim()) {
    return NextResponse.json(
      { error: "Firma ist ein Pflichtfeld." },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      workspaceId,
      firma: firma.trim(),
      email: email?.trim() || null,
      telefon: telefon?.trim() || null,
      website: website?.trim() || null,
      quelle: quelle?.trim() || null,
      anrede: anrede?.trim() || null,
      nachname: nachname?.trim() || null,
    },
  });

  await logActivity(workspaceId, "LEAD", `Neuer Lead erstellt: ${lead.firma}`, {
    entityId: lead.id,
    entityType: "Lead",
  });

  return NextResponse.json(lead, { status: 201 });
}
