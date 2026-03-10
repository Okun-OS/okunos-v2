import Link from "next/link";

const featureSections = [
  {
    id: "lead-generation",
    icon: "🎯",
    title: "Lead Generation",
    subtitle: "Neue Kontakte auf Knopfdruck",
    description:
      "Fülle deine Pipeline mit qualifizierten Leads – manuell oder vollautomatisch. OkunOS bietet dir drei leistungsstarke Wege zur Lead-Generierung.",
    features: [
      {
        name: "CSV Import",
        desc: "Lade bestehende Kontaktlisten als CSV hoch und importiere sie in Sekunden. Automatische Feldzuordnung und Duplikat-Erkennung inklusive.",
      },
      {
        name: "Website Scraper",
        desc: "Extrahiere Kontaktdaten direkt von Websites. Gib eine Domain ein und OkunOS findet E-Mail-Adressen, Ansprechpartner und Unternehmensdaten.",
      },
      {
        name: "Google Maps Scraper",
        desc: "Suche nach Unternehmen in Google Maps und importiere deren Kontaktdaten automatisch. Ideal für lokale Akquise mit Branche und Region.",
      },
    ],
  },
  {
    id: "outreach-automation",
    icon: "✉️",
    title: "Outreach Automation",
    subtitle: "Automatisierte Sequenzen, die konvertieren",
    description:
      "Sende personalisierte E-Mail-Sequenzen an Hunderte von Leads gleichzeitig – ohne Spam-Risiko. OkunOS steuert Timing, Personalisierung und Follow-ups automatisch.",
    features: [
      {
        name: "Multi-Step Sequenzen",
        desc: "Erstelle mehrstufige E-Mail-Kampagnen mit beliebig vielen Follow-up-Schritten. Jeder Schritt hat eigenen Betreff, Text und konfigurierbaren Versand-Delay.",
      },
      {
        name: "Smart Sending",
        desc: "OkunOS sendet E-Mails zum optimalen Zeitpunkt, hält Versandlimits ein und fügt automatische Delays zwischen Mails ein, um Spam-Filter zu umgehen.",
      },
      {
        name: "Personalisierung",
        desc: "Nutze dynamische Variablen wie {{firma}}, {{name}} oder {{website}} für hochpersonalisierte Nachrichten, die sich wie individuelle E-Mails anfühlen.",
      },
    ],
  },
  {
    id: "pipeline-crm",
    icon: "📊",
    title: "Pipeline & CRM",
    subtitle: "Deals von der Kontaktaufnahme bis zum Abschluss",
    description:
      "Verwalte all deine Verkaufschancen in einem übersichtlichen Kanban-Board. Behalte den Überblick über jede Phase und schließe mehr Deals.",
    features: [
      {
        name: "Kanban Board",
        desc: "Ziehe Deals per Drag & Drop zwischen Phasen. Vom ersten Kontakt über Angebot bis zum gewonnenen oder verlorenen Deal – alles auf einen Blick.",
      },
      {
        name: "Deal-Management",
        desc: "Erfasse Dealwert, Notizen, Aktivitäten und zugehörige Dokumente direkt am Deal. Verknüpfe Angebote, Rechnungen und Leads automatisch.",
      },
      {
        name: "Abschluss-Tracking",
        desc: "Verfolge deine Gewinn- und Verlustquoten, durchschnittliche Dealwerte und Abschlusszeiten mit integrierten Reports.",
      },
    ],
  },
  {
    id: "quotes-invoices",
    icon: "📄",
    title: "Quotes & Invoices",
    subtitle: "Professionelle Angebote und Rechnungen",
    description:
      "Erstelle Angebote und Rechnungen in Sekunden – mit automatischer Nummerierung, PDF-Export und direktem E-Mail-Versand aus OkunOS heraus.",
    features: [
      {
        name: "Auto-Nummerierung",
        desc: "Angebots- und Rechnungsnummern werden automatisch nach deinem Schema vergeben. Kein manuelles Hochzählen mehr.",
      },
      {
        name: "PDF Export",
        desc: "Generiere professionelle PDFs mit deinem Branding. Lade sie herunter oder versende sie direkt per E-Mail an deine Kunden.",
      },
      {
        name: "E-Mail Versand",
        desc: "Sende Angebote und Rechnungen direkt aus OkunOS per E-Mail. Verfolge, ob der Kunde das Dokument geöffnet hat.",
      },
    ],
  },
  {
    id: "customer-journey",
    icon: "🗺️",
    title: "Customer Journey",
    subtitle: "Automatisierte Kunden-Onboardings",
    description:
      "Führe neue Kunden mit automatisierten E-Mail-Journeys durch ihr Onboarding. Definiere Sequenzen, die automatisch zum richtigen Zeitpunkt ausgelöst werden.",
    features: [
      {
        name: "Automatische Follow-ups",
        desc: "Erstelle Journeys mit mehreren Schritten, die automatisch nach definierten Zeitabständen versendet werden.",
      },
      {
        name: "Kunden-Segmentierung",
        desc: "Weise Kunden unterschiedlichen Journeys zu, basierend auf ihrem Status, Produkt oder individuellem Onboarding-Bedarf.",
      },
      {
        name: "Journey Tracking",
        desc: "Sieh genau, in welchem Schritt sich jeder Kunde befindet und welche E-Mails bereits versendet wurden.",
      },
    ],
  },
  {
    id: "analytics",
    icon: "📈",
    title: "Analytics & Reports",
    subtitle: "Entscheidungen auf Datenbasis",
    description:
      "Verstehe, was in deiner Agentur wirklich passiert. OkunOS liefert dir alle wichtigen Kennzahlen zu Leads, Outreach, Pipeline und Umsatz.",
    features: [
      {
        name: "Outreach-Statistiken",
        desc: "Öffnungsraten, Klickraten, Antwortquoten und Bounce-Raten für jede Sequenz und jeden Schritt.",
      },
      {
        name: "Pipeline-Reports",
        desc: "Dealwert pro Phase, Conversion-Rates und durchschnittliche Abschlusszeiten – immer aktuell.",
      },
      {
        name: "Aktivitäts-Log",
        desc: "Vollständiges Aktivitätsprotokoll für alle Aktionen im System. Behalte den Überblick über dein Team und alle Vorgänge.",
      },
    ],
  },
];

