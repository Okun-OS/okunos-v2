"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LeadActionsProps {
  leadId: string;
  firma: string;
  status: string;
  website: string | null;
  optout: boolean;
}

export default function LeadActions({
  leadId,
  firma,
  status,
  website,
  optout,
}: LeadActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moveToDeal() {
    setLoading("deal");
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/to-deal`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler.");
      }
      const data = await res.json();
      router.push(`/pipeline`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function archiveLead() {
    if (!confirm(`Lead "${firma}" archivieren?`)) return;
    setLoading("archive");
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!res.ok) throw new Error("Fehler beim Archivieren.");
      router.push("/leads");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function toggleOptout() {
    setLoading("optout");
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optout: !optout }),
      });
      if (!res.ok) throw new Error("Fehler.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function scanWebsite() {
    setLoading("scan");
    setError(null);
    setScanResult(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/scan-website`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Scan fehlgeschlagen.");
      }
      const data = await res.json();
      setScanResult(data.emails ?? []);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-3">
      <h2 className="text-white font-semibold mb-4">Aktionen</h2>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Edit */}
      <Link
        href={`/leads/${leadId}/edit`}
        className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition"
      >
        Bearbeiten
      </Link>

      {/* Move to pipeline */}
      {status !== "ARCHIVED" && (
        <button
          onClick={moveToDeal}
          disabled={loading === "deal"}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition"
        >
          {loading === "deal" ? "Verschiebe..." : "In Pipeline verschieben"}
        </button>
      )}

      {/* Scan website */}
      {website && (
        <div>
          <button
            onClick={scanWebsite}
            disabled={loading === "scan"}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition"
          >
            {loading === "scan" ? "Scanne..." : "Website scannen"}
          </button>
          {scanResult !== null && (
            <div className="mt-2 text-xs text-gray-400">
              {scanResult.length === 0
                ? "Keine E-Mails gefunden."
                : `Gefunden: ${scanResult.join(", ")}`}
            </div>
          )}
        </div>
      )}

      {/* Opt-out toggle */}
      <button
        onClick={toggleOptout}
        disabled={loading === "optout"}
        className={`w-full text-sm font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 ${
          optout
            ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
            : "bg-orange-900 hover:bg-orange-800 text-orange-300"
        }`}
      >
        {loading === "optout"
          ? "..."
          : optout
          ? "Opt-out aufheben"
          : "Als Opt-out markieren"}
      </button>

      {/* Archive */}
      {status !== "ARCHIVED" && (
        <button
          onClick={archiveLead}
          disabled={loading === "archive"}
          className="w-full bg-gray-900 hover:bg-gray-700 border border-gray-600 text-gray-400 hover:text-white text-sm font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading === "archive" ? "Archiviere..." : "Archivieren"}
        </button>
      )}
    </div>
  );
}
