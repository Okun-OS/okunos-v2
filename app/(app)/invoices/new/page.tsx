"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");
  const clientId = searchParams.get("clientId");

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    contactLine: "",
    dueDate: "",
    taxMode: "NONE",
    notes: "",
    dealId: dealId || "",
    clientId: clientId || "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dealId) {
      fetch(`/api/pipeline/${dealId}`)
        .then((r) => r.json())
        .then((deal) => {
          if (deal?.firma) {
            setForm((f) => ({
              ...f,
              customerName: deal.firma,
              customerEmail: deal.email || "",
              contactLine:
                deal.anrede && deal.nachname
                  ? `${deal.anrede} ${deal.nachname}`
                  : "",
            }));
          }
        });
    }
  }, [dealId]);

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items, totalAmount: total }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/invoices/${data.id}`);
    } else {
      alert(data.error || "Fehler");
      setLoading(false);
    }
  }

  function updateItem(i: number, field: keyof LineItem, value: any) {
    setItems((items) => {
      const copy = [...items];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-8">Neue Rechnung</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium">Kundendaten</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Firmenname">
              <input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className={cls}
                required
              />
            </Field>
            <Field label="E-Mail">
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className={cls}
              />
            </Field>
            <Field label="Ansprechpartner">
              <input
                value={form.contactLine}
                onChange={(e) => setForm({ ...form, contactLine: e.target.value })}
                className={cls}
                placeholder="Herr Müller"
              />
            </Field>
            <Field label="Zahlungsziel">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={cls}
              />
            </Field>
          </div>
          <Field label="Steuer-Modus">
            <select
              value={form.taxMode}
              onChange={(e) => setForm({ ...form, taxMode: e.target.value })}
              className={cls}
            >
              <option value="NONE">Keine Steuer</option>
              <option value="KLEINUNTERNEHMER">Kleinunternehmer (§19 UStG)</option>
              <option value="MWST">MwSt (19%)</option>
            </select>
          </Field>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-medium mb-4">Positionen</h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Leistungsbeschreibung"
                    className={cls}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                    placeholder="Menge"
                    min="0"
                    step="0.01"
                    className={cls}
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    placeholder="Preis €"
                    min="0"
                    step="0.01"
                    className={cls}
                  />
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300 px-2 py-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])}
            className="mt-3 text-sm text-blue-400 hover:text-blue-300"
          >
            + Position hinzufügen
          </button>
          <div className="mt-4 text-right text-white font-medium">
            Gesamt: {total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <Field label="Notizen">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className={cls}
            />
          </Field>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium"
          >
            {loading ? "Erstelle..." : "Rechnung erstellen"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white px-4 py-2.5"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-400 text-sm mb-1">{label}</label>
      {children}
    </div>
  );
}

const cls =
  "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