export default function FeaturesPage() {
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
          <Link href="/features" className="text-white font-medium">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-white transition">
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
          Alle Features
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
          Alles in einem System
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          OkunOS vereint Lead-Generierung, Outreach, CRM, Angebote, Rechnungen und Customer
          Journeys in einer einzigen Plattform – gebaut für digitale Agenturen.
        </p>
      </section>

      {/* Feature Sections */}
      <section className="max-w-6xl mx-auto px-6 pb-24 space-y-20">
        {featureSections.map((section, idx) => (
          <div
            key={section.id}
            className={`flex flex-col ${
              idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
            } gap-12 items-start`}
          >
            {/* Left/Right: Info */}
            <div className="flex-1">
              <div className="text-4xl mb-4">{section.icon}</div>
              <h2 className="text-2xl font-bold text-white mb-2">{section.title}</h2>
              <p className="text-blue-400 font-medium mb-4">{section.subtitle}</p>
              <p className="text-gray-400 leading-relaxed mb-8">{section.description}</p>
              <Link
                href="/register"
                className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
              >
                Jetzt starten
              </Link>
            </div>

            {/* Right/Left: Feature Cards */}
            <div className="flex-1 space-y-4">
              {section.features.map((f) => (
                <div
                  key={f.name}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
                >
                  <h3 className="text-white font-semibold mb-2">{f.name}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 py-20 text-center px-6">
        <h2 className="text-3xl font-bold text-white mb-4">Bereit loszulegen?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Starte noch heute kostenlos und bringe deine Agentur auf das nächste Level.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl text-base transition inline-block"
          >
            Jetzt kostenlos starten
          </Link>
          <Link
            href="/pricing"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium px-10 py-4 rounded-xl text-base transition inline-block"
          >
            Preise ansehen
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
