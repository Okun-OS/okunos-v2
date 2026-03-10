import { prisma } from "./prisma";

export async function logActivity(
  workspaceId: string,
  type: string,
  message: string,
  opts?: { entityId?: string; entityType?: string }
) {
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        type,
        message,
        entityId: opts?.entityId,
        entityType: opts?.entityType,
      },
    });
  } catch {
    // never throw
  }
}
