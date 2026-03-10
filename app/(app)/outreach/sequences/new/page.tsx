"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stage {
  stepNumber: number;
  delayDays: number;
  subject: string;
  body: string;
}

export default function NewSequencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [stages, setStages] = useState<Stage[]>([
    { stepNumber: 1, delayDays: 0, subject: "", body: "" },
  ]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name ist Pflichtfeld.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/outreach/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isDefault, stages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Erstellen der Sequenz.");
      }

      router.push("/outreach/sequences");
    } catch (err: any) {
      setError(err.message ?? "Unbekannter Fehler.");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/outreach/sequences"
          className="text-gray-400 hover:text-white text-sm transition"
        >
          ← Sequenzen
        </Link>
        <span className="text-gray-600">/</span>
        <h1 className="text-2xl font-bold text-white">Neue Sequenz</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
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
              placeholder="z.B. Kalt-Akquise Sequenz"
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
              Als Standard-Sequenz festlegen
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
                  placeholder="E-Mail Betreff"
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
                  placeholder="E-Mail Text..."
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/outreach/sequences"
            className="text-gray-400 hover:text-white text-sm transition px-4 py-2"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-6 rounded-lg transition"
          >
            {loading ? "Speichern..." : "Sequenz erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
