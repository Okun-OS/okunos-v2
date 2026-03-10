"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stage {
  id?: string;
  stepNumber: number;
  delayDays: number;
  subject: string;
  body: string;
}

interface Enrollment {
  id: string;
  status: string;
  currentStep: number;
  nextSendAt: string | null;
  lead: { id: string; firma: string; email: string | null };
}

interface Sequence {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
  enrollments: Enrollment[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-900 text-green-300",
  DONE: "bg-gray-700 text-gray-400",
  PAUSED: "bg-yellow-900 text-yellow-300",
  UNSUBSCRIBED: "bg-red-900 text-red-300",
};

export default function EditSequencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    fetch(`/api/outreach/sequences/${id}`)
      .then((r) => r.json())
      .then((data: Sequence) => {
        setSequence(data);
        setName(data.name);
        setIsDefault(data.isDefault);
        setStages(data.stages);
        setLoading(false);
      })
      .catch(() => {
        setError("Sequenz konnte nicht geladen werden.");
        setLoading(false);
      });
  }, [id]);

  function addStage() {
    setStages((prev) => [
      ...prev,
      { stepNumber: prev.length + 1, delayDays: 3, subject: "", body: "" },
    ]);
  }

  function removeStage(index: number) {
    setStages((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  }

  function updateStage(index: number, field: keyof Stage, value: string | number) {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name ist Pflichtfeld.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/outreach/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isDefault, stages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Speichern.");
      }

      setSuccess("Sequenz erfolgreich gespeichert.");
    } catch (err: any) {
      setError(err.message ?? "Unbekannter Fehler.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/outreach/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error("Fehler");
      setIsDefault(true);
      setSuccess("Als Standard gesetzt.");
    } catch {
      setError("Fehler beim Setzen als Standard.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Sequenz wirklich löschen? Dies kann nicht rückgängig gemacht werden.")) return;
    try {
      const res = await fetch(`/api/outreach/sequences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler");
      router.push("/outreach/sequences");
    } catch {
      setError("Fehler beim Löschen.");
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-gray-400">Lade Sequenz...</div>
      </div>
    );
  }

  if (!sequence && !loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-red-400">Sequenz nicht gefunden.</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/outreach/sequences"
            className="text-gray-400 hover:text-white text-sm transition"
          >
            ← Sequenzen
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-2xl font-bold text-white">{sequence?.name}</h1>
          {isDefault && (
            <span className="bg-blue-900 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
              Standard
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isDefault && (
            <button
              type="button"
              onClick={handleSetDefault}
              disabled={saving}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
            >
              Als Standard setzen
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-900/40 hover:bg-red-900 text-red-300 text-sm font-medium px-3 py-2 rounded-lg transition"
          >
            Löschen
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm rounded-lg px-4 py-3">
            {success}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Grundeinstellungen</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-300">
              Als Standard-Sequenz
            </label>
          </div>
        </div>

        {/* Stages */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Schritte ({stages.length})</h2>
          </div>

          {stages.map((stage, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-600 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">
                  Schritt {stage.stepNumber}
                </h3>
                {stages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStage(index)}
                    className="text-red-400 hover:text-red-300 text-xs transition"
                  >
                    Entfernen
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Schritt-Nr.
                  </label>
                  <input
                    type="number"
                    value={stage.stepNumber}
                    onChange={(e) => updateStage(index, "stepNumber", parseInt(e.target.value))}
                    min={1}
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Verzögerung (Tage)
                  </label>
                  <input
                    type="number"
                    value={stage.delayDays}
                    onChange={(e) => updateStage(index, "delayDays", parseInt(e.target.value))}
                    min={0}
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Betreff
                </label>
                <input
                  type="text"
                  value={stage.subject}
                  onChange={(e) => updateStage(index, "subject", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Text{" "}
                  <span className="text-gray-500 font-normal">
                    ({"{{senderName}}"} verfügbar)
                  </span>
                </label>
                <textarea
                  value={stage.body}
                  onChange={(e) => updateStage(index, "body", e.target.value)}
                  rows={6}
                  className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addStage}
            className="w-full border border-dashed border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 text-sm py-3 rounded-xl transition"
          >
            + Schritt hinzufügen
          </button>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/outreach/sequences"
            className="text-gray-400 hover:text-white text-sm transition px-4 py-2"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-6 rounded-lg transition"
          >
            {saving ? "Speichern..." : "Änderungen speichern"}
          </button>
        </div>
      </form>

      {/* Enrollments */}
      {sequence && sequence.enrollments.length > 0 && (
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-white font-semibold">
              Eingeschriebene Leads ({sequence.enrollments.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium px-6 py-3">Firma</th>
                <th className="text-left text-gray-400 font-medium px-6 py-3">E-Mail</th>
                <th className="text-left text-gray-400 font-medium px-6 py-3">Schritt</th>
                <th className="text-left text-gray-400 font-medium px-6 py-3">Status</th>
                <th className="text-left text-gray-400 font-medium px-6 py-3">Nächster Versand</th>
              </tr>
            </thead>
            <tbody>
              {sequence.enrollments.map((e, i) => (
                <tr
                  key={e.id}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition ${
                    i === sequence.enrollments.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/leads/${e.lead.id}`}
                      className="text-white hover:text-blue-400 transition"
                    >
                      {e.lead.firma}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{e.lead.email ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-300">{e.currentStep + 1}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        statusColors[e.status] ?? "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {e.nextSendAt
                      ? new Date(e.nextSendAt).toLocaleString("de-DE")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
