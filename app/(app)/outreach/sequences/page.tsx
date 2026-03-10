import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SequencesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) redirect("/login");

  const sequences = await prisma.emailSequence.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { stages: true, enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/outreach" className="text-gray-400 hover:text-white text-sm transition">
            ← Outreach
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-2xl font-bold text-white">Sequenzen</h1>
          <span className="bg-gray-700 text-gray-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {sequences.length}
          </span>
        </div>
        <Link
          href="/outreach/sequences/new"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Neue Sequenz
        </Link>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {sequences.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Keine Sequenzen vorhanden.</p>
            <Link
              href="/outreach/sequences/new"
              className="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm transition"
            >
              Erste Sequenz erstellen →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium px-6 py-3">Name</th>
                <th className="text-left text-gray-400 font-medium px-6 py-3">Schritte</th>
                <th className="text-left text-gray-400 font-medium px-6 py-3">Enrollments</th>
                <th className="text-left text-gray-400 font-medium px-6 py-3">Standard</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {sequences.map((seq, i) => (
                <tr
                  key={seq.id}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition ${
                    i === sequences.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-6 py-4 text-white font-medium">{seq.name}</td>
                  <td className="px-6 py-4 text-gray-300">{seq._count.stages}</td>
                  <td className="px-6 py-4 text-gray-300">{seq._count.enrollments}</td>
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
                      Bearbeiten →
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
