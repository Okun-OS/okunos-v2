"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Step {
  stepNumber: number;
  delayDays: number;
  subject: string;
  body: string;
  type: string;
}

export default function NewJourneyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { stepNumber: 1, delayDays: 0, subject: "", body: "", type: "EMAIL" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        delayDays: 1,
        subject: "",
        body: "",
        type: "EMAIL",
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  };

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name ist erforderlich.");
      return;
    }
    if (steps.some((s) => !s.subject.trim() || !s.body.trim())) {
      setError("Alle Steps benötigen Betreff und Inhalt.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, steps }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/journeys/${data.id}`);
      } else {
        setError(data.error || "Fehler beim Erstellen");
      }
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/journeys" className="text-gray-400 hover:text-white text-sm transition">
          ← Journeys
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Neue Journey erstellen</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Grunddaten</h2>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Onboarding-Sequenz"
              className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung der Journey..."
              rows={2}
              className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <h2 className="text-white font-semibold">Steps</h2>
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-sm">
                  Step {step.stepNumber}
                </span>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-red-400 hover:text-red-300 text-xs transition"
                  >
                    Entfernen
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">
                    Verzögerung (Tage)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={step.delayDays}
                    onChange={(e) =>
                      updateStep(index, "delayDays", parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Typ</label>
                  <select
                    value={step.type}
                    onChange={(e) => updateStep(index, "type", e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="EMAIL">E-Mail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Betreff *</label>
                <input
                  type="text"
                  value={step.subject}
                  onChange={(e) => updateStep(index, "subject", e.target.value)}
                  placeholder="E-Mail Betreff"
                  className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1.5">
                  Inhalt * <span className="text-gray-600">({"{{senderName}}"} verfügbar)</span>
                </label>
                <textarea
                  value={step.body}
                  onChange={(e) => updateStep(index, "body", e.target.value)}
                  placeholder="Sehr geehrte Damen und Herren,..."
                  rows={5}
                  className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-y font-mono"
                  required
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addStep}
            className="w-full border border-dashed border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 text-sm py-3 rounded-xl transition"
          >
            + Step hinzufügen
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/journeys"
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-6 rounded-lg transition"
          >
            {saving ? "Erstellen..." : "Journey erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
