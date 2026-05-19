"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "@/src/components/DashboardLayout";
import { mediaUrl } from "@/src/lib/media";
import { apiFetch } from "@/src/services/api";

import { API_BASE } from "@/src/lib/apiBase";

type Club = {
  id: number;
  clubName: string;
  verband: string;
  wettbewerb: string;
  league: string;
  location: string;
  description?: string | null;
  logoPath?: string | null;
  matchScore?: number | null;
};

type PlayerDashboardData = {
  matches: Array<{
    id: number;
    matchScore: number;
  }>;
};

const sortOptions = [
  { label: "Beste Matches", value: "match" },
  { label: "Name A-Z", value: "name" },
  { label: "Liga", value: "league" },
  { label: "Standort", value: "location" },
];

const oefbOptions: Record<string, Record<string, string[]>> = {
  "Burgenländischer Fußballverband": {
    Regionalliga: ["Regionalliga Ost"],
    Landesligen: [
      "Burgenlandliga",
      "2. Liga Nord",
      "2. Liga Mitte",
      "2. Liga Süd",
    ],
  },
  "Wiener Fußballverband": {
    Regionalliga: ["Regionalliga Ost"],
    Landesligen: [
      "Wiener Stadtliga",
      "2. Landesliga",
      "Oberliga A",
      "Oberliga B",
      "1. Klasse A",
      "1. Klasse B",
      "2. Klasse A",
      "2. Klasse B",
    ],
    "DSG Liga": [
      "DSG Liga",
      "DSG Oberliga A",
      "DSG Oberliga B",
      "DSG Unterliga A",
      "DSG Unterliga B",
      "DSG 1. Klasse A",
      "DSG 1. Klasse B",
      "DSG 2. Klasse A",
      "DSG 2. Klasse B",
    ],
  },
  "Niederösterreichischer Fußballverband": {
    Regionalliga: ["Regionalliga Ost"],
    Landesligen: [
      "1. NÖ Landesliga",
      "2. Landesliga Ost",
      "2. Landesliga West",
      "Gebietsliga Nord/Nordwest",
      "Gebietsliga Nordwest/Waldviertel",
      "Gebietsliga Weinviertel",
      "Gebietsliga West",
      "Gebietsliga Mostviertel",
      "Gebietsliga Süd/Südost",
    ],
  },
  "Oberösterreichischer Fußballverband": {
    Regionalliga: ["Regionalliga Mitte"],
    Landesligen: [
      "OÖ Liga",
      "Landesliga Ost",
      "Landesliga West",
      "Bezirksliga Nord",
      "Bezirksliga Ost",
      "Bezirksliga Süd",
      "Bezirksliga West",
    ],
  },
  "Steirischer Fußballverband": {
    Regionalliga: ["Regionalliga Mitte"],
    Landesligen: [
      "Landesliga Steiermark",
      "Oberliga Nord",
      "Oberliga Mitte West",
      "Oberliga Süd Ost",
    ],
  },
  "Kärntner Fußballverband": {
    Regionalliga: ["Regionalliga Mitte"],
    Landesligen: ["Kärntner Liga", "Unterliga Ost", "Unterliga West"],
  },
  "Salzburger Fußballverband": {
    Regionalliga: ["Regionalliga West"],
    Landesligen: [
      "Salzburger Liga",
      "1. Landesliga",
      "2. Landesliga Nord",
      "2. Landesliga Süd",
    ],
  },
  "Tiroler Fußballverband": {
    Regionalliga: ["Regionalliga Tirol"],
    Landesligen: ["Tirol Liga", "Landesliga Ost", "Landesliga West"],
  },
  "Vorarlberger Fußballverband": {
    Regionalliga: ["Eliteliga Vorarlberg"],
    Landesligen: [
      "Vorarlbergliga",
      "Landesliga",
      "1. Landesklasse",
      "2. Landesklasse",
    ],
  },
};

const austrianStates = [
  "Burgenland",
  "Kärnten",
  "Niederösterreich",
  "Oberösterreich",
  "Salzburg",
  "Steiermark",
  "Tirol",
  "Vorarlberg",
  "Wien",
];

