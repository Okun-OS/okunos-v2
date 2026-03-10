"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface Props {
  dealId: string;
  currentStage: string;
  currentStatus: "ACTIVE" | "WON" | "LOST";
}

export default function StageActions({ dealId, currentStage, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    try {
      await fetch(`/api/pipeline/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function markWon() {
    if (!confirm("Deal als gewonnen markieren? Dies erstellt automatisch eine Rechnung und startet die Customer Journey.")) return;
    setLoading(true);
    try {
      await fetch(`/api/pipeline/${dealId}/won`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function markLost() {
    if (!confirm("Deal als verloren markieren?")) return;
    setLoading(true);
    try {
      await fetch(`/api/pipeline/${dealId}/lost`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function markGespräch() {
    const today = new Date().toLocaleDateString("de-DE");
    await patch({ stage: "CALL", notes: `Gespräch am ${today}` });
  }

  async function sendOffer() {
    await patch({ stage: "OFFER_SENT", offerSentAt: new Date().toISOString() });
  }

  if (currentStatus === "ACTIVE") {
    return (
      <>
        {currentStage !== "OFFER_SENT" && (
          <button
            onClick={sendOffer}
            disabled={loading}
            className="bg-yellow-900/40 hover:bg-yellow-900 text-yellow-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            → Angebot gesendet
          </button>
        )}
        {currentStage === "OFFER_SENT" && (
          <button
            onClick={markGespräch}
            disabled={loading}
            className="bg-blue-900/40 hover:bg-blue-900 text-blue-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            Gespräch vermerkt
          </button>
        )}
        <button
          onClick={markWon}
          disabled={loading}
          className="bg-green-900/40 hover:bg-green-900 text-green-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          Gewonnen
        </button>
        <button
          onClick={markLost}
          disabled={loading}
          className="bg-red-900/40 hover:bg-red-900 text-red-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          Verloren
        </button>
        <button
          onClick={markGespräch}
          disabled={loading}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
          title="Gespräch stattgefunden markieren"
        >
          Gespräch
        </button>
      </>
    );
  }

  if (currentStatus === "WON") {
    return (
      <button
        onClick={markLost}
        disabled={loading}
        className="bg-red-900/40 hover:bg-red-900 text-red-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
      >
        Lost markieren
      </button>
    );
  }

  if (currentStatus === "LOST") {
    return (
      <button
        onClick={markWon}
        disabled={loading}
        className="bg-green-900/40 hover:bg-green-900 text-green-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
      >
        Won markieren
      </button>
    );
  }

  return null;
}
