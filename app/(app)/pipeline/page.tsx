import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import StageActions from "./StageActions";

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) redirect("/login");

  const deals = await prisma.deal.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  const callDeals = deals.filter((d) => d.status === "ACTIVE" && d.stage === "CALL");
  const offerSentDeals = deals.filter((d) => d.status === "ACTIVE" && d.stage === "OFFER_SENT");
  const wonDeals = deals.filter((d) => d.status === "WON");
  const lostDeals = deals.filter((d) => d.status === "LOST");
  const activeDeals = deals.filter((d) => d.status === "ACTIVE");

  const columns = [
    {
      label: "Gespräch / Ersttermin",
      color: "text-blue-400",
      bgAccent: "bg-blue-900/20 border-blue-800/40",
      deals: callDeals,
      stage: "CALL",
    },
    {
      label: "Angebot gesendet",
      color: "text-yellow-400",
      bgAccent: "bg-yellow-900/20 border-yellow-800/40",
      deals: offerSentDeals,
      stage: "OFFER_SENT",
    },
    {
      label: "Gewonnen",
      color: "text-green-400",
      bgAccent: "bg-green-900/20 border-green-800/40",
      deals: wonDeals,
      stage: null,
    },
    {
      label: "Verloren",
      color: "text-red-400",
      bgAccent: "bg-red-900/20 border-red-800/40",
      deals: lostDeals,
      stage: null,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-gray-400 text-sm mt-1">
            {deals.length} Deals gesamt · {activeDeals.length} aktiv ·{" "}
            <span className="text-yellow-400 font-medium">Closing-Stage</span>
          </p>
        </div>
        <Link
          href="/pipeline/new"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Neuer Deal
        </Link>
      </div>

      {/* Closing section label */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-700" />
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 px-2">
          Closing-Phasen
        </span>
        <div className="h-px flex-1 bg-gray-700" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.label}>
            <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg border ${col.bgAccent}`}>
              <h2 className={`font-semibold text-sm ${col.color}`}>{col.label}</h2>
              <span className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full ml-auto">
                {col.deals.length}
              </span>
            </div>

            <div className="space-y-3">
              {col.deals.length === 0 ? (
                <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-6 text-center">
                  <p className="text-gray-600 text-sm">Keine Deals</p>
                </div>
              ) : (
                col.deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition"
                  >
                    <div className="mb-2">
                      <p className="text-white font-medium text-sm">{deal.firma}</p>
                      {deal.nachname && (
                        <p className="text-gray-300 text-xs mt-0.5">{deal.nachname}</p>
                      )}
                      {deal.email && (
                        <p className="text-gray-400 text-xs mt-0.5">{deal.email}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-400 font-semibold text-sm">
                        {formatCurrency(deal.value)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(deal.createdAt).toLocaleDateString("de-DE")}
                      </span>
                    </div>

                    {deal.notes && (
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{deal.notes}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {deal.status === "ACTIVE" && (
                        <>
                          <Link
                            href={`/quotes/new?dealId=${deal.id}`}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition"
                          >
                            Angebot
                          </Link>
                          <StageActions
                            dealId={deal.id}
                            currentStage={deal.stage}
                            currentStatus="ACTIVE"
                          />
                        </>
                      )}
                      {deal.status === "WON" && (
                        <>
                          {!deal.invoiceCreated && (
                            <Link
                              href={`/invoices/new?dealId=${deal.id}`}
                              className="bg-green-900/40 hover:bg-green-900 text-green-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition"
                            >
                              Rechnung
                            </Link>
                          )}
                          {deal.invoiceCreated && (
                            <span className="text-green-400 text-xs font-medium px-2.5 py-1.5 bg-green-900/20 rounded-lg">
                              Rechnung erstellt
                            </span>
                          )}
                          <StageActions
                            dealId={deal.id}
                            currentStage={deal.stage}
                            currentStatus="WON"
                          />
                        </>
                      )}
                      {deal.status === "LOST" && (
                        <StageActions
                          dealId={deal.id}
                          currentStage={deal.stage}
                          currentStatus="LOST"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
