import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  isSystemAdmin: boolean;
  workspaceId: string | null;
  workspaceSlug: string | null;
  role: string | null;
}

export async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireSession() {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireWorkspace() {
  const user = await requireSession();
  if (!user.workspaceId) throw new Error("No workspace");
  return user;
}
