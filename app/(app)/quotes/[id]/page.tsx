"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  contactLine: string | null;
  validUntil: string | null;
  status: string;
  items: LineItem[];
  totalAmount: number;
  notes: string | null;
  sentAt: string | null;
  createdAt: string;
  fileUrl: string | null;
  isUpload: boolean;
  deal: { firma: string } | null;
  workspace: {
    name: string;
    fromName: string | null;
    fromEmail: string | null;
  };
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/quotes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setQuote(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSend() {
    if (!confirm("Angebot per E-Mail senden?")) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/quotes/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setMessage({ type: "success", text: "Angebot wurde erfolgreich gesendet." });
      setQuote((prev) => prev ? { ...prev, status: "SENT", sentAt: new Date().toISOString() } : prev);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Fehler beim Senden." });
    } finally {
      setSending(false);
    }
  }

  async function handleSendUpload() {
    if (!confirm("Hochgeladenes Angebot per E-Mail mit PDF-Anhang senden?")) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/quotes/${id}/send-upload`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setMessage({ type: "success", text: "Angebot (PDF) wurde erfolgreich gesendet." });
      setQuote((prev) => prev ? { ...prev, status: "SENT", sentAt: new Date().toISOString() } : prev);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Fehler beim Senden." });
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMessage({ type: "error", text: "Nur PDF-Dateien erlaubt." });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/quotes/${id}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload fehlgeschlagen.");

      setMessage({ type: "success", text: "PDF erfolgreich hochgeladen." });
      setQuote((prev) =>
        prev ? { ...prev, fileUrl: data.fileUrl, isUpload: true } : prev
      );
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Fehler beim Hochladen." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-gray-400">Lade Angebot...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-red-400">Angebot nicht gefunden.</div>
      </div>
    );
  }

  const items = Array.isArray(quote.items) ? quote.items : [];
  const senderName = quote.workspace.fromName || quote.workspace.name || "OkunOS";
  const senderEmail = quote.workspace.fromEmail || "";

  return (
    <>
      {/* Action Bar (no-print) */}
      <div className="print:hidden p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between flex-wrap gap-3">
        <Link href="/quotes" className="text-gray-400 hover:text-white text-sm transition">
          ← Zurück zu Angebote
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          {message && (
            <span
              className={`text-sm ${
                message.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message.text}
            </span>
          )}

          {/* Upload section */}
          <div className="flex items-center gap-2">
            {quote.isUpload && quote.fileUrl && (
              <>
                <span className="bg-purple-900/40 text-purple-300 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-purple-700/50">
                  Hochgeladenes Angebot
                </span>
                <a
                  href={quote.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                >
                  PDF ansehen
                </a>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {uploading ? "Hochladen..." : "PDF hochladen"}
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            PDF speichern
          </button>

          {/* Send buttons */}
          {quote.isUpload && quote.fileUrl ? (
            <button
              onClick={handleSendUpload}
              disabled={sending || !quote.customerEmail}
              className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              {sending ? "Senden..." : "Angebot (Upload) senden"}
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending || !quote.customerEmail}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              {sending ? "Senden..." : "Per E-Mail senden"}
            </button>
          )}
        </div>
      </div>

      {/* Upload type badge if applicable */}
      {quote.isUpload && (
        <div className="print:hidden px-8 pt-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-purple-300 bg-purple-900/20 border border-purple-800/40 rounded-lg px-4 py-2">
            <span>Dieses Angebot wurde als eigenes PDF hochgeladen.</span>
            {quote.sentAt && (
              <span className="text-gray-400 ml-auto">
                Gesendet am {new Date(quote.sentAt).toLocaleDateString("de-DE")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Print-optimized Document */}
      <div className="p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
        <div className="bg-white text-gray-900 rounded-xl p-10 print:rounded-none print:shadow-none shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ANGEBOT</h1>
              <p className="text-gray-500 mt-1 font-mono">{quote.quoteNumber}</p>
              {quote.isUpload && (
                <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                  Eigenes PDF
                </span>
              )}
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-semibold text-gray-900">{senderName}</p>
              {senderEmail && <p>{senderEmail}</p>}
              <p className="mt-2">
                Datum: {new Date(quote.createdAt).toLocaleDateString("de-DE")}
              </p>
              {quote.validUntil && (
                <p>
                  Gültig bis: {new Date(quote.validUntil).toLocaleDateString("de-DE")}
                </p>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="mb-10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Angebot für
            </p>
            <p className="font-semibold text-gray-900">
              {quote.customerName || quote.deal?.firma || "—"}
            </p>
            {quote.contactLine && <p className="text-gray-600">{quote.contactLine}</p>}
            {quote.customerEmail && <p className="text-gray-600">{quote.customerEmail}</p>}
          </div>

          {/* Line Items */}
          {items.length > 0 ? (
            <>
              <table className="w-full mb-8 text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 text-gray-600 font-semibold">Beschreibung</th>
                    <th className="text-right py-2 text-gray-600 font-semibold w-20">Menge</th>
                    <th className="text-right py-2 text-gray-600 font-semibold w-28">Einzelpreis</th>
                    <th className="text-right py-2 text-gray-600 font-semibold w-28">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{item.description}</td>
                      <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600">
                        {item.unitPrice.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="py-3 text-right text-gray-900 font-medium">
                        {(item.quantity * item.unitPrice).toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-t-2 border-gray-900">
                    <span className="font-bold text-gray-900">Gesamtbetrag</span>
                    <span className="font-bold text-gray-900">
                      {quote.totalAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : quote.isUpload ? (
            <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200 text-center">
              <p className="text-purple-700 font-medium">Hochgeladenes PDF-Angebot</p>
              {quote.fileUrl && (
                <a
                  href={quote.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 underline text-sm mt-1 inline-block"
                >
                  PDF anzeigen
                </a>
              )}
            </div>
          ) : null}

          {/* Notes */}
          {quote.notes && (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Hinweise
              </p>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
