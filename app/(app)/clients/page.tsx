import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const statusColors: Record<string, string> = {
  Aktiv: "bg-green-900 text-green-300",
  Inaktiv: "bg-gray-700 text-gray-400",
  Pausiert: "bg-yellow-900 text-yellow-300",
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Kunden</h1>
          <span className="bg-gray-700 text-gray-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {clients.length}
          </span>
        </div>
        <Link
          href="/clients/new"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
        >
          + Neuer Kunde
        </Link>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Keine Kunden gefunden.</p>
            <Link
              href="/clients/new"
              className="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm transition"
            >
              Ersten Kunden anlegen →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium px-4 py-3">Firmenname</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Ansprechpartner</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">E-Mail</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Status</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 hidden md:table-cell">
                  Startdatum
                </th>
                <th className="text-left text-gray-400 font-medium px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr
                  key={client.id}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition ${
                    i === clients.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-white font-medium hover:text-blue-400 transition"
                    >
                      {client.firmenname}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {client.ansprechpartner ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {client.email ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        statusColors[client.status] ?? "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {client.startdatum
                      ? new Date(client.startdatum).toLocaleDateString("de-DE")
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs transition"
                    >
                      Details
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
