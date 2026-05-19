"use client";

import { useEffect, useState } from "react";
import BackToPreviousPage from "@/src/components/BackToPreviousPage";
import { apiFetch } from "@/services/api";

interface OefbStatistic {
  category?: string;
  label?: string;
  games?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goals?: number;
  goalsPerGame?: string;
  yellowCards?: number;
  yellowRedCards?: number;
  redCards?: number;
  competitionGames?: number;
  competitionGoals?: number;
  competitionMinutes?: number;
  friendlyGames?: number;
  friendlyGoals?: number;
  friendlyMinutes?: number;
}

interface OefbPlayerProfile {
  source: {
    url: string;
    fetchedAt: string;
    playerId?: string;
  };
  identity: {
    fullName: string;
    position?: string;
    birthDate?: string;
    heightCm?: number;
    weightKg?: number;
    profileImageUrl?: string;
  };
  currentClub: {
    name?: string;
    id?: string;
    url?: string;
    association?: string;
    since?: string;
  };
  history: Array<{
    club: string;
    position?: string;
    from?: string;
    url?: string;
  }>;
  statistics: OefbStatistic[];
  competitions: Array<{
    name: string;
    link?: string;
  }>;
  displayFields: Array<{
    label: string;
    value: string | number | boolean;
  }>;
  firstMatch?: {
    teams?: string;
    date?: string;
    result?: string;
    url?: string;
  };
  lastMatch?: {
    teams?: string;
    date?: string;
    result?: string;
    url?: string;
  };
}

