import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LeadActions from "./LeadActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export default async function LeadDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const workspaceId = (session.user as any).workspaceId as string;
  if (!workspaceId) redirect("/login");

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, workspaceId },
    include: {
      enrollments: {
        include: {
          sequence: { select: { name: true } },
          currentStage: { select: { subject: true, stepNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) notFound();

  const fields = [
    { label: "Firma", value: lead.firma },
    { label: "E-Mail", value: lead.email },
    { label: "Telefon", value: lead.telefon },
    { label: "Website", value: lead.website },
    { label: "Quelle", value: lead.quelle },
    { label: "Anrede", value: lead.anrede },
    { label: "Nachname", value: lead.nachname },
    { label: "Kommentar", value: lead.kommentar },
    { label: "Nächste Aktion", value: lead.nextAction },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/leads"
          className="text-gray-400 hover:text-white text-sm transition"
        >
          ← Leads
        </Link>
        <span className="text-gray-600">/</span>
        <h1 className="text-xl font-bold text-white truncate">{lead.firma}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status row */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Lead-Details</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    statusColors[lead.status] ?? "bg-gray-700 text-gray-300"
                  }`}
                >
                  {lead.status}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    outStatusColors[lead.outStatus] ??
                    "bg-gray-700 text-gray-300"
                  }`}
                >
                  {lead.outStatus}
                </span>
                {lead.optout && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-900 text-red-300">
                    Opt-out
                  </span>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {fields.map(
                ({ label, value }) =>
                  value && (
                    <div key={label}>
                      <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        {label}
                      </dt>
                      <dd className="text-gray-200 text-sm mt-0.5">
                        {label === "Website" ? (
                          <a
                            href={
                              value.startsWith("http")
                                ? value
                                : `https://${value}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition truncate block"
                          >
                            {value}
                          </a>
                        ) : label === "E-Mail" ? (
                          <a
                            href={`mailto:${value}`}
                            className="text-blue-400 hover:text-blue-300 transition"
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  )
              )}
            </dl>

            {lead.nextDate && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Nächstes Datum
                </dt>
                <dd className="text-gray-200 text-sm mt-0.5">
                  {new Date(lead.nextDate).toLocaleDateString("de-DE")}
                </dd>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-500">
              <span>
                Erstellt:{" "}
                {new Date(lead.createdAt).toLocaleString("de-DE")}
              </span>
              <span>·</span>
              <span>
                Aktualisiert:{" "}
                {new Date(lead.updatedAt).toLocaleString("de-DE")}
              </span>
            </div>
          </div>

          {/* Found emails */}
          {lead.foundEmails && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3">
                Gefundene E-Mail-Adressen
              </h2>
              <div className="flex flex-wrap gap-2">
                {lead.foundEmails.split(",").map((email) => (
                  <span
                    key={email.trim()}
                    className="bg-gray-700 text-gray-300 text-xs font-mono px-2.5 py-1 rounded"
                  >
                    {email.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Outreach enrollments */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">
              Outreach-Sequenzen
            </h2>
            {lead.enrollments.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Keine aktiven Sequenzen.
              </p>
            ) : (
              <ul className="space-y-3">
                {lead.enrollments.map((enrollment) => (
                  <li
                    key={enrollment.id}
                    className="bg-gray-900 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">
                        {enrollment.sequence.name}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          enrollment.status === "ACTIVE"
                            ? "bg-green-900 text-green-300"
                            : enrollment.status === "FINISHED"
                            ? "bg-gray-700 text-gray-400"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {enrollment.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                      <p>Schritt: {enrollment.currentStep}</p>
                      {enrollment.currentStage && (
                        <p>
                          Aktuell: {enrollment.currentStage.subject}
                        </p>
                      )}
                      {enrollment.nextSendAt && (
                        <p>
                          Nächster Versand:{" "}
                          {new Date(enrollment.nextSendAt).toLocaleString(
                            "de-DE"
                          )}
                        </p>
                      )}
                      {enrollment.lastSentAt && (
                        <p>
                          Zuletzt gesendet:{" "}
                          {new Date(enrollment.lastSentAt).toLocaleString(
                            "de-DE"
                          )}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          <LeadActions
            leadId={lead.id}
            firma={lead.firma}
            status={lead.status}
            website={lead.website ?? null}
            optout={lead.optout}
          />
        </div>
      </div>
    </div>
  );
}
