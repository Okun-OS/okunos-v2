"use client";

import { useState } from "react";

interface ScrapeResult {
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  mapsUrl?: string;
  email?: string;
  foundEmails?: string[];
}

interface PipelineResult {
  leadsCreated: number;
  leadsSkipped: number;
  enrolled: number;
  enrollErrors: number;
}

export default function MapsPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [results, setResults] = useState<ScrapeResult[] | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [autoEnroll, setAutoEnroll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);

  // Autopilot mode
  const [autopilot, setAutopilot] = useState(false);
  const [autopilotScrapeWebsites, setAutopilotScrapeWebsites] = useState(true);
  const [autopilotEnroll, setAutopilotEnroll] = useState(true);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPlanError(null);
    setResults(null);
    setJobId(null);
    setSelected(new Set());
    setImportResult(null);
    setPipelineResult(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/maps/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          location,
          maxResults,
          scrapeWebsites: autopilot ? autopilotScrapeWebsites : false,
          autoCreateLeads: autopilot,
          autoEnroll: autopilot ? autopilotEnroll : false,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (resp.status === 403) {
          setPlanError(data.error ?? "Kein Zugriff.");
        } else {
          setError(data.error ?? "Fehler beim Scraping.");
        }
        return;
      }

      setJobId(data.jobId);
      setResults(data.results ?? []);
      if (data.pipeline) setPipelineResult(data.pipeline);
    } catch (err: any) {
      setError("Netzwerkfehler: " + err?.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  function selectAll() {
    if (!results) return;
    setSelected(new Set(results.map((_, i) => i)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function handleImport() {
    if (!jobId || selected.size === 0) return;
    setImporting(true);
    setImportResult(null);
    setError(null);

    try {
      const resp = await fetch(`/api/maps/results/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedResults: Array.from(selected),
          autoEnroll,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error ?? "Fehler beim Importieren.");
        return;
      }

      setImportResult(data);
    } catch (err: any) {
      setError("Netzwerkfehler: " + err?.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Google Maps Lead Import
        </h1>
        <p className="text-gray-400 mt-1">
          Finde potenzielle Leads direkt aus Google Maps und importiere sie in
          dein CRM.
        </p>
      </div>

      {planError && (
        <div className="mb-6 p-4 bg-yellow-900/40 border border-yellow-700 rounded-lg">
          <p className="text-yellow-300 font-medium">PRO-Plan erforderlich</p>
          <p className="text-yellow-400 text-sm mt-1">{planError}</p>
          <a
            href="/settings"
            className="mt-3 inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-lg transition"
          >
            Plan upgraden
          </a>
        </div>
      )}

      <form
        onSubmit={handleSearch}
        className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='z.B. "Immobilienmakler"'
              required
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Stadt / Ort
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='z.B. "Berlin"'
              required
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Max. Ergebnisse
            </label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) =>
                setMaxResults(
                  Math.min(50, Math.max(1, parseInt(e.target.value) || 20))
                )
              }
              min={1}
              max={50}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Autopilot mode */}
        <div className="border border-gray-700 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autopilot}
              onChange={(e) => setAutopilot(e.target.checked)}
              className="rounded border-gray-600 text-blue-500"
            />
            <span className="text-white font-medium text-sm">
              Autopilot-Modus
            </span>
            <span className="text-xs text-gray-400">
              — Leads automatisch erstellen ohne manuellen Import
            </span>
          </label>

          {autopilot && (
            <div className="ml-6 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={autopilotScrapeWebsites}
                  onChange={(e) => setAutopilotScrapeWebsites(e.target.checked)}
                  className="rounded border-gray-600"
                />
                Website-Scraper ausführen (E-Mails finden)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={autopilotEnroll}
                  onChange={(e) => setAutopilotEnroll(e.target.checked)}
                  className="rounded border-gray-600"
                />
                In Standard-Outreach-Sequenz einschreiben
              </label>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
        >
          {loading
            ? autopilot
              ? "Autopilot läuft..."
              : "Suche läuft..."
            : autopilot
            ? "Autopilot starten"
            : "Leads suchen"}
        </button>
      </form>

      {loading && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-300">
            {autopilot
              ? "Autopilot läuft: Maps → Website-Scraper → Leads erstellen → Outreach..."
              : "Google Maps wird durchsucht. Dies kann bis zu 2 Minuten dauern..."}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-900/40 border border-red-700 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Autopilot pipeline result */}
      {pipelineResult && (
        <div className="mb-4 p-4 bg-green-900/40 border border-green-700 rounded-lg">
          <p className="text-green-300 font-medium">Autopilot abgeschlossen</p>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-green-900/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-300">
                {pipelineResult.leadsCreated}
              </div>
              <div className="text-green-400">Leads erstellt</div>
            </div>
            <div className="bg-gray-700/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-300">
                {pipelineResult.leadsSkipped}
              </div>
              <div className="text-gray-400">Duplikate übersprungen</div>
            </div>
            <div className="bg-blue-900/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-300">
                {pipelineResult.enrolled}
              </div>
              <div className="text-blue-400">In Outreach eingeschrieben</div>
            </div>
            <div className="bg-gray-700/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-300">
                {(results?.length ?? 0)}
              </div>
              <div className="text-gray-400">Gefunden</div>
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <a
              href="/leads"
              className="inline-block px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition"
            >
              Leads ansehen
            </a>
            <a
              href="/outreach"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
            >
              Outreach ansehen
            </a>
          </div>
        </div>
      )}

      {results !== null && !loading && !autopilot && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-white font-medium">
                {results.length} Ergebnisse gefunden
              </span>
              {selected.size > 0 && (
                <span className="ml-2 text-gray-400 text-sm">
                  ({selected.size} ausgewählt)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              >
                Alle auswählen
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              >
                Alle abwählen
              </button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Keine Ergebnisse gefunden. Versuche andere Suchbegriffe.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-gray-400 font-medium w-10">
                      <input
                        type="checkbox"
                        checked={
                          selected.size === results.length && results.length > 0
                        }
                        onChange={(e) =>
                          e.target.checked ? selectAll() : deselectAll()
                        }
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">
                      Website
                    </th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">
                      Telefon
                    </th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">
                      Adresse
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-700/50 hover:bg-gray-750 transition ${
                        selected.has(idx) ? "bg-blue-900/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(idx)}
                          onChange={() => toggleSelect(idx)}
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">
                          {result.name}
                        </div>
                        {result.mapsUrl && (
                          <a
                            href={result.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            Maps ansehen
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {result.website ? (
                          <a
                            href={result.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline truncate max-w-[180px] block"
                          >
                            {result.website}
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {result.phone ?? (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {result.address ?? (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-700 flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEnroll}
                  onChange={(e) => setAutoEnroll(e.target.checked)}
                  className="rounded border-gray-600"
                />
                Direkt in Outreach-Sequenz einschreiben (Standard-Sequenz)
              </label>

              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
              >
                {importing
                  ? "Importiere..."
                  : `${selected.size} Lead${selected.size !== 1 ? "s" : ""} importieren`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Autopilot: show results as read-only table */}
      {results !== null && !loading && autopilot && results.length > 0 && !pipelineResult && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-700">
            <span className="text-white font-medium">
              {results.length} Ergebnisse gefunden
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Website</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Telefon</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Adresse</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50">
                    <td className="px-4 py-3 text-white font-medium">{result.name}</td>
                    <td className="px-4 py-3">
                      {result.website ? (
                        <a href={result.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[180px] block">
                          {result.website}
                        </a>
                      ) : <span className="text-gray-500">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{result.phone ?? <span className="text-gray-500">-</span>}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{result.address ?? <span className="text-gray-500">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResult && (
        <div className="mt-4 p-4 bg-green-900/40 border border-green-700 rounded-lg">
          <p className="text-green-300 font-medium">Import abgeschlossen</p>
          <p className="text-green-400 text-sm mt-1">
            {importResult.created} Lead{importResult.created !== 1 ? "s" : ""}{" "}
            erstellt, {importResult.skipped} bereits vorhanden (Duplikate
            übersprungen).
          </p>
          <a
            href="/leads"
            className="mt-3 inline-block px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition"
          >
            Leads ansehen
          </a>
        </div>
      )}
    </div>
  );
}
