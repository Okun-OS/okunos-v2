import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { seedWorkspaceDefaults } from "@/lib/workspace-defaults";

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[äöüß]/g, (c) =>
        ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] || c)
      )
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, workspaceName } = await req.json();

    if (!email || !password || !workspaceName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    const slug = generateSlug(workspaceName);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hash,
        name,
        memberships: {
          create: {
            role: "OWNER",
            workspace: {
              create: {
                name: workspaceName,
                slug,
                plan: "FREE",
                subscription: {
                  create: {
                    status: "trial",
                    planId: "FREE",
                  },
                },
              },
            },
          },
        },
      },
      include: {
        memberships: { include: { workspace: true } },
      },
    });

    const workspaceId = user.memberships[0].workspaceId;
    await seedWorkspaceDefaults(workspaceId);

    return NextResponse.json({ ok: true, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
