import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { sysError } from "./system-log";

export async function runOutreachForWorkspace(
  workspaceId: string
): Promise<{ sent: number; errors: number }> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace || !workspace.isActive) return { sent: 0, errors: 0 };

  const now = new Date();
  let sent = 0;
  let errors = 0;

  // Get active enrollments that are due
  const enrollments = await prisma.outreachEnrollment.findMany({
    where: {
      status: "ACTIVE",
      nextSendAt: { lte: now },
      lead: { workspaceId, optout: false, replied: false },
    },
    include: {
      lead: true,
      sequence: { include: { stages: { orderBy: { stepNumber: "asc" } } } },
    },
    take: workspace.maxEmailsPerRun || 50,
  });

  for (const enrollment of enrollments) {
    const stages = enrollment.sequence.stages;
    const stage = stages[enrollment.currentStep];
    if (!stage) {
      await prisma.outreachEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "DONE" },
      });
      continue;
    }

    const email = enrollment.lead.email;
    if (!email) continue;

    // Replace placeholders
    const senderName = workspace.fromName || "OkunOS";

    // Build greeting based on lead.anrede
    let greeting: string;
    if (enrollment.lead.anrede === "Herr") {
      greeting = "Sehr geehrter Herr " + (enrollment.lead.nachname || "");
    } else if (enrollment.lead.anrede === "Frau") {
      greeting = "Sehr geehrte Frau " + (enrollment.lead.nachname || "");
    } else {
      greeting = "Guten Tag";
    }

    const body = stage.body
      .replace(/{{senderName}}/g, senderName)
      .replace(/{{greeting}}/g, greeting);
    const subject = stage.subject
      .replace(/{{senderName}}/g, senderName)
      .replace(/{{greeting}}/g, greeting);

    try {
      const result = await sendEmail(
        { to: email, subject, text: body },
        workspace
      );

      if (result.ok) {
        sent++;

        // Log
        await prisma.outreachLog.create({
          data: {
            workspaceId,
            leadId: enrollment.lead.id,
            email,
            subject: subject,
            stage: `step-${enrollment.currentStep + 1}`,
          },
        });

        // Advance to next step
        const nextStep = enrollment.currentStep + 1;
        const nextStage = stages[nextStep];
        const isDone = !nextStage;

        const nextSendAt = nextStage
          ? new Date(Date.now() + nextStage.delayDays * 86400000)
          : null;

        await prisma.outreachEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStep,
            lastSentAt: now,
            nextSendAt,
            status: isDone ? "DONE" : "ACTIVE",
            currentStageId: nextStage?.id ?? null,
          },
        });
      } else {
        errors++;
      }
    } catch (e: any) {
      errors++;
      await sysError(
        "Outreach send error: " + e.message,
        undefined,
        workspaceId
      );
    }

    // Random delay
    if (workspace.randomDelayEnabled) {
      await new Promise((r) => setTimeout(r, 3000 + Math.random() * 12000));
    }
  }

  // Update lastOutreachRunAt
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { lastOutreachRunAt: now },
  });

  await prisma.runnerLog.create({
    data: {
      workspaceId,
      type: "OUTREACH",
      emailsSent: sent,
      errors,
    },
  });

  return { sent, errors };
}
