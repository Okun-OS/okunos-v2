import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function statusBadge(type: string) {
  const map: Record<string, string> = {
    LEAD: "bg-blue-900 text-blue-300",
    DEAL: "bg-purple-900 text-purple-300",
    EMAIL: "bg-green-900 text-green-300",
    CLIENT: "bg-yellow-900 text-yellow-300",
    INVOICE: "bg-orange-900 text-orange-300",
    SYSTEM: "bg-gray-700 text-gray-300",
  };
  return map[type] ?? "bg-gray-700 text-gray-300";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) redirect("/login");

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [
    workspace,
    leadsCount,
    activeDealsCount,
    wonDealsCount,
    clientsCount,
    mailsSentToday,
    newLeadsToday,
    totalReplies,
    recentActivity,
  ] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.lead.count({ where: { workspaceId, status: { not: "ARCHIVED" } } }),
    prisma.deal.count({ where: { workspaceId, status: "ACTIVE" } }),
    prisma.deal.count({
      where: {
        workspaceId,
        status: "WON",
        closedAt: { gte: startOfMonth },
      },
    }),
    prisma.client.count({ where: { workspaceId } }),
    prisma.outreachLog.count({
      where: { workspaceId, sentAt: { gte: startOfToday } },
    }),
    prisma.lead.count({
      where: { workspaceId, status: "NEW", createdAt: { gte: startOfToday } },
    }),
    prisma.lead.count({
      where: { workspaceId, replied: true },
    }),
    prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const stats = [
    { label: "Leads", value: leadsCount, color: "text-blue-400" },
    { label: "Aktive Deals", value: activeDealsCount, color: "text-purple-400" },
    { label: "Deals gewonnen", value: wonDealsCount, color: "text-green-400" },
    { label: "Kunden", value: clientsCount, color: "text-yellow-400" },
    { label: "Mails gesendet heute", value: mailsSentToday, color: "text-orange-400" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Willkommen zurück,{" "}
          <span className="text-gray-200">{workspace?.name ?? "Workspace"}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-gray-800 border border-gray-700 rounded-xl p-5"
          >
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
              {s.label}
            </p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Letzte Aktivitäten</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">Kein Eintrag</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((log) => (
                <li key={log.id} className="flex items-start gap-3">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${statusBadge(log.type)}`}
                  >
                    {log.type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-gray-200 text-sm truncate">{log.message}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(log.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Schnellzugriff</h2>
          <div className="space-y-3">
            <Link
              href="/leads/new"
              className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition"
            >
              + Neuer Lead
            </Link>
            <Link
              href="/outreach/sequences/new"
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition"
            >
              + Neue Sequenz
            </Link>
            <Link
              href="/leads"
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition"
            >
              Alle Leads
            </Link>
            <Link
              href="/pipeline"
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition"
            >
              Pipeline
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
