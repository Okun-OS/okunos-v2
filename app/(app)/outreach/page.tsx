"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-900 text-green-300",
    DONE: "bg-gray-700 text-gray-400",
    PAUSED: "bg-yellow-900 text-yellow-300",
    UNSUBSCRIBED: "bg-red-900 text-red-300",
  };
  return map[status] ?? "bg-gray-700 text-gray-400";
}

interface DueStep {
  stepNumber: number;
  subject: string;
  count: number;
}

interface RecentSend {
  id: string;
  leadId: string | null;
  email: string;
  subject: string;
  stage: string;
  sentAt: string;
}

interface StatsData {
  dueByStep: DueStep[];
  recentSends: RecentSend[];
  totalDueToday: number;
}

interface Sequence {
  id: string;
  name: string;
  isDefault: boolean;
  _count: { stages: number; enrollments: number };
}

interface Enrollment {
  id: string;
  currentStep: number;
  status: string;
  nextSendAt: string | null;
  lead: { firma: string };
  sequence: { name: string };
}

interface PageData {
  sequences: Sequence[];
  enrollments: Enrollment[];
  sentToday: number;
  totalActive: number;
  replyRate: string;
  lastOutreachRunAt: string | null;
  stats: StatsData;
}

async function fetchPageData(): Promise<PageData> {
  const [mainRes, statsRes] = await Promise.all([
    fetch("/api/outreach/page-data", { cache: "no-store" }),
    fetch("/api/outreach/stats", { cache: "no-store" }),
  ]);
  const main = await mainRes.json();
  const stats = await statsRes.json();
  return { ...main, stats };
}

export default function OutreachPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const d = await fetchPageData();
      setData(d);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRun = async () => {
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch("/api/outreach/run", { method: "POST" });
      const d = await res.json();
      setRunMsg(`Gesendet: ${d.sent}, Fehler: ${d.errors}`);
      await loadData();
    } catch {
      setRunMsg("Fehler beim Ausführen des Runners.");
    } finally {
      setRunning(false);
    }
  };

  if (!data) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <p className="text-gray-400">Laden…</p>
      </div>
    );
  }

  const { sequences, enrollments, sentToday, totalActive, replyRate, lastOutreachRunAt, stats } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Outreach</h1>
          {lastOutreachRunAt && (
            <p className="text-gray-400 text-sm mt-1">
              Zuletzt ausgeführt:{" "}
              {new Date(lastOutreachRunAt).toLocaleString("de-DE")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/outreach/logs"
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Alle Logs ansehen
          </Link>
          <button
            onClick={handleRun}
            disabled={running}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition"
          >
            {running ? "Läuft…" : "Runner jetzt ausführen"}
          </button>
        </div>
      </div>

      {runMsg && (
        <div className="mb-6 bg-blue-900/40 border border-blue-700 rounded-lg px-4 py-3 text-blue-300 text-sm">
          {runMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Aktive Enrollments
          </p>
          <p className="text-3xl font-bold text-green-400">{totalActive}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Gesendet heute
          </p>
          <p className="text-3xl font-bold text-blue-400">{sentToday}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Reply Rate
          </p>
          <p className="text-3xl font-bold text-purple-400">{replyRate}%</p>
        </div>
      </div>

      {/* Fällige E-Mails */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl mb-8">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">Fällige E-Mails</h2>
          <span className="text-gray-400 text-sm">
            Gesamt fällig: <span className="text-white font-medium">{stats.totalDueToday}</span>
          </span>
        </div>
        {stats.dueByStep.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">Keine fälligen E-Mails.</div>
        ) : (
          <div className="p-6 flex flex-wrap gap-3">
            {stats.dueByStep.map((s) => {
              const label =
                s.stepNumber === 1
                  ? "NEW"
                  : s.stepNumber === 2
                  ? "FU1"
                  : s.stepNumber === 3
                  ? "FU2"
                  : `Step ${s.stepNumber}`;
              return (
                <div
                  key={s.stepNumber}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 min-w-[100px] text-center"
                >
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-white">{s.count}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Letzte Sendungen */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl mb-8">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">Letzte Sendungen</h2>
          <Link
            href="/outreach/logs"
            className="text-blue-400 hover:text-blue-300 text-sm transition"
          >
            Alle ansehen
          </Link>
        </div>
        {stats.recentSends.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">Noch keine Sendungen.</div>
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
              {stats.recentSends.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                >
                  <td className="px-6 py-3 text-gray-300 text-sm">{s.email}</td>
                  <td className="px-6 py-3 text-gray-300 text-sm truncate max-w-[200px]">
                    {s.subject}
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{s.stage}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm">
                    {new Date(s.sentAt).toLocaleString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sequences */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl mb-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-white font-semibold">E-Mail Sequenzen</h2>
          <Link
            href="/outreach/sequences/new"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Neue Sequenz
          </Link>
        </div>
        {sequences.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">Keine Sequenzen vorhanden.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Name
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Schritte
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Enrollments
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Standard
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {sequences.map((seq) => (
                <tr
                  key={seq.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                >
                  <td className="px-6 py-4 text-white font-medium">{seq.name}</td>
                  <td className="px-6 py-4 text-gray-300">{seq._count.stages}</td>
                  <td className="px-6 py-4 text-gray-300">{seq._count.enrollments}</td>
                  <td className="px-6 py-4">
                    {seq.isDefault && (
                      <span className="bg-blue-900 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/outreach/sequences/${seq.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm transition"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enrollments */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-white font-semibold">Enrollments</h2>
        </div>
        {enrollments.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">Keine Enrollments vorhanden.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Firma
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Sequenz
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Schritt
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Status
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">
                  Nächster Versand
                </th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                >
                  <td className="px-6 py-4 text-white">{e.lead.firma}</td>
                  <td className="px-6 py-4 text-gray-300">{e.sequence.name}</td>
                  <td className="px-6 py-4 text-gray-300">{e.currentStep + 1}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(
                        e.status
                      )}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {e.nextSendAt
                      ? new Date(e.nextSendAt).toLocaleString("de-DE")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
