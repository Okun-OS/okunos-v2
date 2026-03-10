import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function JourneysPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const wsId = (session.user as any).workspaceId as string;

  const journeys = await prisma.customerJourney.findMany({
    where: { workspaceId: wsId },
    include: {
      steps: { select: { id: true } },
      enrollments: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Journeys</h1>
          <p className="text-gray-400 text-sm mt-1">{journeys.length} Journeys konfiguriert</p>
        </div>
        <div className="flex gap-3">
          <RunnerButton wsId={wsId} />
          <Link
            href="/journeys/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Neue Journey
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {journeys.map((j) => {
          const active = j.enrollments.filter((e) => e.status === "ACTIVE").length;
          const done = j.enrollments.filter((e) => e.status === "DONE").length;
          return (
            <div
              key={j.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between"
            >
              <div>
                <h3 className="text-white font-medium">{j.name}</h3>
                {j.description && (
                  <p className="text-gray-400 text-sm mt-1">{j.description}</p>
                )}
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>{j.steps.length} Steps</span>
                  <span className="text-blue-400">{active} aktiv</span>
                  <span className="text-gray-500">{done} abgeschlossen</span>
                </div>
              </div>
              <Link
                href={`/journeys/${j.id}`}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Details →
              </Link>
            </div>
          );
        })}
        {journeys.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">Noch keine Journeys</p>
            <p className="text-sm">Erstelle deine erste Customer Journey</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RunnerButton({ wsId }: { wsId: string }) {
  return (
    <form
      action="/api/journeys/run"
      method="POST"
    >
      <button
        type="submit"
        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        ▶ Runner ausführen
      </button>
    </form>
  );
}
