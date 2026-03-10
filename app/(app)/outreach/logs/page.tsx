"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface LogEntry {
  id: string;
  email: string;
  subject: string;
  stage: string;
  sentAt: string;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  pages: number;
}

const PAGE_SIZE = 20;

export default function OutreachLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/outreach/logs?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Outreach Logs</h1>
          {data && (
            <p className="text-gray-400 text-sm mt-1">
              {data.total} Einträge gesamt
            </p>
          )}
        </div>
        <Link
          href="/outreach"
          className="text-gray-400 hover:text-white text-sm transition"
        >
          ← Zurück
        </Link>
      </div>

      {/* Filter */}
      <form
        onSubmit={handleFilter}
        className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6 flex flex-wrap gap-4 items-end"
      >
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            Von
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            Bis
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Filtern
        </button>
        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setPage(1);
            }}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Zurücksetzen
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl">
        {loading ? (
          <div className="p-6 text-gray-400 text-sm">Laden…</div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">Keine Logs gefunden.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  E-Mail
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Betreff
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Step
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Gesendet am
                </th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                >
                  <td className="px-6 py-4 text-gray-300 text-sm">{log.email}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm">{log.subject}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{log.stage}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(log.sentAt).toLocaleString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-gray-400 text-sm">
            Seite {data.page} von {data.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.page <= 1}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Zurück
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={data.page >= data.pages}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
