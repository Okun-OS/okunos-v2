import { prisma } from "./prisma";

export async function seedWorkspaceDefaults(workspaceId: string) {
  try {
    // Default Outreach Sequence
    const existing = await prisma.emailSequence.findFirst({
      where: { workspaceId },
    });
    if (!existing) {
      await prisma.emailSequence.create({
        data: {
          workspaceId,
          name: "Standard Outreach",
          isDefault: true,
          stages: {
            create: [
              {
                stepNumber: 1,
                delayDays: 0,
                subject: "Kurze Frage zu Ihrer Website",
                body: `Hallo,

ich habe mir Ihre Website kurz angesehen und wollte eine kurze Frage stellen.

Viele Betriebe haben zwar eine Website, erhalten darüber aber kaum neue Kundenanfragen.

Wir helfen dabei, das zu ändern. Ist das für Sie aktuell ein Thema?

Viele Grüße
{{senderName}}`,
              },
              {
                stepNumber: 2,
                delayDays: 3,
                subject: "Kurze Nachfrage",
                body: `Hallo,

ich wollte kurz nachfragen, ob meine letzte Nachricht angekommen ist.

Falls Sie Interesse haben, zeige ich Ihnen gerne wie andere Betriebe ihre Website als Anfrage-Kanal nutzen.

Viele Grüße
{{senderName}}`,
              },
              {
                stepNumber: 3,
                delayDays: 3,
                subject: "Letzte kurze Nachfrage",
                body: `Hallo,

ich melde mich ein letztes Mal. Falls das Thema aktuell nicht relevant ist, ist das völlig in Ordnung.

Melden Sie sich gerne wenn Sie irgendwann Ihre Website optimieren möchten.

Viele Grüße
{{senderName}}`,
              },
            ],
          },
        },
      });
    }

    // Default Customer Journey
    const existingJourney = await prisma.customerJourney.findFirst({
      where: { workspaceId },
    });
    if (!existingJourney) {
      await prisma.customerJourney.create({
        data: {
          workspaceId,
          name: "Standard Onboarding",
          description: "Automatische Onboarding-Sequenz für neue Kunden",
          steps: {
            create: [
              {
                stepNumber: 1,
                delayDays: 0,
                subject: "Willkommen – nächste Schritte",
                body: `Hallo,

herzlich willkommen! Wir freuen uns, mit Ihnen zusammenzuarbeiten.

In den nächsten Tagen werden wir uns bei Ihnen melden, um die nächsten Schritte zu besprechen.

Viele Grüße
{{senderName}}`,
                type: "EMAIL",
              },
              {
                stepNumber: 2,
                delayDays: 3,
                subject: "Kurzes Update",
                body: `Hallo,

wir sind in vollem Gange mit Ihrem Projekt. Falls Sie Fragen haben, melden Sie sich gerne.

Viele Grüße
{{senderName}}`,
                type: "EMAIL",
              },
              {
                stepNumber: 3,
                delayDays: 7,
                subject: "Feedback gewünscht",
                body: `Hallo,

wir würden uns freuen, Ihr Feedback zu hören. Wie zufrieden sind Sie bisher?

Viele Grüße
{{senderName}}`,
                type: "EMAIL",
              },
            ],
          },
        },
      });
    }
  } catch {
    // never throw
  }
}
