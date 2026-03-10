import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, message } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name und E-Mail sind erforderlich." },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // - Store the demo request in a database
    // - Send a notification email to the team
    // - Add the contact to a CRM
    // For now, we just return success.
    console.log("Demo request received:", { name, email, company, message });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Demo request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
