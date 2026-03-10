import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const wsId = (session.user as any).workspaceId as string;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    repliedLeads,
    activeDeals,
    wonDeals,
    clients,
    emailsToday,
    emailsLast7,
  ] = await Promise.all([
    prisma.lead.count({ where: { workspaceId: wsId } }),
    prisma.lead.count({ where: { workspaceId: wsId, replied: true } }),
    prisma.deal.count({ where: { workspaceId: wsId, status: "ACTIVE" } }),
    prisma.deal.count({ where: { workspaceId: wsId, status: "WON" } }),
    prisma.client.count({ where: { workspaceId: wsId } }),
    prisma.outreachLog.count({
      where: { workspaceId: wsId, sentAt: { gte: todayStart } },
    }),
    prisma.outreachLog.count({
      where: {
        workspaceId: wsId,
        sentAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    }),
  ]);

  const replyRate =
    totalLeads > 0 ? ((repliedLeads / totalLeads) * 100).toFixed(1) : "0";

  // Last 7 days data for chart
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(Date.now() - i * 86400000);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const count = await prisma.outreachLog.count({
      where: { workspaceId: wsId, sentAt: { gte: start, lte: end } },
    });
    days.push({
      label: start.toLocaleDateString("de-DE", { weekday: "short" }),
      count,
    });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  // Lead stage breakdown
  const stages = await prisma.lead.groupBy({
    by: ["outStatus"],
    where: { workspaceId: wsId },
    _count: { id: true },
  });

  const stageMap: Record<string, number> = {};
  stages.forEach((s) => (stageMap[s.outStatus] = s._count.id));
  const stageOrder = ["NEW", "SENT1", "FU1_SENT", "FU2_SENT", "DONE"];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <KpiCard label="Mails heute" value={emailsToday} />
        <KpiCard label="Mails (7 Tage)" value={emailsLast7} />
        <KpiCard label="Reply Rate" value={`${replyRate}%`} />
        <KpiCard label="Aktive Deals" value={activeDeals} />
        <KpiCard label="Won Deals" value={wonDeals} />
        <KpiCard label="Kunden" value={clients} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-medium mb-6">Mails pro Tag (letzte 7 Tage)</h2>
          <div className="flex items-end gap-3 h-40">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-gray-400 text-xs">{d.count}</span>
                <div
                  className="w-full bg-blue-600 rounded-t"
                  style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-gray-500 text-xs">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-medium mb-6">Leads nach Outreach-Stage</h2>
          <div className="space-y-3">
            {stageOrder.map((stage) => {
              const count = stageMap[stage] || 0;
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{stage}</span>
                    <span className="text-gray-400">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
