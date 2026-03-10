import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-900 text-green-300",
    DONE: "bg-gray-700 text-gray-400",
    PAUSED: "bg-yellow-900 text-yellow-300",
    UNSUBSCRIBED: "bg-red-900 text-red-300",
  };
  return map[status] ?? "bg-gray-700 text-gray-400";
}

export default async function OutreachPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) redirect("/login");

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [sequences, enrollments, sentToday, totalActive, workspace] =
    await Promise.all([
      prisma.emailSequence.findMany({
        where: { workspaceId },
        include: {
          _count: { select: { stages: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.outreachEnrollment.findMany({
        where: {
          lead: { workspaceId },
          status: { in: ["ACTIVE", "DONE"] },
        },
        include: {
          lead: { select: { firma: true } },
          sequence: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.outreachLog.count({
        where: { workspaceId, sentAt: { gte: startOfToday } },
      }),
      prisma.outreachEnrollment.count({
        where: { lead: { workspaceId }, status: "ACTIVE" },
      }),
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
    ]);

  const totalLogs = await prisma.outreachLog.count({ where: { workspaceId } });
  const repliedLeads = await prisma.lead.count({
    where: { workspaceId, replied: true },
  });
  const replyRate =
    totalLogs > 0 ? ((repliedLeads / totalLogs) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Outreach</h1>
          {workspace?.lastOutreachRunAt && (
            <p className="text-gray-400 text-sm mt-1">
              Zuletzt ausgeführt:{" "}
              {new Date(workspace.lastOutreachRunAt).toLocaleString("de-DE")}
            </p>
          )}
        </div>
        <form
          action="/api/outreach/run"
          method="POST"
          onSubmit={(e) => {
            e.preventDefault();
            fetch("/api/outreach/run", { method: "POST" })
              .then((r) => r.json())
              .then((d) => alert(`Gesendet: ${d.sent}, Fehler: ${d.errors}`))
              .catch(() => alert("Fehler beim Ausführen"));
          }}
        >
          <RunButton />
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Aktive Enrollments
          </p>
          <p className="text-3xl font-bold text-green-400">{totalActive}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Gesendet heute
          </p>
          <p className="text-3xl font-bold text-blue-400">{sentToday}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Reply Rate
          </p>
          <p className="text-3xl font-bold text-purple-400">{replyRate}%</p>
        </div>
      </div>

      {/* Sequences */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl mb-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-white font-semibold">E-Mail Sequenzen</h2>
          <Link
            href="/outreach/sequences/new"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Neue Sequenz
          </Link>
        </div>
        {sequences.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">Keine Sequenzen vorhanden.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Name
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Schritte
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Enrollments
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Standard
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {sequences.map((seq) => (
                <tr
                  key={seq.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                >
                  <td className="px-6 py-4 text-white font-medium">{seq.name}</td>
                  <td className="px-6 py-4 text-gray-300">{seq._count.stages}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {seq._count.enrollments}
                  </td>
                  <td className="px-6 py-4">
                    {seq.isDefault && (
                      <span className="bg-blue-900 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/outreach/sequences/${seq.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm transition"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enrollments */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-white font-semibold">Enrollments</h2>
        </div>
        {enrollments.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">Keine Enrollments vorhanden.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Firma
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Sequenz
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Schritt
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Status
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Nächster Versand
                </th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                >
                  <td className="px-6 py-4 text-white">{e.lead.firma}</td>
                  <td className="px-6 py-4 text-gray-300">{e.sequence.name}</td>
                  <td className="px-6 py-4 text-gray-300">{e.currentStep + 1}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(
                        e.status
                      )}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {e.nextSendAt
                      ? new Date(e.nextSendAt).toLocaleString("de-DE")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Inline client component for the run button
function RunButton() {
  return (
    <button
      type="submit"
      className="bg-green-600 hover:bg-green-500 text-white font-medium px-5 py-2 rounded-lg transition"
      onClick={async (e) => {
        e.preventDefault();
        try {
          const res = await fetch("/api/outreach/run", { method: "POST" });
          const data = await res.json();
          alert(`Runner abgeschlossen. Gesendet: ${data.sent}, Fehler: ${data.errors}`);
        } catch {
          alert("Fehler beim Ausführen des Runners.");
        }
      }}
    >
      Runner jetzt ausführen
    </button>
  );
}
