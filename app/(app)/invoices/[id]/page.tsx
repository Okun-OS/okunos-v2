import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import InvoiceActions from "./InvoiceActions";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const wsId = (session.user as any).workspaceId as string;

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, workspaceId: wsId },
    include: { workspace: true },
  });
  if (!invoice) notFound();

  const ws = invoice.workspace;
  const items = invoice.items as Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;

  const vatRate = invoice.vatRate;
  const net = invoice.totalAmount;
  const vat = invoice.taxMode === "MWST" ? net * vatRate : 0;
  const gross = net + vat;

  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto print:p-4">
      {/* Print controls - hidden in print */}
      <div className="print:hidden mb-6 flex gap-3">
        <a href="/invoices" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Zurück
        </a>
        <InvoiceActions invoiceId={invoice.id} status={invoice.status} email={invoice.customerEmail || ""} />
        <button
          onClick={() => window.print()}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
        >
          PDF speichern
        </button>
      </div>

      {/* Invoice */}
      <div className="bg-white text-gray-900">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-bold">RECHNUNG</h1>
            <p className="text-gray-500 mt-1 font-mono">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p className="font-semibold text-gray-900">
              {ws.fromName || ws.name}
            </p>
            {ws.fromEmail && <p>{ws.fromEmail}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">An</p>
            <p className="font-medium">{invoice.customerName}</p>
            {invoice.contactLine && <p className="text-gray-600 text-sm">{invoice.contactLine}</p>}
            {invoice.customerEmail && <p className="text-gray-600 text-sm">{invoice.customerEmail}</p>}
          </div>
          <div className="text-right">
            <div className="space-y-1 text-sm">
              <div className="flex justify-end gap-4">
                <span className="text-gray-500">Rechnungsdatum:</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString("de-DE")}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-end gap-4">
                  <span className="text-gray-500">Zahlungsziel:</span>
                  <span>{new Date(invoice.dueDate).toLocaleDateString("de-DE")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium text-sm">Leistung</th>
              <th className="text-right py-2 text-gray-500 font-medium text-sm">Menge</th>
              <th className="text-right py-2 text-gray-500 font-medium text-sm">Einzelpreis</th>
              <th className="text-right py-2 text-gray-500 font-medium text-sm">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 text-sm">{item.description}</td>
                <td className="py-3 text-sm text-right">{item.quantity}</td>
                <td className="py-3 text-sm text-right">
                  {item.unitPrice.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </td>
                <td className="py-3 text-sm text-right font-medium">
                  {(item.quantity * item.unitPrice).toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            {invoice.taxMode === "MWST" && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Netto</span>
                  <span>{net.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">MwSt ({Math.round(vatRate * 100)}%)</span>
                  <span>{vat.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
              <span>Gesamtbetrag</span>
              <span>{gross.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

        {invoice.taxMode === "KLEINUNTERNEHMER" && (
          <p className="text-xs text-gray-500 mb-6">
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
          </p>
        )}

        {/* Payment info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Zahlungsinformationen</p>
          <p className="text-gray-500">
            Bitte Zahlungsdaten in Einstellungen hinterlegen
          </p>
        </div>

        {invoice.notes && (
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Hinweise
            </p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
