"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TOTAL_STEPS = 6;

interface Sequence {
  id: string;
  name: string;
  stages: Array<{
    id: string;
    stepNumber: number;
    subject: string;
    body: string;
    delayDays: number;
  }>;
}

// Step indicator component
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">
          Schritt {current} von {total}
        </span>
        <span className="text-gray-400 text-sm">
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              step < current
                ? "bg-blue-600 text-white"
                : step === current
                ? "bg-blue-600 text-white ring-4 ring-blue-900"
                : "bg-gray-800 text-gray-500"
            }`}
          >
            {step < current ? "✓" : step}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 1: Willkommen
function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-6">👋</div>
      <h1 className="text-3xl font-bold text-white mb-4">Willkommen bei OkunOS!</h1>
      <p className="text-gray-400 text-lg mb-3 max-w-lg mx-auto">
        Wir führen dich in wenigen Schritten durch die Einrichtung deines Accounts.
      </p>
      <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">
        In den nächsten Minuten richtest du deinen Absender ein, lernst deine erste
        Outreach-Sequenz kennen und legst optional deinen ersten Lead an.
      </p>
      <button
        onClick={onNext}
        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-3.5 rounded-xl transition"
      >
        Weiter
      </button>
    </div>
  );
}

// Step 2: Absender-Einstellungen
function Step2({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.fromName) setSenderName(data.fromName);
        if (data.fromEmail) setSenderEmail(data.fromEmail);
      })
      .catch(() => {});
  }, []);

  async function handleNext() {
    if (!senderName.trim() || !senderEmail.trim()) {
      setError("Bitte fülle alle Felder aus.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromName: senderName, fromEmail: senderEmail }),
      });
      if (res.ok) {
        onNext();
      } else {
        setError("Fehler beim Speichern. Bitte versuche es erneut.");
      }
    } catch {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition";

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Absender-Einstellungen</h2>
      <p className="text-gray-400 mb-8">
        Diese Daten werden als Absender in deinen Outreach-E-Mails verwendet.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">
            Dein Name (Absender)
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Max Mustermann"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1.5">
            Deine E-Mail-Adresse
          </label>
          <input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="outreach@meine-agentur.de"
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600"
        >
          Zurück
        </button>
        <button
          onClick={handleNext}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-8 py-2.5 rounded-xl transition"
        >
          {saving ? "Speichere..." : "Weiter"}
        </button>
      </div>
    </div>
  );
}

// Step 3: Deine Standard-Sequenz
function Step3({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/outreach/sequences")
      .then((r) => r.json())
      .then((data) => {
        setSequences(Array.isArray(data) ? data : []);
      })
      .catch(() => setSequences([]))
      .finally(() => setLoading(false));
  }, []);

  const defaultSeq = sequences.find((s: any) => s.isDefault) || sequences[0];
  const previewSteps = defaultSeq?.stages?.slice(0, 2) || [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Deine Standard-Sequenz</h2>
      <p className="text-gray-400 mb-8">
        Beim Registrieren wurde automatisch eine Outreach-Sequenz für dich erstellt.
      </p>

      {loading ? (
        <div className="text-gray-500 py-8 text-center">Lade Sequenzen...</div>
      ) : !defaultSeq ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400">Keine Sequenz gefunden.</p>
          <Link
            href="/outreach/sequences"
            className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm transition"
          >
            Neue Sequenz erstellen →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{defaultSeq.name}</h3>
              <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                {defaultSeq.stages?.length || 0} Schritte
              </span>
            </div>

            {previewSteps.length > 0 ? (
              <div className="space-y-3">
                {previewSteps.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-500 text-xs">
                        Schritt {idx + 1}
                        {stage.delayDays > 0 && ` · nach ${stage.delayDays} Tag(en)`}
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium mb-1">{stage.subject}</p>
                    <p className="text-gray-400 text-xs line-clamp-2">
                      {stage.body?.replace(/<[^>]*>/g, "").substring(0, 100)}
                      {(stage.body?.replace(/<[^>]*>/g, "") || "").length > 100 ? "..." : ""}
                    </p>
                  </div>
                ))}
                {(defaultSeq.stages?.length || 0) > 2 && (
                  <p className="text-gray-500 text-xs text-center">
                    +{(defaultSeq.stages?.length || 0) - 2} weitere Schritte
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Diese Sequenz hat noch keine Schritte.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600"
        >
          Zurück
        </button>
        {defaultSeq && (
          <Link
            href="/outreach/sequences"
            className="text-blue-400 hover:text-blue-300 transition px-4 py-2.5 rounded-lg border border-blue-900 hover:border-blue-700 text-sm"
          >
            Sequenz anpassen
          </Link>
        )}
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-2.5 rounded-xl transition"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}

// Step 4: Ersten Lead anlegen
function Step4({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [firma, setFirma] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inputCls =
    "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition";

  async function handleSubmit() {
    if (!firma.trim()) {
      setError("Firmenname ist erforderlich.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firma, email, website }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => onNext(), 1200);
      } else {
        const data = await res.json();
        setError(data.error || "Fehler beim Anlegen des Leads.");
      }
    } catch {
      setError("Fehler beim Anlegen des Leads.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Ersten Lead anlegen</h2>
      <p className="text-gray-400 mb-8">
        Leg deinen ersten Lead an, um OkunOS auszuprobieren. Du kannst diesen Schritt auch
        überspringen.
      </p>

      {success ? (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-green-400 font-medium">Lead erfolgreich angelegt!</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">
              Firma <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={firma}
              onChange={(e) => setFirma(e.target.value)}
              placeholder="Musterfirma GmbH"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kontakt@musterfirma.de"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://musterfirma.de"
              className={inputCls}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600"
        >
          Zurück
        </button>
        <button
          onClick={onNext}
          className="text-gray-400 hover:text-white transition px-4 py-2.5 text-sm"
        >
          Überspringen
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || success}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-8 py-2.5 rounded-xl transition ml-auto"
        >
          {saving ? "Speichere..." : "Lead anlegen"}
        </button>
      </div>
    </div>
  );
}

// Step 5: Runner-Einstellungen
function Step5({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [outreachEnabled, setOutreachEnabled] = useState(false);
  const [outreachTime, setOutreachTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.outreachRunnerEnabled !== undefined)
          setOutreachEnabled(data.outreachRunnerEnabled);
        if (data.outreachRunnerTime) setOutreachTime(data.outreachRunnerTime);
      })
      .catch(() => {});
  }, []);

  async function handleNext() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outreachRunnerEnabled: outreachEnabled,
          outreachRunnerTime: outreachTime,
        }),
      });
      if (res.ok) {
        onNext();
      } else {
        setError("Fehler beim Speichern. Bitte versuche es erneut.");
      }
    } catch {
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Runner-Einstellungen</h2>
      <p className="text-gray-400 mb-8">
        Aktiviere den automatischen Outreach-Runner, damit OkunOS täglich E-Mails versendet.
      </p>

      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-medium">Automatischen Outreach aktivieren</p>
              <p className="text-gray-500 text-sm mt-0.5">
                OkunOS sendet täglich zur eingestellten Uhrzeit E-Mails an deine Leads.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOutreachEnabled((v) => !v)}
              className={`w-12 h-7 rounded-full transition relative shrink-0 ${
                outreachEnabled ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-1.5 w-4 h-4 rounded-full bg-white transition-all ${
                  outreachEnabled ? "left-7" : "left-1.5"
                }`}
              />
            </button>
          </div>

          {outreachEnabled && (
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">
                Uhrzeit für täglichen Versand (HH:MM)
              </label>
              <input
                type="time"
                value={outreachTime}
                onChange={(e) => setOutreachTime(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          )}
        </div>

        <p className="text-gray-500 text-sm">
          Du kannst diese Einstellungen jederzeit unter{" "}
          <Link href="/settings" className="text-blue-400 hover:underline">
            Einstellungen
          </Link>{" "}
          anpassen.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600"
        >
          Zurück
        </button>
        <button
          onClick={handleNext}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-8 py-2.5 rounded-xl transition"
        >
          {saving ? "Speichere..." : "Weiter"}
        </button>
      </div>
    </div>
  );
}

// Step 6: Fertig!
function Step6({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    // Mark onboarding as done
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingDone: true }),
    }).catch(() => {});
  }, []);

  function handleDashboard() {
    setFinishing(true);
    router.push("/dashboard");
  }

  return (
    <div className="text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-3xl font-bold text-white mb-4">Alles eingerichtet!</h2>
      <p className="text-gray-400 text-lg mb-3 max-w-lg mx-auto">
        Du hast OkunOS erfolgreich eingerichtet. Zeit, die erste Kampagne zu starten!
      </p>
      <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">
        Füge weitere Leads hinzu, passe deine Sequenzen an und beobachte, wie deine Pipeline wächst.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto text-left">
        {[
          {
            icon: "🎯",
            title: "Leads importieren",
            desc: "Lade deine Kontakte als CSV hoch oder nutze den Scraper.",
            href: "/leads",
          },
          {
            icon: "✉️",
            title: "Outreach starten",
            desc: "Enrolle Leads in deine Sequenz und starte den Runner.",
            href: "/outreach",
          },
          {
            icon: "📊",
            title: "Pipeline verwalten",
            desc: "Verfolge deine Deals im Kanban-Board.",
            href: "/pipeline",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-white text-sm font-medium mb-1">{item.title}</p>
            <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600"
        >
          Zurück
        </button>
        <button
          onClick={handleDashboard}
          disabled={finishing}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-10 py-3.5 rounded-xl transition text-base"
        >
          {finishing ? "Weiterleiten..." : "Zum Dashboard"}
        </button>
      </div>
    </div>
  );
}

// Main onboarding page
export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  function next() {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <span className="text-xl font-bold text-white">OkunOS</span>
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-medium">
            Setup
          </span>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={currentStep} total={TOTAL_STEPS} />

        {/* Step Content */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {currentStep === 1 && <Step1 onNext={next} />}
          {currentStep === 2 && <Step2 onNext={next} onBack={back} />}
          {currentStep === 3 && <Step3 onNext={next} onBack={back} />}
          {currentStep === 4 && <Step4 onNext={next} onBack={back} />}
          {currentStep === 5 && <Step5 onNext={next} onBack={back} />}
          {currentStep === 6 && <Step6 onBack={back} />}
        </div>
      </div>
    </div>
  );
}
