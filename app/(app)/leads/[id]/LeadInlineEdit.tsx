"use client";

import { useState } from "react";

interface Props {
  leadId: string;
  kommentar: string | null;
  nextAction: string | null;
  nextDate: string | null;
}

export default function LeadInlineEdit({ leadId, kommentar, nextAction, nextDate }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kommentarVal, setKommentarVal] = useState(kommentar ?? "");
  const [nextActionVal, setNextActionVal] = useState(nextAction ?? "");
  const [nextDateVal, setNextDateVal] = useState(
    nextDate ? new Date(nextDate).toISOString().split("T")[0] : ""
  );

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kommentar: kommentarVal || null,
          nextAction: nextActionVal || null,
          nextDate: nextDateVal ? new Date(nextDateVal).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Speichern fehlgeschlagen");
        return;
      }
      setEditing(false);
    } catch {
      setError("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setKommentarVal(kommentar ?? "");
    setNextActionVal(nextAction ?? "");
    setNextDateVal(nextDate ? new Date(nextDate).toISOString().split("T")[0] : "");
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Notizen & Aktionen
          </h3>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            Bearbeiten
          </button>
        </div>

        {kommentarVal && (
          <div>
            <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Kommentar</dt>
            <dd className="text-gray-200 text-sm mt-0.5 whitespace-pre-wrap">{kommentarVal}</dd>
          </div>
        )}
        {nextActionVal && (
          <div>
            <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Nächste Aktion</dt>
            <dd className="text-gray-200 text-sm mt-0.5">{nextActionVal}</dd>
          </div>
        )}
        {nextDateVal && (
          <div>
            <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Nächstes Datum</dt>
            <dd className="text-gray-200 text-sm mt-0.5">
              {new Date(nextDateVal).toLocaleDateString("de-DE")}
            </dd>
          </div>
        )}
        {!kommentarVal && !nextActionVal && !nextDateVal && (
          <p className="text-gray-600 text-sm">Kein Kommentar oder Aktion gesetzt.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          Notizen & Aktionen bearbeiten
        </h3>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">
          Kommentar
        </label>
        <textarea
          value={kommentarVal}
          onChange={(e) => setKommentarVal(e.target.value)}
          rows={3}
          className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-y"
          placeholder="Kommentar eingeben..."
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">
          Nächste Aktion
        </label>
        <input
          type="text"
          value={nextActionVal}
          onChange={(e) => setNextActionVal(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          placeholder="z.B. Anrufen, Angebot senden..."
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">
          Nächstes Datum
        </label>
        <input
          type="date"
          value={nextDateVal}
          onChange={(e) => setNextDateVal(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition disabled:opacity-60"
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
        <button
          onClick={cancel}
          className="text-gray-400 hover:text-white text-sm transition"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
