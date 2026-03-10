"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

type Mode = "generate" | "upload";

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");

  const [mode, setMode] = useState<Mode>("generate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  async function handleSubmitGenerate(e: React.FormEvent) {
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

  async function handleSubmitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError("Bitte wähle eine PDF-Datei aus.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create quote with empty items
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dealId: dealId || null,
          items: [],
          validUntil: form.validUntil || null,
          isUpload: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Erstellen des Angebots.");
      }

      const quote = await res.json();

      // 2. Upload the PDF file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch(`/api/quotes/${quote.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Hochladen der Datei.");
      }

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

      {/* Mode toggle */}
      <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-300 mb-3">Angebots-Art</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode("generate")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition border ${
              mode === "generate"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Angebot generieren
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition border ${
              mode === "upload"
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Eigenes PDF hochladen
          </button>
        </div>
      </div>

      <form onSubmit={mode === "generate" ? handleSubmitGenerate : handleSubmitUpload} className="space-y-6">
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
            {mode === "generate" && (
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
            )}
          </div>
        </div>

        {/* PDF Upload (upload mode only) */}
        {mode === "upload" && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold">PDF hochladen</h2>
            <div
              className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
              />
              {selectedFile ? (
                <div>
                  <p className="text-purple-300 font-medium">{selectedFile.name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 text-sm">Klicken zum Auswählen einer PDF-Datei</p>
                  <p className="text-gray-600 text-xs mt-1">Nur PDF-Dateien</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Line Items (generate mode only) */}
        {mode === "generate" && (
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
        )}

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
            className={`disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-6 rounded-lg transition ${
              mode === "upload"
                ? "bg-purple-600 hover:bg-purple-500"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {loading
              ? "Speichern..."
              : mode === "upload"
              ? "PDF-Angebot erstellen"
              : "Angebot erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
