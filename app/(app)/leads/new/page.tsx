"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firma: "",
    email: "",
    telefon: "",
    website: "",
    quelle: "",
    anrede: "",
    nachname: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firma.trim()) {
      setError("Firma ist ein Pflichtfeld.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Erstellen des Leads.");
      }

      router.push("/leads");
    } catch (err: any) {
      setError(err.message ?? "Unbekannter Fehler.");
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
        <h1 className="text-2xl font-bold text-white">Neuer Lead</h1>
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

        {/* Firma */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Firma <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="firma"
            value={form.firma}
            onChange={handleChange}
            required
            placeholder="GmbH & Co. KG"
            className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Anrede + Nachname */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Anrede
            </label>
            <select
              name="anrede"
              value={form.anrede}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Keine Angabe</option>
              <option value="Herr">Herr</option>
              <option value="Frau">Frau</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nachname
            </label>
            <input
              type="text"
              name="nachname"
              value={form.nachname}
              onChange={handleChange}
              placeholder="Mustermann"
              className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* E-Mail */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            E-Mail
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="info@beispiel.de"
            className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Telefon
          </label>
          <input
            type="tel"
            name="telefon"
            value={form.telefon}
            onChange={handleChange}
            placeholder="+49 123 456789"
            className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Website
          </label>
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="https://beispiel.de"
            className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Quelle */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Quelle
          </label>
          <input
            type="text"
            name="quelle"
            value={form.quelle}
            onChange={handleChange}
            placeholder="z.B. Messe, LinkedIn, Website"
            className="w-full bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/leads"
            className="text-gray-400 hover:text-white text-sm transition px-4 py-2"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-6 rounded-lg transition"
          >
            {loading ? "Speichern..." : "Lead erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
