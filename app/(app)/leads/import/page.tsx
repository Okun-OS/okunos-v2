"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function LeadsImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
    setResult(null);
    setError(null);
  }

  async function parseCSV(text: string): Promise<Record<string, string>[]> {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV-Datei hat keine Datenzeilen.");

    const headers = lines[0].split(",").map((h) =>
      h.trim().replace(/^"|"$/g, "").toLowerCase()
    );

    const columnMap: Record<string, string> = {
      firma: "firma",
      company: "firma",
      unternehmen: "firma",
      "e-mail": "email",
      email: "email",
      "e-mail adresse": "email",
      telefon: "telefon",
      phone: "telefon",
      tel: "telefon",
      website: "website",
      url: "website",
      homepage: "website",
      quelle: "quelle",
      source: "quelle",
      herkunft: "quelle",
    };

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) =>
        v.trim().replace(/^"|"$/g, "")
      );
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        const mapped = columnMap[header];
        if (mapped) row[mapped] = values[i] ?? "";
      });
      return row;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Bitte wählen Sie eine CSV-Datei aus.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const rows = await parseCSV(text);

      if (rows.length === 0) {
        throw new Error("Keine gültigen Zeilen in der CSV-Datei gefunden.");
      }

      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Import fehlgeschlagen.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/leads"
          className="text-gray-400 hover:text-white text-sm transition"
        >
          ← Leads
        </Link>
        <span className="text-gray-600">/</span>
        <h1 className="text-2xl font-bold text-white">CSV Import</h1>
      </div>

      {/* Info box */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-200 mb-2">
          Erwartete Spalten
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          Die CSV-Datei sollte eine Kopfzeile mit den folgenden Spalten
          enthalten:
        </p>
        <div className="flex flex-wrap gap-2">
          {["Firma", "E-Mail", "Telefon", "Website", "Quelle"].map((col) => (
            <span
              key={col}
              className="bg-gray-700 text-gray-300 text-xs font-mono px-2.5 py-1 rounded"
            >
              {col}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Duplikate werden anhand von E-Mail, Website, Telefon und Firma
          erkannt und übersprungen.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-5"
      >
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                <span className="text-green-400 text-sm font-medium">
                  {result.imported} importiert
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <span className="text-yellow-400 text-sm font-medium">
                  {result.skipped} übersprungen
                </span>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-400 text-xs font-medium mb-1">
                  Fehler:
                </p>
                <ul className="space-y-0.5">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i} className="text-red-300 text-xs">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            CSV-Datei
          </label>
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileName ? (
              <div>
                <p className="text-white text-sm font-medium">{fileName}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Klicken zum Ändern
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 text-sm">
                  CSV-Datei hier ablegen oder klicken zum Auswählen
                </p>
                <p className="text-gray-600 text-xs mt-1">Nur .csv Dateien</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/leads"
            className="text-gray-400 hover:text-white text-sm transition px-4 py-2"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={loading || !fileName}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-6 rounded-lg transition"
          >
            {loading ? "Importiere..." : "Importieren"}
          </button>
        </div>
      </form>
    </div>
  );
}
