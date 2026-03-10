"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    contactLine: "",
    validUntil: "",
    notes: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  // Pre-fill from deal
  useEffect(() => {
    if (!dealId) return;
    fetch(`/api/pipeline/${dealId}`)
      .then((r) => r.json())
      .then((deal) => {
        setForm((prev) => ({
          ...prev,
          customerName: deal.firma ?? "",
          customerEmail: deal.email ?? "",
          contactLine: deal.nachname
            ? `${deal.anrede ?? ""} ${deal.nachname}`.trim()
            : "",
        }));
      })
      .catch(() => {});
  }, [dealId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dealId: dealId || null,
          items,
          validUntil: form.validUntil || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Erstellen des Angebots.");
      }

      const quote = await res.json();
      router.push(`/quotes/${quote.id}`);
    } catch (err: any) {
      setError(err.message ?? "Unbekannter Fehler.");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/quotes"
          className="text-gray-400 hover:text-white text-sm transition"
        >
          ← Angebote
        </Link>
        <span className="text-gray-600">/</span>
        <h1 className="text-2xl font-bold text-white">Neues Angebot</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Customer Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Kundendaten</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Kundenname
              </label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Musterfirma GmbH"
                className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                E-Mail
              </label>
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleChange}
                placeholder="info@musterfirma.de"
                className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Ansprechpartner
              </label>
              <input
                type="text"
                name="contactLine"
                value={form.contactLine}
                onChange={handleChange}
                placeholder="z.B. Frau Müller"
                className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Gültig bis
              </label>
              <input
                type="date"
                name="validUntil"
                value={form.validUntil}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Positionen</h2>

          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Beschreibung"
                  className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                  placeholder="Menge"
                  min="0"
                  step="0.5"
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  placeholder="Einzelpreis"
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="w-28 flex items-center">
                <span className="text-gray-300 text-sm">
                  {(item.quantity * item.unitPrice).toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  €
                </span>
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-400 hover:text-red-300 text-sm transition mt-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="text-blue-400 hover:text-blue-300 text-sm transition"
          >
            + Position hinzufügen
          </button>

          <div className="border-t border-gray-700 pt-4 flex justify-end">
            <div className="text-right">
              <p className="text-gray-400 text-sm">Gesamtbetrag</p>
              <p className="text-white font-bold text-xl">
                {total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Hinweise / Anmerkungen
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="z.B. Zahlungsbedingungen, Lieferzeit..."
            className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/quotes"
            className="text-gray-400 hover:text-white text-sm transition px-4 py-2"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-6 rounded-lg transition"
          >
            {loading ? "Speichern..." : "Angebot erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
