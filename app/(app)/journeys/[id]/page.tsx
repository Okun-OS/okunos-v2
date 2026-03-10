import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import JourneyEnrollForm from "./EnrollForm";

export default async function JourneyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) redirect("/login");

  const { id } = await params;

  const journey = await prisma.customerJourney.findFirst({
    where: { id, workspaceId },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { client: { select: { id: true, firmenname: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!journey) redirect("/journeys");

  const clients = await prisma.client.findMany({
    where: { workspaceId },
    select: { id: true, firmenname: true },
    orderBy: { firmenname: "asc" },
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-900 text-blue-300",
    DONE: "bg-gray-700 text-gray-400",
    PAUSED: "bg-yellow-900 text-yellow-300",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/journeys" className="text-gray-400 hover:text-white text-sm transition">
          ← Journeys
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{journey.name}</h1>
          {journey.description && (
            <p className="text-gray-400 text-sm mt-1">{journey.description}</p>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">
          Steps ({journey.steps.length})
        </h2>
        {journey.steps.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Steps konfiguriert.</p>
        ) : (
          <div className="space-y-3">
            {journey.steps.map((step) => (
              <div
                key={step.id}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-900 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
                      Step {step.stepNumber}
                    </span>
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                      {step.type}
                    </span>
                    <span className="text-gray-500 text-xs">
                      +{step.delayDays} Tag{step.delayDays !== 1 ? "e" : ""}
                    </span>
                  </div>
                </div>
                <p className="text-white text-sm font-medium">{step.subject}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{step.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Enrollments */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">
          Aktive Einschreibungen ({journey.enrollments.length})
        </h2>
        {journey.enrollments.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine aktiven Einschreibungen.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium pb-2">Kunde</th>
                <th className="text-left text-gray-400 font-medium pb-2">Aktueller Step</th>
                <th className="text-left text-gray-400 font-medium pb-2">Status</th>
                <th className="text-left text-gray-400 font-medium pb-2">Nächstes Senden</th>
              </tr>
            </thead>
            <tbody>
              {journey.enrollments.map((enr) => (
                <tr key={enr.id} className="border-b border-gray-700/50 last:border-b-0">
                  <td className="py-2">
                    <Link
                      href={`/clients/${enr.client.id}`}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      {enr.client.firmenname}
                    </Link>
                  </td>
                  <td className="py-2 text-gray-300 text-xs">
                    {enr.currentStep + 1} / {journey.steps.length}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        statusColors[enr.status] ?? "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {enr.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs">
                    {enr.nextSendAt
                      ? new Date(enr.nextSendAt).toLocaleString("de-DE")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enroll Client */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Kunden einschreiben</h2>
        <JourneyEnrollForm journeyId={id} clients={clients} />
      </div>
    </div>
  );
}
