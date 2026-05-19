"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const [isClub, setIsClub] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token) {
      return;
    }

    if (role === "club") {
      router.replace("/club/dashboard");
      return;
    }

    if (role === "player") {
      router.replace("/player/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("userRole", response.user.role);
        localStorage.setItem("userId", response.user.id);

        if (response.user.role === "club") {
          router.push("/club/dashboard");
        } else {
          router.push("/player/dashboard");
        }
      }
    } catch (err) {
      setError((err as Error).message || "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-900 mb-2">
            Match your Club
          </h1>
          <p className="text-neutral-600">Finde deinen passenden Verein</p>
        </div>

        {/* Toggle */}
        <div className="mb-8 flex items-center justify-center gap-4 bg-white rounded-lg p-2 shadow-sm border border-neutral-200">
          <button
            onClick={() => setIsClub(false)}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
              !isClub
                ? "bg-green-500 text-white"
                : "bg-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            🎮 Spieler
          </button>
          <button
            onClick={() => setIsClub(true)}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
              isClub
                ? "bg-green-500 text-white"
                : "bg-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            ⚽ Club
          </button>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-lg shadow-md p-8 border border-neutral-200"
        >
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            {isClub ? "Club-Anmeldung" : "Spieler-Anmeldung"}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-neutral-400 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-neutral-600">
          Noch kein Account?{" "}
          <Link
            href="/register"
            className="text-green-600 font-semibold hover:underline"
          >
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
