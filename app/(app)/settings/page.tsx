"use client";

import { useEffect, useState } from "react";

interface Settings {
  name: string;
  slug: string;
  plan: string;
  fromName: string;
  fromEmail: string;
  emailProvider: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  outreachRunnerEnabled: boolean;
  outreachRunnerTime: string;
  journeyRunnerEnabled: boolean;
  journeyRunnerTime: string;
  maxEmailsPerDay: string;
  maxEmailsPerRun: string;
  randomDelayEnabled: boolean;
  lastOutreachRunAt: string | null;
  lastJourneyRunAt: string | null;
  members: Array<{ email: string; name: string | null; role: string }>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleTestEmail() {
    setTestStatus("Sende...");
    const res = await fetch("/api/settings/test-email", { method: "POST" });
    const data = await res.json();
    setTestStatus(data.ok ? "✓ Test-Mail gesendet!" : `✗ Fehler: ${data.error}`);
    setTimeout(() => setTestStatus(""), 5000);
  }

  if (!settings) {
    return (
      <div className="p-8 text-gray-400">Lade Einstellungen...</div>
    );
  }

  function update(key: keyof Settings, value: any) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-8">Einstellungen</h1>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Workspace Info */}
        <Section title="Workspace">
          <Field label="Name">
            <input
              value={settings.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Slug (URL)">
            <input value={settings.slug} readOnly className={`${inputCls} opacity-50`} />
          </Field>
          <Field label="Plan">
            <span className="text-blue-400 font-medium">{settings.plan}</span>
          </Field>
        </Section>

        {/* Sender Config */}
        <Section title="Absender-Konfiguration">
          <Field label="Absendername">
            <input
              value={settings.fromName}
              onChange={(e) => update("fromName", e.target.value)}
              placeholder="Meine Agentur"
              className={inputCls}
            />
          </Field>
          <Field label="Absender-E-Mail">
            <input
              type="email"
              value={settings.fromEmail}
              onChange={(e) => update("fromEmail", e.target.value)}
              placeholder="outreach@meine-agentur.de"
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Email Provider */}
        <Section title="E-Mail Provider">
          <Field label="Provider">
            <select
              value={settings.emailProvider || "RESEND"}
              onChange={(e) => update("emailProvider", e.target.value)}
              className={inputCls}
            >
              <option value="RESEND">Resend (Standard)</option>
              <option value="SMTP">SMTP (eigener Server)</option>
            </select>
          </Field>
          {settings.emailProvider === "SMTP" && (
            <>
              <Field label="SMTP Host">
                <input
                  value={settings.smtpHost}
                  onChange={(e) => update("smtpHost", e.target.value)}
                  placeholder="smtp.gmail.com"
                  className={inputCls}
                />
              </Field>
              <Field label="SMTP Port">
                <input
                  value={settings.smtpPort}
                  onChange={(e) => update("smtpPort", e.target.value)}
                  placeholder="587"
                  className={inputCls}
                />
              </Field>
              <Field label="SMTP User">
                <input
                  value={settings.smtpUser}
                  onChange={(e) => update("smtpUser", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="SMTP Passwort">
                <input
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => update("smtpPassword", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <button
                type="button"
                onClick={handleTestEmail}
                className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                Test-Mail senden
              </button>
              {testStatus && (
                <p className="text-sm text-gray-300 mt-1">{testStatus}</p>
              )}
            </>
          )}
        </Section>

        {/* Runner Schedule */}
        <Section title="Runner Zeitplan">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Outreach Runner</p>
                {settings.lastOutreachRunAt && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    Letzter Run: {new Date(settings.lastOutreachRunAt).toLocaleString("de-DE")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={settings.outreachRunnerTime}
                  onChange={(e) => update("outreachRunnerTime", e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm"
                />
                <Toggle
                  checked={settings.outreachRunnerEnabled}
                  onChange={(v) => update("outreachRunnerEnabled", v)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Journey Runner</p>
                {settings.lastJourneyRunAt && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    Letzter Run: {new Date(settings.lastJourneyRunAt).toLocaleString("de-DE")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={settings.journeyRunnerTime}
                  onChange={(e) => update("journeyRunnerTime", e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm"
                />
                <Toggle
                  checked={settings.journeyRunnerEnabled}
                  onChange={(v) => update("journeyRunnerEnabled", v)}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Send Limits */}
        <Section title="Versandlimits">
          <Field label="Max. Mails / Tag">
            <input
              type="number"
              value={settings.maxEmailsPerDay}
              onChange={(e) => update("maxEmailsPerDay", e.target.value)}
              placeholder="Kein Limit"
              min="0"
              className={inputCls}
            />
          </Field>
          <Field label="Max. Mails / Run">
            <input
              type="number"
              value={settings.maxEmailsPerRun}
              onChange={(e) => update("maxEmailsPerRun", e.target.value)}
              placeholder="Kein Limit"
              min="0"
              className={inputCls}
            />
          </Field>
          <Field label="Zufälliger Delay (3–15s)">
            <Toggle
              checked={settings.randomDelayEnabled}
              onChange={(v) => update("randomDelayEnabled", v)}
            />
          </Field>
        </Section>

        {/* Team */}
        <Section title="Team">
          <div className="space-y-2">
            {settings.members.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <p className="text-white text-sm">{m.email}</p>
                  {m.name && <p className="text-gray-500 text-xs">{m.name}</p>}
                </div>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            {saving ? "Speichere..." : "Einstellungen speichern"}
          </button>
          {saved && <span className="text-green-400 text-sm">✓ Gespeichert</span>}
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-white font-medium mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-gray-400 text-sm w-40 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition relative ${
        checked ? "bg-blue-600" : "bg-gray-700"
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
          checked ? "left-5" : "left-1"
        }`}
      />
    </button>
  );
}

const inputCls =
  "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
