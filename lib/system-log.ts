import { prisma } from "./prisma";

async function log(
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  details?: string,
  workspaceId?: string
) {
  try {
    await prisma.systemLog.create({
      data: { level, message, details, workspaceId },
    });
  } catch {
    // never throw
  }
}

export const sysInfo = (msg: string, details?: string, wsId?: string) =>
  log("INFO", msg, details, wsId);
export const sysWarn = (msg: string, details?: string, wsId?: string) =>
  log("WARN", msg, details, wsId);
export const sysError = (msg: string, details?: string, wsId?: string) =>
  log("ERROR", msg, details, wsId);
