import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            memberships: { include: { workspace: true }, take: 1 },
          },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        const membership = user.memberships[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isSystemAdmin: user.isSystemAdmin,
          workspaceId: membership?.workspaceId ?? null,
          workspaceSlug: membership?.workspace?.slug ?? null,
          role: membership?.role ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isSystemAdmin = (user as any).isSystemAdmin;
        token.workspaceId = (user as any).workspaceId;
        token.workspaceSlug = (user as any).workspaceSlug;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isSystemAdmin = token.isSystemAdmin;
        (session.user as any).workspaceId = token.workspaceId;
        (session.user as any).workspaceSlug = token.workspaceSlug;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};
