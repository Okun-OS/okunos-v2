"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  firmenname: string;
}

interface Props {
  journeyId: string;
  clients: Client[];
}

export default function JourneyEnrollForm({ journeyId, clients }: Props) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    setEnrolling(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/clients/${clientId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Kunde erfolgreich eingeschrieben.");
        setClientId("");
        router.refresh();
      } else {
        setError(data.error || "Fehler beim Einschreiben");
      }
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <form onSubmit={handleEnroll} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-gray-400 text-sm mb-1.5">Kunde auswählen</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">Bitte auswählen...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firmenname}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={!clientId || enrolling}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition whitespace-nowrap"
      >
        {enrolling ? "Einschreiben..." : "Einschreiben"}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}
    </form>
  );
}
