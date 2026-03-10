"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  dealId: string;
  currentStatus: "ACTIVE" | "WON" | "LOST";
}

export default function PipelineActions({ dealId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markWon() {
    if (!confirm("Deal als gewonnen markieren?")) return;
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

  if (currentStatus === "ACTIVE") {
    return (
      <>
        <button
          onClick={markWon}
          disabled={loading}
          className="bg-green-900/40 hover:bg-green-900 text-green-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          Won markieren
        </button>
        <button
          onClick={markLost}
          disabled={loading}
          className="bg-red-900/40 hover:bg-red-900 text-red-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          Lost markieren
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
