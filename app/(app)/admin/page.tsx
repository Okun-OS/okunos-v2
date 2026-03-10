import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WorkspaceToggle from "./WorkspaceToggle";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e: string) => e.trim().toLowerCase());
  const isAdmin = user.isSystemAdmin || adminEmails.includes(user.email?.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-400">Zugriff verweigert</h1>
        <p className="text-gray-400 mt-2">Du hast keine Admin-Berechtigung.</p>
      </div>
    );
  }

  const [
    workspaceCount,
    userCount,
    leadCount,
    emailCount,
    dealCount,
    workspaces,
    users,
    sysLogs,
    runnerLogs,
    subscriptions,
  ] = await Promise.all([
    prisma.workspace.count(),
    prisma.user.count(),
    prisma.lead.count(),
    prisma.outreachLog.count(),
    prisma.deal.count(),
    prisma.workspace.findMany({
      include: {
        members: { include: { user: { select: { email: true } } } },
        _count: { select: { leads: true, deals: true, clients: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      include: { memberships: { include: { workspace: { select: { name: true } } }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.systemLog.findMany({
      where: { level: { in: ["ERROR", "WARN"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.runnerLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { workspace: { select: { name: true } } },
    }),
    prisma.workspaceSubscription.findMany({
      include: { workspace: { select: { name: true, plan: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
      <p className="text-gray-400 text-sm mb-8">Nur für Betreiber</p>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: "Workspaces", value: workspaceCount },
          { label: "Users", value: userCount },
          { label: "Leads", value: leadCount },
          { label: "Emails gesendet", value: emailCount },
          { label: "Deals", value: dealCount },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Workspaces */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-medium">Workspaces</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Name</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Slug</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Plan</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Owner</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Leads</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Status</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((ws) => {
              const owner = ws.members.find((m) => m.role === "OWNER");
              return (
                <tr key={ws.id} className="border-b border-gray-800">
                  <td className="px-6 py-3 text-white text-sm">{ws.name}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm font-mono">{ws.slug}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                      {ws.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{owner?.user?.email || "—"}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{ws._count.leads}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${ws.isActive ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                        {ws.isActive ? "Aktiv" : "Inaktiv"}
                      </span>
                      <WorkspaceToggle workspaceId={ws.id} isActive={ws.isActive} />
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {new Date(ws.createdAt).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-medium">Users</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">E-Mail</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Name</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Workspace</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Rolle</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Admin</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const membership = u.memberships[0];
              return (
                <tr key={u.id} className="border-b border-gray-800">
                  <td className="px-6 py-3 text-white text-sm">{u.email}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{u.name || "—"}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{membership?.workspace?.name || "—"}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{membership?.role || "—"}</td>
                  <td className="px-6 py-3">
                    {u.isSystemAdmin && (
                      <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* System Logs */}
      {sysLogs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-white font-medium">System Logs (Fehler & Warnungen)</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {sysLogs.map((l) => (
              <div key={l.id} className="px-6 py-3 flex items-start gap-4">
                <span className={`text-xs px-2 py-0.5 rounded mt-0.5 ${l.level === "ERROR" ? "bg-red-900 text-red-300" : "bg-yellow-900 text-yellow-300"}`}>
                  {l.level}
                </span>
                <p className="text-gray-300 text-sm flex-1">{l.message}</p>
                <span className="text-gray-500 text-xs">{new Date(l.createdAt).toLocaleString("de-DE")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runner Logs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-medium">Runner Logs</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Workspace</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Typ</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Gesendet</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Fehler</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Zeitpunkt</th>
            </tr>
          </thead>
          <tbody>
            {runnerLogs.map((l) => (
              <tr key={l.id} className="border-b border-gray-800">
                <td className="px-6 py-3 text-white text-sm">{l.workspace.name}</td>
                <td className="px-6 py-3 text-gray-400 text-sm">{l.type}</td>
                <td className="px-6 py-3 text-green-400 text-sm">{l.emailsSent}</td>
                <td className="px-6 py-3 text-red-400 text-sm">{l.errors}</td>
                <td className="px-6 py-3 text-gray-400 text-xs">{new Date(l.createdAt).toLocaleString("de-DE")}</td>
              </tr>
            ))}
            {runnerLogs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-500 text-sm">Keine Logs</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Billing / Subscriptions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-medium">Abonnements</h2>
        </div>
        {subscriptions.length === 0 ? (
          <p className="px-6 py-6 text-gray-500 text-sm">Keine Abonnements vorhanden.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Workspace</th>
                <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Plan</th>
                <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Status</th>
                <th className="text-left px-6 py-3 text-gray-400 text-xs uppercase">Läuft bis</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-b border-gray-800">
                  <td className="px-6 py-3 text-white text-sm">{s.workspace.name}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                      {s.workspace.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      s.status === "active"
                        ? "bg-green-900 text-green-300"
                        : s.status === "past_due"
                        ? "bg-red-900 text-red-300"
                        : s.status === "canceled"
                        ? "bg-gray-700 text-gray-400"
                        : "bg-yellow-900 text-yellow-300"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {s.currentPeriodEnd
                      ? new Date(s.currentPeriodEnd).toLocaleDateString("de-DE")
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
