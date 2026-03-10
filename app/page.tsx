import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const features = [
  {
    title: "Leads",
    desc: "Leads importieren, verwalten und mit einem Klick in die Outreach-Pipeline aufnehmen.",
    icon: "🎯",
  },
  {
    title: "Outreach",
    desc: "Automatisierte E-Mail-Sequenzen mit Follow-ups. Personalisiert, skalierbar, messbar.",
    icon: "✉️",
  },
  {
    title: "Pipeline",
    desc: "Deals verfolgen von der ersten Kontaktaufnahme bis zum Abschluss.",
    icon: "📊",
  },
  {
    title: "Angebote",
    desc: "Professionelle Angebote erstellen, versenden und als PDF herunterladen.",
    icon: "📄",
  },
  {
    title: "Rechnungen",
    desc: "Rechnungen erstellen, verwalten und den Zahlungsstatus im Blick behalten.",
    icon: "💶",
  },
  {
    title: "Customer Journeys",
    desc: "Kunden mit automatisierten E-Mail-Sequenzen durch ihren Onboarding-Prozess führen.",
    icon: "🗺️",
  },
];

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">OkunOS</span>
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
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-block bg-blue-900/50 border border-blue-800 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          Agency Operating System
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          OkunOS &mdash;
          <br />
          <span className="text-blue-400">Dein Agenturbetrieb</span>
          <br />
          auf Autopilot
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Leads generieren, Outreach automatisieren, Deals abschließen, Rechnungen stellen &mdash;
          alles in einem System, gebaut für digitale Agenturen.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition"
          >
            Kostenlos starten
          </Link>
          <Link
            href="/login"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium px-8 py-3.5 rounded-xl text-base transition"
          >
            Anmelden
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Alles was du brauchst</h2>
          <p className="text-gray-400">
            Von der Lead-Generierung bis zur Rechnung &mdash; komplett integriert.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 py-20 text-center px-6">
        <h2 className="text-3xl font-bold text-white mb-4">Bereit loszulegen?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Starte noch heute kostenlos und bringe deine Agentur auf das nächste Level.
        </p>
        <Link
          href="/register"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl text-base transition inline-block"
        >
          Jetzt kostenlos starten
        </Link>
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
