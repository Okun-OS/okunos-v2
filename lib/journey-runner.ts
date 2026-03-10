import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { sysError } from "./system-log";

export async function runJourneysForWorkspace(
  workspaceId: string
): Promise<{ sent: number; errors: number }> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace || !workspace.isActive) return { sent: 0, errors: 0 };

  const now = new Date();
  let sent = 0;
  let errors = 0;

  const enrollments = await prisma.journeyEnrollment.findMany({
    where: {
      status: "ACTIVE",
      nextSendAt: { lte: now },
      client: { workspaceId },
    },
    include: {
      client: true,
      journey: {
        include: { steps: { orderBy: { stepNumber: "asc" } } },
      },
    },
  });

  for (const enrollment of enrollments) {
    const steps = enrollment.journey.steps;
    const step = steps[enrollment.currentStep];

    if (!step) {
      await prisma.journeyEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "DONE" },
      });
      continue;
    }

    const email = enrollment.client.email;
    if (!email) continue;

    const senderName = workspace.fromName || "OkunOS";
    const body = step.body.replace(/{{senderName}}/g, senderName);

    try {
      const result = await sendEmail(
        { to: email, subject: step.subject, text: body },
        workspace
      );

      if (result.ok) {
        sent++;

        await prisma.journeyLog.create({
          data: {
            stepId: step.id,
            clientId: enrollment.client.id,
            toEmail: email,
          },
        });

        const nextStep = enrollment.currentStep + 1;
        const nextStepData = steps[nextStep];
        const isDone = !nextStepData;
        const nextSendAt = nextStepData
          ? new Date(Date.now() + nextStepData.delayDays * 86400000)
          : null;

        await prisma.journeyEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStep,
            lastSentAt: now,
            nextSendAt,
            status: isDone ? "DONE" : "ACTIVE",
          },
        });
      } else {
        errors++;
      }
    } catch (e: any) {
      errors++;
      await sysError(
        "Journey send error: " + e.message,
        undefined,
        workspaceId
      );
    }
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { lastJourneyRunAt: now },
  });

  await prisma.runnerLog.create({
    data: {
      workspaceId,
      type: "JOURNEY",
      emailsSent: sent,
      errors,
    },
  });

  return { sent, errors };
}
