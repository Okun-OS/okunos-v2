import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const typeColor: Record<string, string> = {
  LEAD_CREATED: "bg-blue-900 text-blue-300",
  DEAL_WON: "bg-green-900 text-green-300",
  DEAL_LOST: "bg-red-900 text-red-300",
  QUOTE_SENT: "bg-purple-900 text-purple-300",
  INVOICE_SENT: "bg-yellow-900 text-yellow-300",
  JOURNEY_STARTED: "bg-teal-900 text-teal-300",
};

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const wsId = (session.user as any).workspaceId as string;

  const logs = await prisma.activityLog.findMany({
    where: { workspaceId: wsId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Aktivitätsprotokoll</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {logs.map((log) => (
          <div key={log.id} className="px-6 py-4 flex items-start gap-4">
            <span
              className={`text-xs px-2 py-1 rounded whitespace-nowrap mt-0.5 ${
                typeColor[log.type] || "bg-gray-700 text-gray-300"
              }`}
            >
              {log.type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm">{log.message}</p>
            </div>
            <span className="text-gray-500 text-xs whitespace-nowrap">
              {new Date(log.createdAt).toLocaleString("de-DE")}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            Noch keine Aktivitäten
          </div>
        )}
      </div>
    </div>
  );
}
