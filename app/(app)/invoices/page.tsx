import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-700 text-gray-300",
  SENT: "bg-blue-900 text-blue-300",
  PAID: "bg-green-900 text-green-300",
  OVERDUE: "bg-red-900 text-red-300",
};

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const wsId = (session.user as any).workspaceId as string;

  const invoices = await prisma.invoice.findMany({
    where: { workspaceId: wsId },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { firmenname: true } } },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Rechnungen</h1>
          <p className="text-gray-400 text-sm mt-1">{invoices.length} Rechnungen gesamt</p>
        </div>
        <Link
          href="/invoices/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Neue Rechnung
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-3 text-gray-400 text-xs font-medium uppercase">Nr.</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs font-medium uppercase">Kunde</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs font-medium uppercase">Betrag</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs font-medium uppercase">Fälligkeit</th>
              <th className="text-left px-6 py-3 text-gray-400 text-xs font-medium uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-6 py-4 text-sm font-mono text-gray-300">{inv.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm text-white">
                  {inv.customerName || inv.client?.firmenname || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-green-400">
                  {inv.totalAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[inv.status] || statusColor.DRAFT}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("de-DE") : "—"}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Ansehen
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Noch keine Rechnungen
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