export default function PlayerClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [verband, setVerband] = useState("");
  const [wettbewerb, setWettbewerb] = useState("");
  const [league, setLeague] = useState("");
  const [location, setLocation] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [sortBy, setSortBy] = useState("match");

  useEffect(() => {
    const token = localStorage.getItem("token");

    Promise.all([
      apiFetch("/clubs"),
      token
        ? apiFetch("/players/dashboard", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([clubData, dashboardData]) => {
        const matchScores = new Map<number, number>();
        ((dashboardData as PlayerDashboardData | null)?.matches ?? []).forEach(
          (match) => {
            matchScores.set(match.id, match.matchScore);
          },
        );

        setClubs(
          (clubData as Club[]).map((club) => ({
            ...club,
            matchScore: matchScores.get(club.id) ?? null,
          })),
        );
      })
      .catch((err) => {
        setError(
          (err as Error).message || "Clubs konnten nicht geladen werden.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const verbandOptions = useMemo(() => {
    return Object.keys(oefbOptions);
  }, []);

  const wettbewerbOptions = useMemo(() => {
    if (verband) {
      return Object.keys(oefbOptions[verband] ?? {});
    }

    return Array.from(
      new Set(
        Object.values(oefbOptions).flatMap((wettbewerbe) =>
          Object.keys(wettbewerbe),
        ),
      ),
    ).sort();
  }, [verband]);

  const leagueOptions = useMemo(() => {
    if (verband && wettbewerb) {
      return oefbOptions[verband]?.[wettbewerb] ?? [];
    }

    if (verband) {
      return Array.from(
        new Set(Object.values(oefbOptions[verband] ?? {}).flat()),
      ).sort();
    }

    if (wettbewerb) {
      return Array.from(
        new Set(
          Object.values(oefbOptions)
            .map((wettbewerbe) => wettbewerbe[wettbewerb] ?? [])
            .flat(),
        ),
      ).sort();
    }

    return Array.from(
      new Set(
        Object.values(oefbOptions).flatMap((wettbewerbe) =>
          Object.values(wettbewerbe).flat(),
        ),
      ),
    ).sort();
  }, [verband, wettbewerb]);

  const filteredClubs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clubs
      .filter((club) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            club.clubName,
            club.verband,
            club.wettbewerb,
            club.league,
            club.location,
            club.description,
          ]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedSearch));
        const matchesVerband = !verband || club.verband === verband;
        const matchesWettbewerb = !wettbewerb || club.wettbewerb === wettbewerb;
        const matchesLeague = !league || club.league === league;
        const matchesLocation = !location || club.location === location;
        const matchesScore = (club.matchScore ?? 0) >= minMatch;

        return (
          matchesSearch &&
          matchesVerband &&
          matchesWettbewerb &&
          matchesLeague &&
          matchesLocation &&
          matchesScore
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.clubName.localeCompare(b.clubName);
        if (sortBy === "league") return a.league.localeCompare(b.league);
        if (sortBy === "location") return a.location.localeCompare(b.location);
        return (b.matchScore ?? -1) - (a.matchScore ?? -1);
      });
  }, [clubs, league, location, minMatch, search, sortBy, verband, wettbewerb]);

  const resetFilters = () => {
    setSearch("");
    setVerband("");
    setWettbewerb("");
    setLeague("");
    setLocation("");
    setMinMatch(0);
    setSortBy("match");
  };

  return (
    <DashboardLayout title="Clubs suchen">
      <section className="rounded-3xl bg-[var(--card)] p-6 shadow-lg">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.9fr_0.8fr]">
          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Suche
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Club, Verband, Wettbewerb, Liga oder Standort"
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 font-semibold text-black outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Verband
            </span>
            <select
              value={verband}
              onChange={(event) => {
                setVerband(event.target.value);
                setWettbewerb("");
                setLeague("");
              }}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 font-semibold text-black outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
            >
              <option value="">Alle Verbände</option>
              {verbandOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Wettbewerb
            </span>
            <select
              value={wettbewerb}
              onChange={(event) => {
                setWettbewerb(event.target.value);
                setLeague("");
              }}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 font-semibold text-black outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
            >
              <option value="">Alle Wettbewerbe</option>
              {wettbewerbOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Liga
            </span>
            <select
              value={league}
              onChange={(event) => setLeague(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 font-semibold text-black outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
            >
              <option value="">Alle Ligen</option>
              {leagueOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Standort
            </span>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 font-semibold text-black outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
            >
              <option value="">Alle Standorte</option>
              {austrianStates.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Sortierung
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 font-semibold text-black outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Mindest-Matching: {minMatch}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={minMatch}
              onChange={(event) => setMinMatch(Number(event.target.value))}
              className="w-full accent-green-500"
            />
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="h-12 rounded-2xl border border-neutral-200 px-5 text-sm font-black transition hover:bg-neutral-50"
          >
            Filter zurücksetzen
          </button>
        </div>
      </section>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--muted)]">
          {loading ? "Lädt Clubs..." : `${filteredClubs.length} Clubs gefunden`}
        </p>
        <p className="text-sm font-semibold text-[var(--muted)]">
          Matching-Wert basiert auf deinem Spielerprofil
        </p>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        {!loading && filteredClubs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-8 text-sm font-semibold text-neutral-500">
            Keine Clubs für diese Filter gefunden.
          </div>
        )}

        {filteredClubs.map((club) => (
          <Link
            key={club.id}
            href={`/player/clubs/${club.id}`}
            className="rounded-3xl border border-green-100 bg-white p-6 text-black shadow-[0_10px_30px_rgba(34,197,94,0.08)] transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex items-start gap-5">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-green-50 text-xl font-black text-green-700">
                {club.logoPath ? (
                  <img
                    src={mediaUrl(club.logoPath, API_BASE) || ""}
                    alt={club.clubName}
                    className="size-full object-cover"
                  />
                ) : (
                  club.clubName.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="break-words text-2xl font-black">
                      {club.clubName}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-neutral-500">
                      {[
                        club.verband,
                        club.wettbewerb,
                        club.league,
                        club.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-green-500 px-4 py-2 text-xl font-black text-white">
                    {club.matchScore !== null && club.matchScore !== undefined
                      ? `${club.matchScore}%`
                      : "-"}
                  </span>
                </div>

                <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-600">
                  {club.description || "Noch keine Beschreibung hinterlegt."}
                </p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${club.matchScore ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </DashboardLayout>
  );
}
