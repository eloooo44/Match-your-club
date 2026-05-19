"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ClubNav from "@/src/components/ClubNav";
import { mediaUrl } from "@/src/lib/media";
import { apiFetch } from "@/services/api";

import { API_BASE } from "@/src/lib/apiBase";

type ClubProfile = {
  id: number;
  clubName: string;
  verband: string;
  wettbewerb: string;
  league: string;
  location: string;
  oefbClubProfileUrl?: string | null;
  leagueTableData?: {
    headers: string[];
    rows: string[][];
    sourceUrl: string;
    tableUrl: string;
    crawledAt: string;
  } | null;
  description?: string | null;
  logoPath?: string | null;
};

type PlayerResult = {
  id: number;
  name: string;
  position: string[];
  location: string;
  openToPlay: boolean;
  verified: boolean;
  clubFitPercent: number | null;
  overallScore: number;
  attributes: {
    tempo: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  } | null;
};

type ClubDashboardData = {
  club: ClubProfile;
  counts: {
    matchingPlayers: number;
    highFitPlayers: number;
    verifiedPlayers: number;
    openToPlayPlayers: number;
    applications: number;
    trialTrainings: number;
    requirements: number;
  };
  topMatches: PlayerResult[];
};

const emptyDashboard: Omit<ClubDashboardData, "club"> = {
  counts: {
    matchingPlayers: 0,
    highFitPlayers: 0,
    verifiedPlayers: 0,
    openToPlayPlayers: 0,
    applications: 0,
    trialTrainings: 0,
    requirements: 0,
  },
  topMatches: [],
};

const statCards = [
  {
    key: "matchingPlayers",
    label: "Matching Spieler",
    description: "Spieler mit Club-Fit Score",
  },
  {
    key: "highFitPlayers",
    label: "Top-Fit (>=70%)",
    description: "Besonders passende Kandidaten",
  },
  {
    key: "openToPlayPlayers",
    label: "Wechselbereit",
    description: "Aktiv wechselbereite Spieler",
  },
  {
    key: "applications",
    label: "Bewerbungen",
    description: "Bewerbungen an deinen Club",
  },
  {
    key: "trialTrainings",
    label: "Probetrainings",
    description: "Geplante Probetrainings",
  },
  {
    key: "requirements",
    label: "Anforderungen",
    description: "Definierte Suchprofile",
  },
] as const;

