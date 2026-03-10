"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/maps", label: "Maps Import", icon: "📍" },
  { href: "/outreach", label: "Outreach", icon: "✉️" },
  { href: "/pipeline", label: "Pipeline", icon: "📊" },
  { href: "/quotes", label: "Angebote", icon: "📄" },
  { href: "/invoices", label: "Rechnungen", icon: "🧾" },
  { href: "/clients", label: "Kunden", icon: "🏢" },
  { href: "/journeys", label: "Journeys", icon: "🗺️" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-800">
        <span className="text-white font-bold text-lg">OkunOS</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-4 border-t border-gray-800 space-y-0.5">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
            pathname.startsWith("/settings")
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <span>⚙️</span>
          Einstellungen
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          <span>→</span>
          Abmelden
        </button>
      </div>
    </aside>
  );
}
