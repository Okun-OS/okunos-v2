import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

interface ImportRow {
  firma?: string;
  email?: string;
  telefon?: string;
  website?: string;
  quelle?: string;
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

  let body: { rows: ImportRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rows } = body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Keine Daten übergeben." }, { status: 400 });
  }

  // Load existing leads for deduplication
  const existingLeads = await prisma.lead.findMany({
    where: { workspaceId },
    select: { email: true, website: true, telefon: true, firma: true },
  });

  const existingEmails = new Set(
    existingLeads.map((l) => l.email?.toLowerCase()).filter(Boolean)
  );
  const existingWebsites = new Set(
    existingLeads.map((l) => l.website?.toLowerCase()).filter(Boolean)
  );
  const existingTelefon = new Set(
    existingLeads.map((l) => l.telefon?.toLowerCase()).filter(Boolean)
  );
  const existingFirmen = new Set(
    existingLeads.map((l) => l.firma?.toLowerCase()).filter(Boolean)
  );

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because row 1 is headers

    const firma = row.firma?.trim();
    if (!firma) {
      errors.push(`Zeile ${rowNum}: Firma fehlt.`);
      skipped++;
      continue;
    }

    const email = row.email?.trim().toLowerCase() || null;
    const website = row.website?.trim().toLowerCase() || null;
    const telefon = row.telefon?.trim().toLowerCase() || null;

    // Deduplication checks
    const isDuplicate =
      (email && existingEmails.has(email)) ||
      (website && existingWebsites.has(website)) ||
      (telefon && existingTelefon.has(telefon)) ||
      existingFirmen.has(firma.toLowerCase());

    if (isDuplicate) {
      skipped++;
      continue;
    }

    try {
      await prisma.lead.create({
        data: {
          workspaceId,
          firma,
          email: email || null,
          telefon: row.telefon?.trim() || null,
          website: row.website?.trim() || null,
          quelle: row.quelle?.trim() || null,
        },
      });

      // Track for in-batch deduplication
      if (email) existingEmails.add(email);
      if (website) existingWebsites.add(website);
      if (telefon) existingTelefon.add(telefon);
      existingFirmen.add(firma.toLowerCase());

      imported++;
    } catch (err: any) {
      errors.push(`Zeile ${rowNum}: ${err.message ?? "Datenbankfehler"}`);
      skipped++;
    }
  }

  if (imported > 0) {
    await logActivity(
      workspaceId,
      "LEAD",
      `CSV Import: ${imported} Leads importiert, ${skipped} übersprungen`
    );
  }

  return NextResponse.json({ imported, skipped, errors });
}
