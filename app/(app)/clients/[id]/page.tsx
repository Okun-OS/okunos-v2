"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string;
  firmenname: string;
  ansprechpartner: string | null;
  email: string | null;
  telefon: string | null;
  website: string | null;
  startdatum: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  invoices: Invoice[];
  journeyEnrollments: JourneyEnrollment[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface JourneyEnrollment {
  id: string;
  currentStep: number;
  status: string;
  nextSendAt: string | null;
  journey: { id: string; name: string; steps: { id: string }[] };
}

interface Journey {
  id: string;
  name: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setClient(d);
        setLoading(false);
      });
  }, [id]);

  const openEnrollModal = async () => {
    const res = await fetch("/api/journeys");
    const data = await res.json();
    setJourneys(data);
    setShowEnrollModal(true);
  };

  const handleEnroll = async () => {
    if (!selectedJourneyId) return;
    setEnrolling(true);
    setEnrollError("");
    const res = await fetch(`/api/clients/${id}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journeyId: selectedJourneyId }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowEnrollModal(false);
      // Refresh
      const refreshed = await fetch(`/api/clients/${id}`).then((r) => r.json());
      setClient(refreshed);
    } else {
      setEnrollError(data.error || "Fehler beim Einschreiben");
    }
    setEnrolling(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-gray-400">Lade Kundendaten...</div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-red-400">Kunde nicht gefunden.</p>
        <Link href="/clients" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
          ← Zurück
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Aktiv: "bg-green-900 text-green-300",
    Inaktiv: "bg-gray-700 text-gray-400",
    Pausiert: "bg-yellow-900 text-yellow-300",
  };

  const enrollmentStatusColors: Record<string, string> = {
    ACTIVE: "bg-blue-900 text-blue-300",
    DONE: "bg-gray-700 text-gray-400",
    PAUSED: "bg-yellow-900 text-yellow-300",
  };

  const invoiceStatusColors: Record<string, string> = {
    DRAFT: "bg-gray-700 text-gray-400",
    SENT: "bg-blue-900 text-blue-300",
    PAID: "bg-green-900 text-green-300",
    OVERDUE: "bg-red-900 text-red-300",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/clients" className="text-gray-400 hover:text-white text-sm transition">
          ← Kunden
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{client.firmenname}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Erstellt: {new Date(client.createdAt).toLocaleDateString("de-DE")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
          >
            Bearbeiten
          </Link>
          <button
            onClick={openEnrollModal}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
          >
            In Journey einschreiben
          </button>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">Kundendaten</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Status</p>
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                statusColors[client.status] ?? "bg-gray-700 text-gray-300"
              }`}
            >
              {client.status}
            </span>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Ansprechpartner</p>
            <p className="text-white">{client.ansprechpartner ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">E-Mail</p>
            <p className="text-white">{client.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Telefon</p>
            <p className="text-white">{client.telefon ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Website</p>
            <p className="text-white">{client.website ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Startdatum</p>
            <p className="text-white">
              {client.startdatum
                ? new Date(client.startdatum).toLocaleDateString("de-DE")
                : "—"}
            </p>
          </div>
          {client.notes && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-gray-500 mb-1">Notizen</p>
              <p className="text-white whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Journey Enrollments */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">Customer Journeys</h2>
        {client.journeyEnrollments.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Journey-Einschreibungen.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium pb-2">Journey</th>
                <th className="text-left text-gray-400 font-medium pb-2">Schritt</th>
                <th className="text-left text-gray-400 font-medium pb-2">Status</th>
                <th className="text-left text-gray-400 font-medium pb-2">Nächstes Senden</th>
              </tr>
            </thead>
            <tbody>
              {client.journeyEnrollments.map((enr) => (
                <tr key={enr.id} className="border-b border-gray-700/50 last:border-b-0">
                  <td className="py-2">
                    <Link
                      href={`/journeys/${enr.journey.id}`}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      {enr.journey.name}
                    </Link>
                  </td>
                  <td className="py-2 text-gray-300">
                    {enr.currentStep + 1} / {enr.journey.steps.length}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        enrollmentStatusColors[enr.status] ?? "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {enr.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs">
                    {enr.nextSendAt
                      ? new Date(enr.nextSendAt).toLocaleString("de-DE")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Rechnungen</h2>
        {client.invoices.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Rechnungen.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium pb-2">Nummer</th>
                <th className="text-left text-gray-400 font-medium pb-2">Status</th>
                <th className="text-left text-gray-400 font-medium pb-2">Betrag</th>
                <th className="text-left text-gray-400 font-medium pb-2">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {client.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-700/50 last:border-b-0">
                  <td className="py-2 text-white font-medium">{inv.invoiceNumber}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        invoiceStatusColors[inv.status] ?? "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-300">
                    {inv.totalAmount.toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                  <td className="py-2 text-gray-400 text-xs">
                    {new Date(inv.createdAt).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-white font-semibold text-lg mb-4">In Journey einschreiben</h3>
            {journeys.length === 0 ? (
              <p className="text-gray-400 text-sm mb-4">Keine Journeys vorhanden.</p>
            ) : (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Journey auswählen</label>
                <select
                  value={selectedJourneyId}
                  onChange={(e) => setSelectedJourneyId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Bitte auswählen...</option>
                  {journeys.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {enrollError && (
              <p className="text-red-400 text-sm mb-4">{enrollError}</p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleEnroll}
                disabled={!selectedJourneyId || enrolling}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
              >
                {enrolling ? "Einschreiben..." : "Einschreiben"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
