"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Ungültige E-Mail oder Passwort");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">OkunOS</h1>
          <p className="text-gray-400 mt-2">Agency Operating System</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Anmelden</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="deine@email.de"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition"
            >
              {loading ? "Anmelden..." : "Anmelden"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Noch kein Account?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300">
              Kostenlos registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