const defaultOefbUrl =
  "https://www.oefb.at/Profile/Spieler/1493621?Mohammed-Bilge";

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("de-AT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Nicht angegeben";
  }

  return new Intl.DateTimeFormat("de-AT", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const valueOrFallback = (value?: string | number) => {
  if (value === undefined || value === null || value === "") {
    return "Nicht angegeben";
  }

  return value;
};

const statItems = (stat: OefbStatistic) => [
  ["Spiele", stat.games],
  ["Tore", stat.goals],
  ["Tore pro Spiel", stat.goalsPerGame],
  ["Siege", stat.wins],
  ["Unentschieden", stat.draws],
  ["Niederlagen", stat.losses],
  ["Gelbe Karten", stat.yellowCards],
  ["Rote Karten", stat.redCards],
];

export default function PlayerProfilePage() {
  const [oefbUrl, setOefbUrl] = useState(defaultOefbUrl);
  const [profile, setProfile] = useState<OefbPlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedProfileUrl = localStorage.getItem("oefbProfileUrl");

    if (savedProfileUrl) {
      setOefbUrl(savedProfileUrl);
    }
  }, []);

  const fetchProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch(
        `/oefb/player?url=${encodeURIComponent(oefbUrl)}`,
      );
      setProfile(data as OefbPlayerProfile);
    } catch (err) {
      setError(
        (err as Error).message || "ÖFB-Daten konnten nicht geladen werden.",
      );
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f8f6] px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <BackToPreviousPage />

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-neutral-950 p-7 text-white shadow-2xl shadow-green-950/15 sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-300">
              ÖFB Live Import
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Spielerdaten direkt vom ÖFB beziehen
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
              Füge ein ÖFB-Spielerprofil ein. Match your Club lädt die aktuellen
              Profildaten live vom ÖFB und bereitet die wichtigsten
              Informationen für dein Spielerprofil auf.
            </p>

            <form
              onSubmit={fetchProfile}
              className="mt-8 rounded-2xl bg-white/10 p-4 backdrop-blur"
            >
              <label className="block text-sm font-bold text-white">
                ÖFB Profil URL
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={oefbUrl}
                  onChange={(event) => setOefbUrl(event.target.value)}
                  required
                  className="min-h-12 flex-1 rounded-xl border border-white/15 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none ring-green-300/30 transition focus:ring-4"
                  placeholder="https://www.oefb.at/Profile/Spieler/..."
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-12 rounded-xl bg-green-400 px-5 text-sm font-black text-green-950 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/60"
                >
                  {loading ? "Lädt live..." : "Live laden"}
                </button>
              </div>
              {error && (
                <p className="mt-4 rounded-xl border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
                  {error}
                </p>
              )}
            </form>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl shadow-green-950/10 sm:p-8">
            {profile ? (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {profile.identity.profileImageUrl ? (
                  <img
                    src={profile.identity.profileImageUrl}
                    alt={profile.identity.fullName}
                    className="h-36 w-36 rounded-3xl object-cover shadow-lg shadow-neutral-950/15"
                  />
                ) : (
                  <div className="grid h-36 w-36 place-items-center rounded-3xl bg-green-100 text-4xl font-black text-green-800">
                    {profile.identity.fullName.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
                    Spieler ID {valueOrFallback(profile.source.playerId)}
                  </p>
                  <h2 className="mt-2 break-words text-4xl font-black text-neutral-950">
                    {profile.identity.fullName}
                  </h2>
                  <p className="mt-3 text-lg font-semibold text-neutral-600">
                    {valueOrFallback(profile.identity.position)} bei{" "}
                    {valueOrFallback(profile.currentClub.name)}
                  </p>
                  <p className="mt-4 text-sm text-neutral-500">
                    Live bezogen am {formatDateTime(profile.source.fetchedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-center">
                <div>
                  <h2 className="text-2xl font-black text-neutral-900">
                    Noch keine ÖFB-Daten geladen
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600">
                    Starte den Live-Import mit einer ÖFB-Profil-URL. Die Daten
                    werden nicht statisch hinterlegt, sondern bei jeder Abfrage
                    frisch vom ÖFB geladen.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {profile && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-6">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">Basisdaten</h2>
                <dl className="mt-5 grid gap-4">
                  {[
                    [
                      "Größe",
                      profile.identity.heightCm
                        ? `${profile.identity.heightCm} cm`
                        : undefined,
                    ],
                    [
                      "Gewicht",
                      profile.identity.weightKg
                        ? `${profile.identity.weightKg} kg`
                        : undefined,
                    ],
                    ["Aktueller Verein", profile.currentClub.name],
                    ["Verband", profile.currentClub.association],
                    ["Beim Verein seit", formatDate(profile.currentClub.since)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0"
                    >
                      <dt className="text-sm font-bold text-neutral-500">
                        {label}
                      </dt>
                      <dd className="text-right text-sm font-black text-neutral-950">
                        {valueOrFallback(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">Vereinshistorie</h2>
                <div className="mt-5 grid gap-3">
                  {profile.history.map((entry, index) => (
                    <div
                      key={`${entry.club}-${index}`}
                      className="rounded-xl bg-neutral-50 p-4"
                    >
                      <p className="font-black text-neutral-950">
                        {entry.club}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600">
                        Seit {formatDate(entry.from)} ·{" "}
                        {valueOrFallback(entry.position)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">Statistiken</h2>
                <div className="mt-5 grid gap-4">
                  {profile.statistics.map((stat, index) => (
                    <article
                      key={`${stat.category}-${index}`}
                      className="rounded-2xl bg-neutral-50 p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-black">
                          {stat.label ?? stat.category ?? "Statistik"}
                        </h3>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">
                          {stat.category ?? "Gesamt"}
                        </span>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {statItems(stat).map(([label, value]) => (
                          <div key={label} className="rounded-xl bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                              {label}
                            </p>
                            <p className="mt-2 text-2xl font-black text-neutral-950">
                              {valueOrFallback(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black">Spiele</h2>
                  <div className="mt-5 grid gap-4 text-sm">
                    {[
                      ["Erstes Spiel", profile.firstMatch],
                      ["Letztes Spiel", profile.lastMatch],
                    ].map(([label, match]) => (
                      <div
                        key={label as string}
                        className="rounded-xl bg-neutral-50 p-4"
                      >
                        <p className="font-black text-neutral-950">
                          {label as string}
                        </p>
                        <p className="mt-2 font-semibold text-neutral-700">
                          {typeof match === "object" && match
                            ? match.teams
                            : "Nicht angegeben"}
                        </p>
                        <p className="mt-1 text-neutral-500">
                          {typeof match === "object" && match
                            ? `${formatDate(match.date)} · ${valueOrFallback(match.result)}`
                            : "Nicht angegeben"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black">Bewerbe</h2>
                  <div className="mt-5 grid gap-3">
                    {profile.competitions.map((competition) => (
                      <a
                        key={competition.name}
                        href={competition.link}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-neutral-50 p-4 text-sm font-black text-neutral-950 transition hover:bg-green-50 hover:text-green-800"
                      >
                        {competition.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {profile.displayFields.length > 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black">Weitere ÖFB-Daten</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {profile.displayFields.map((field) => (
                      <div
                        key={field.label}
                        className="rounded-xl bg-neutral-50 p-4"
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                          {field.label}
                        </p>
                        <p className="mt-2 break-words text-sm font-black text-neutral-950">
                          {String(field.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
