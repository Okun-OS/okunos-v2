"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BillingInfo {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

export default function BillingPage() {
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/info")
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  const planBadgeColor: Record<string, string> = {
    FREE: "bg-gray-700 text-gray-300",
    STARTER: "bg-blue-900 text-blue-300",
    PRO: "bg-purple-900 text-purple-300",
    AGENCY: "bg-green-900 text-green-300",
  };

  const statusBadgeColor: Record<string, string> = {
    active: "bg-green-900 text-green-300",
    trial: "bg-yellow-900 text-yellow-300",
    past_due: "bg-red-900 text-red-300",
    canceled: "bg-gray-700 text-gray-400",
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Abrechnung</h1>
      <p className="text-gray-400 text-sm mb-8">Dein aktueller Plan und Zahlungsstatus</p>

      {loading ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-500">
          Lädt...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Aktueller Plan</h2>
            <div className="flex items-center gap-4 mb-4">
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  planBadgeColor[info?.plan ?? "FREE"] ?? "bg-gray-700 text-gray-300"
                }`}
              >
                {info?.plan ?? "FREE"}
              </span>
              {info?.status && (
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    statusBadgeColor[info.status] ?? "bg-gray-700 text-gray-300"
                  }`}
                >
                  {info.status}
                </span>
              )}
            </div>

            {info?.currentPeriodEnd && (
              <p className="text-gray-400 text-sm mb-4">
                Läuft bis:{" "}
                <span className="text-gray-200">
                  {new Date(info.currentPeriodEnd).toLocaleDateString("de-DE")}
                </span>
              </p>
            )}

            <div className="flex items-center gap-3 mt-4">
              {info?.stripeCustomerId ? (
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition disabled:opacity-60"
                >
                  {portalLoading ? "Weiterleiten..." : "Abonnement verwalten"}
                </button>
              ) : null}
              <Link
                href="/pricing"
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
              >
                Plan upgraden
              </Link>
            </div>
          </div>

          {(!info?.plan || info.plan === "FREE") && (
            <div className="bg-blue-900/30 border border-blue-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Upgrade auf einen bezahlten Plan</h3>
              <p className="text-gray-400 text-sm mb-4">
                Erhalte Zugang zu mehr Leads, E-Mails und Features mit einem unserer Pläne.
              </p>
              <Link
                href="/pricing"
                className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Pläne ansehen
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