export default function ClubDashboard() {
  const [profile, setProfile] = useState<ClubProfile | null>(null);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [oefbUrl, setOefbUrl] = useState("");
  const [savingOefb, setSavingOefb] = useState(false);
  const [oefbMessage, setOefbMessage] = useState("");

  const loadDashboard = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Bitte erneut einloggen.");
      setLoading(false);
      return;
    }

    const data = (await apiFetch("/clubs/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })) as ClubDashboardData;

    setProfile(data.club);
    setOefbUrl(data.club.oefbClubProfileUrl ?? "");
    setDashboard({
      counts: data.counts,
      topMatches: data.topMatches,
    });
  };

  useEffect(() => {
    loadDashboard()
      .catch((err) => {
        setError(
          (err as Error).message || "Übersicht konnte nicht geladen werden.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const saveOefbClubProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Bitte erneut einloggen.");
      return;
    }

    setSavingOefb(true);
    setOefbMessage("");
    setError("");

    try {
      await apiFetch("/clubs/me/oefb-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oefbClubProfileUrl: oefbUrl,
        }),
      });

      await loadDashboard();
      setOefbMessage("ÖFB-Link gespeichert. Ligatabelle wurde aktualisiert.");
    } catch (err) {
      setError(
        (err as Error).message ||
          "ÖFB-Link konnte nicht gespeichert oder gecrawlt werden.",
      );
    } finally {
      setSavingOefb(false);
    }
  };

  const clubMeta = useMemo(
    () =>
      [
        profile?.wettbewerb,
        profile?.league,
        profile?.location,
      ]
        .filter(Boolean)
        .join(" · "),
    [profile],
  );

  const clubLogoUrl = mediaUrl(profile?.logoPath, API_BASE);

  const clubInitials =
    (profile?.clubName ?? "CV")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "CV";

  return (
    <main className="min-h-screen bg-[#f6faf7] px-6 py-10 text-black sm:px-8">
      <div className="mx-auto max-w-7xl">
        <ClubNav />
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-green-100 bg-green-50">
              {clubLogoUrl ? (
                <img
                  src={clubLogoUrl}
                  alt={`${profile?.clubName ?? "Club"} Logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl font-black text-green-700">
                  {clubInitials}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                Club-Übersicht
              </p>
              <h1 className="mt-3 text-4xl font-black sm:text-5xl">
                {profile?.clubName ?? "Dein Verein"}
              </h1>
              <p className="mt-3 text-sm font-semibold text-neutral-600">
                {clubMeta || "Vereinsprofil wird geladen..."}
              </p>
            </div>
          </div>
        </div>

        {!profile?.oefbClubProfileUrl && (
          <section className="mb-8 rounded-3xl bg-white p-8 shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
              ÖFB Vereinsprofil
            </p>
            <h2 className="mt-2 text-2xl font-black">ÖFB-Link anhängen</h2>
            <p className="mt-2 text-sm font-semibold text-neutral-600">
              Beispiel: https://vereine.oefb.at/RbOJessas/News/
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={oefbUrl}
                onChange={(event) => setOefbUrl(event.target.value)}
                placeholder="https://vereine.oefb.at/[Verein]/News/"
                className="h-12 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold text-neutral-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
              />
              <button
                type="button"
                onClick={saveOefbClubProfile}
                disabled={savingOefb || !oefbUrl.trim()}
                className="h-12 rounded-xl bg-green-600 px-5 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {savingOefb ? "Crawlt..." : "Speichern & Tabelle crawlen"}
              </button>
            </div>

            {oefbMessage && (
              <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {oefbMessage}
              </p>
            )}
          </section>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.key} className="rounded-3xl bg-white p-6 shadow-lg">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-neutral-500">
                {card.label}
              </p>
              <h2 className="mt-3 text-5xl font-black">
                {loading ? "-" : dashboard.counts[card.key]}
              </h2>
              <p className="mt-3 text-sm font-semibold text-neutral-500">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                  Kandidaten
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Beste passende Spieler
                </h2>
              </div>
              <Link
                href="/player-search"
                className="rounded-xl border border-green-200 px-4 py-2 text-sm font-black text-green-700 transition hover:bg-green-50"
              >
                Alle Spieler
              </Link>
            </div>

            <div className="space-y-4">
              {!loading && dashboard.topMatches.length === 0 && (
                <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm font-semibold text-neutral-500">
                  Noch keine passenden Spieler gefunden.
                </p>
              )}

              {dashboard.topMatches.map((player) => (
                <Link
                  key={player.id}
                  href={`/club/players/${player.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-green-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black">
                      {player.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-gray-500">
                      {[player.position.join(", "), player.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-green-50 px-3 py-2 text-sm font-black text-green-700">
                    {player.clubFitPercent ?? 0}%
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-lg">
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                Quick Actions
              </p>
              <h2 className="mt-2 text-3xl font-black">Nächste Schritte</h2>
            </div>

            <div className="space-y-3">
              <Link
                href="/player-search"
                className="block rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black transition hover:border-green-300 hover:bg-green-50"
              >
                Spieler scouten
              </Link>
              <Link
                href="/club/requirements"
                className="block rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black transition hover:border-green-300 hover:bg-green-50"
              >
                Anforderungen verwalten
              </Link>
              <Link
                href="/club/trial-trainings"
                className="block rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black transition hover:border-green-300 hover:bg-green-50"
              >
                Probetrainings planen
              </Link>
              <Link
                href="/club/applications"
                className="block rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black transition hover:border-green-300 hover:bg-green-50"
              >
                Bewerbungen prüfen
              </Link>
            </div>

            {profile?.description && (
              <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                  Club-Info
                </p>
                <p className="mt-2 text-sm font-semibold text-neutral-700">
                  {profile.description}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
