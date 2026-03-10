import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "49",
    period: "mo",
    description: "Perfekt für Solo-Freelancer und kleine Agenturen, die mit Outreach starten.",
    highlighted: false,
    features: [
      { text: "2.000 Leads", available: true },
      { text: "100 E-Mails / Tag", available: true },
      { text: "1 Benutzer", available: true },
      { text: "1 Outreach-Sequenz", available: true },
      { text: "1 Customer Journey", available: true },
      { text: "CSV Import", available: true },
      { text: "Pipeline & CRM", available: true },
      { text: "Angebote & Rechnungen", available: true },
      { text: "Google Maps Scraper", available: false },
      { text: "Unbegrenzte Sequenzen", available: false },
      { text: "Autopilot Lead Engine", available: false },
      { text: "White-Label", available: false },
      { text: "API-Zugang", available: false },
    ],
  },
  {
    name: "Pro",
    price: "99",
    period: "mo",
    description: "Für wachsende Agenturen mit mehreren Mitarbeitern und hohem Outreach-Volumen.",
    highlighted: true,
    features: [
      { text: "20.000 Leads", available: true },
      { text: "500 E-Mails / Tag", available: true },
      { text: "5 Benutzer", available: true },
      { text: "Unbegrenzte Sequenzen", available: true },
      { text: "Unbegrenzte Journeys", available: true },
      { text: "CSV Import", available: true },
      { text: "Pipeline & CRM", available: true },
      { text: "Angebote & Rechnungen", available: true },
      { text: "Google Maps Scraper", available: true },
      { text: "Autopilot Lead Engine", available: false },
      { text: "White-Label", available: false },
      { text: "API-Zugang", available: false },
    ],
  },
  {
    name: "Agency",
    price: "199",
    period: "mo",
    description:
      "Für professionelle Agenturen, die OkunOS im eigenen Namen anbieten oder vollständig automatisieren wollen.",
    highlighted: false,
    features: [
      { text: "Unbegrenzte Leads", available: true },
      { text: "Unbegrenzte E-Mails / Tag", available: true },
      { text: "Unbegrenzte Benutzer", available: true },
      { text: "Unbegrenzte Sequenzen", available: true },
      { text: "Unbegrenzte Journeys", available: true },
      { text: "CSV Import", available: true },
      { text: "Pipeline & CRM", available: true },
      { text: "Angebote & Rechnungen", available: true },
      { text: "Google Maps Scraper", available: true },
      { text: "Autopilot Lead Engine", available: true },
      { text: "White-Label", available: true },
      { text: "API-Zugang", available: true },
    ],
  },
];

const faqs = [
  {
    q: "Gibt es eine kostenlose Testphase?",
    a: "Ja! Du kannst OkunOS kostenlos starten und die wichtigsten Features testen. Keine Kreditkarte erforderlich.",
  },
  {
    q: "Kann ich meinen Plan jederzeit wechseln?",
    a: "Ja, du kannst jederzeit upgraden oder downgraden. Änderungen werden sofort wirksam und Guthaben wird anteilig verrechnet.",
  },
  {
    q: "Was ist der Autopilot Lead Engine?",
    a: "Der Autopilot Lead Engine sucht täglich automatisch nach neuen Leads in deiner Zielgruppe und fügt sie deiner Pipeline hinzu – ohne manuelle Arbeit.",
  },
  {
    q: "Was bedeutet White-Label?",
    a: "Im Agency Plan kannst du OkunOS mit deinem eigenen Logo, deinen Farben und deiner Domain betreiben und es deinen Kunden als eigenes Produkt anbieten.",
  },
];

export default function PricingPage() {
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
          <Link href="/pricing" className="text-white font-medium">
            Preise
          </Link>
          <Link href="/demo" className="hover:text-white transition">
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
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-blue-900/50 border border-blue-800 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          Transparente Preise
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
          Einfache Preise, klarer Mehrwert
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Wähle den Plan, der zu deiner Agentur passt. Alle Pläne beinhalten die wichtigsten
          Features – ohne versteckte Kosten.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-blue-600 border-2 border-blue-500 shadow-xl shadow-blue-900/30"
                  : "bg-gray-900 border border-gray-800"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-white text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full">
                    Beliebtester Plan
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2
                  className={`text-lg font-bold mb-1 ${
                    plan.highlighted ? "text-white" : "text-white"
                  }`}
                >
                  {plan.name}
                </h2>
                <div className="flex items-end gap-1 mb-3">
                  <span
                    className={`text-4xl font-bold ${
                      plan.highlighted ? "text-white" : "text-white"
                    }`}
                  >
                    €{plan.price}
                  </span>
                  <span
                    className={`text-sm mb-1.5 ${
                      plan.highlighted ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    /{plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm leading-relaxed ${
                    plan.highlighted ? "text-blue-100" : "text-gray-400"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    <span
                      className={`shrink-0 text-sm ${
                        f.available
                          ? plan.highlighted
                            ? "text-white"
                            : "text-blue-400"
                          : plan.highlighted
                          ? "text-blue-400/50"
                          : "text-gray-600"
                      }`}
                    >
                      {f.available ? "✓" : "✗"}
                    </span>
                    <span
                      className={`text-sm ${
                        f.available
                          ? plan.highlighted
                            ? "text-white"
                            : "text-gray-300"
                          : plan.highlighted
                          ? "text-blue-200/50"
                          : "text-gray-600"
                      }`}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block text-center font-semibold py-3 rounded-xl transition ${
                  plan.highlighted
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                Jetzt starten
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          Häufige Fragen
        </h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 py-20 text-center px-6">
        <h2 className="text-3xl font-bold text-white mb-4">Noch Fragen?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Buch dir eine persönliche Demo und lass dich von uns durch OkunOS führen.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl text-base transition inline-block"
          >
            Jetzt kostenlos starten
          </Link>
          <Link
            href="/demo"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium px-10 py-4 rounded-xl text-base transition inline-block"
          >
            Demo buchen
          </Link>
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
