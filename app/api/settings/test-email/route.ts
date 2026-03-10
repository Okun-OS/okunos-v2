import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wsId = (session.user as any).workspaceId as string;
  const userEmail = (session.user as any).email as string;

  const ws = await prisma.workspace.findUnique({ where: { id: wsId } });
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await sendEmail(
    {
      to: userEmail,
      subject: "OkunOS Test-Mail",
      text: "Das ist eine Test-Mail von OkunOS. Die E-Mail-Konfiguration funktioniert.",
    },
    ws
  );

  return NextResponse.json(result);
}
