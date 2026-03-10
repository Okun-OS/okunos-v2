"use client";

import Link from "next/link";
import { useState } from "react";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update(key: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/demo/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold text-white">
            OkunOS
          </Link>
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full font-medium">
            Beta
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/features" className="hover:text-white transition">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-white transition">
            Preise
          </Link>
          <Link href="/demo" className="text-white font-medium">
            Demo
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-gray-300 hover:text-white text-sm transition px-4 py-2"
          >
            Anmelden
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Kostenlos starten
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-block bg-blue-900/50 border border-blue-800 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          Persönliche Demo
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
          Sieh OkunOS in Aktion
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Lass dich in einer persönlichen Demo durch OkunOS führen. Wir zeigen dir, wie du
          Leads generierst, Outreach automatisierst und mehr Deals abschließt – in 30 Minuten.
        </p>
      </section>

      {/* Content Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Calendar Embed Placeholder */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Demo anfragen</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-80">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="text-white font-semibold text-lg mb-2">Demo anfragen</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs">
                Wähle einen Termin für deine persönliche OkunOS-Demo. Unsere Kalender-Integration
                wird hier eingebettet.
              </p>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 w-full">
                <p className="text-gray-500 text-xs font-mono">
                  {/* Calendly or Cal.com embed goes here */}
                  Kalender-Widget (Calendly / Cal.com)
                </p>
              </div>
              <p className="text-gray-500 text-xs mt-4">
                Du kannst uns auch direkt per E-Mail kontaktieren:{" "}
                <a
                  href="mailto:demo@okunos.com"
                  className="text-blue-400 hover:underline"
                >
                  demo@okunos.com
                </a>
              </p>
            </div>

            {/* What to expect */}
            <div className="mt-6 space-y-3">
              {[
                { icon: "⏱️", text: "30 Minuten persönliche Demo" },
                { icon: "🎯", text: "Individuelle Fragen werden beantwortet" },
                { icon: "🚀", text: "Setup-Support nach der Demo" },
                { icon: "💬", text: "Kein Verkaufsdruck" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-gray-300 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Oder schreib uns</h2>

            {submitted ? (
              <div className="bg-green-900/30 border border-green-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-80">
                <div className="text-5xl mb-4">✓</div>
                <h3 className="text-white font-semibold text-lg mb-2">Nachricht gesendet!</h3>
                <p className="text-gray-400 text-sm">
                  Wir haben deine Anfrage erhalten und melden uns innerhalb von 24 Stunden bei dir.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5"
              >
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">
                    Dein Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="max@agentur.de"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">
                    Unternehmen
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => update("company", e.target.value)}
                    placeholder="Meine Agentur GmbH"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">
                    Nachricht
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Ich würde gerne mehr über OkunOS erfahren..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
                >
                  {submitting ? "Wird gesendet..." : "Nachricht senden"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center">
        <p className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} OkunOS. Alle Rechte vorbehalten.
        </p>
      </footer>
    </div>
  );
}
