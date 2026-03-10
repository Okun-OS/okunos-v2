"use client";

import { useState } from "react";

export default function InvoiceActions({
  invoiceId,
  status,
  email,
}: {
  invoiceId: string;
  status: string;
  email: string;
}) {
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    if (!email) return alert("Keine E-Mail-Adresse");
    setSending(true);
    const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
    const data = await res.json();
    setMsg(data.ok ? "✓ Gesendet" : `✗ ${data.error}`);
    setSending(false);
  }

  async function markPaid() {
    setMarking(true);
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    setMsg("✓ Als bezahlt markiert");
    setMarking(false);
  }

  return (
    <>
      {status !== "PAID" && (
        <>
          <button
            onClick={send}
            disabled={sending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "Sende..." : "Per E-Mail senden"}
          </button>
          <button
            onClick={markPaid}
            disabled={marking}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
          >
            Als bezahlt markieren
          </button>
        </>
      )}
      {msg && <span className="text-sm text-gray-600">{msg}</span>}
    </>
  );
}
