import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-900 text-blue-300",
  ACTIVE: "bg-green-900 text-green-300",
  ARCHIVED: "bg-gray-700 text-gray-400",
};

const outStatusColors: Record<string, string> = {
  NEW: "bg-gray-700 text-gray-300",
  CONTACTED: "bg-yellow-900 text-yellow-300",
  REPLIED: "bg-green-900 text-green-300",
  OPTOUT: "bg-red-900 text-red-300",
  FINISHED: "bg-gray-700 text-gray-400",
};

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status;
  const searchFilter = params.search;

  const leads = await prisma.lead.findMany({
    where: {
      workspaceId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(searchFilter
        ? {
            OR: [
              { firma: { contains: searchFilter, mode: "insensitive" } },
              { email: { contains: searchFilter, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCount = leads.length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <span className="bg-gray-700 text-gray-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/leads/import"
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
          >
            CSV Import
          </Link>
          <Link
            href="/leads/new"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
          >
            + Neuer Lead
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex items-center gap-3 mb-6">
        <input
          type="text"
          name="search"
          defaultValue={searchFilter ?? ""}
          placeholder="Suche nach Firma oder E-Mail..."
          className="bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm rounded-lg px-3 py-2 w-72 focus:outline-none focus:border-blue-500"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">Alle Status</option>
          <option value="NEW">Neu</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="ARCHIVED">Archiviert</option>
        </select>
        <button
          type="submit"
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
        >
          Filtern
        </button>
        {(statusFilter || searchFilter) && (
          <Link
            href="/leads"
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Zurücksetzen
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Keine Leads gefunden.</p>
            <Link
              href="/leads/new"
              className="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm transition"
            >
              Ersten Lead erstellen →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium px-4 py-3">Firma</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">E-Mail</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Website</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 hidden lg:table-cell">Quelle</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Status</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Out-Status</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 hidden lg:table-cell">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition cursor-pointer ${
                    i === leads.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="block text-white font-medium hover:text-blue-400 transition">
                      {lead.firma}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="block text-gray-300 hover:text-white transition">
                      {lead.email ?? <span className="text-gray-600">—</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Link href={`/leads/${lead.id}`} className="block">
                      {lead.website ? (
                        <span className="text-gray-400 text-xs truncate max-w-xs block">
                          {lead.website}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Link href={`/leads/${lead.id}`} className="block text-gray-400">
                      {lead.quelle ?? <span className="text-gray-600">—</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="block">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          statusColors[lead.status] ?? "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Link href={`/leads/${lead.id}`} className="block">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          outStatusColors[lead.outStatus] ?? "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {lead.outStatus}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Link href={`/leads/${lead.id}`} className="block text-gray-500 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString("de-DE")}
                    </Link>
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
