"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ClubNav from "@/src/components/ClubNav";
import { useAuth } from "@/src/hooks/useAuth";
import { mediaUrl } from "@/src/lib/media";

type PlayerResult = {
  id: number;
  name: string;
  position: string[];
  location: string;
  description?: string | null;
  openToPlay: boolean;
  verified: boolean;
  profileImageUrl?: string | null;
  profileImagePath?: string | null;
  overallScore: number;
  averageRating: number;
  selfRating?: number;
  externalRating?: number;
  ratingCount?: number;
  externalRatingCount?: number;
  clubFitPercent: number | null;
  videos?: Array<{
    id: number;
    title?: string;
    videoUrl?: string | null;
    videoPath?: string | null;
  }>;
  attributes: {
    tempo: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  } | null;
};

type TrialDates = {
  selectedDate?: string;
  alternative1?: string;
  alternative2?: string;
  alternative3?: string;
};

import { API_BASE } from "@/src/lib/apiBase";

const POSITION_OPTIONS = [
  "",
  "GK",
  "IV",
  "LV",
  "RV",
  "ZDM",
  "ZM",
  "ZOM",
  "ST",
  "LF",
  "RF",
];

const AUSTRIAN_STATE_OPTIONS = [
  "",
  "Wien",
  "Niederösterreich - St. Pölten",
  "Niederösterreich - Wiener Neustadt",
  "Niederösterreich - Mödling",
  "Burgenland - Eisenstadt",
  "Burgenland - Mattersburg",
  "Oberösterreich - Linz",
  "Oberösterreich - Wels",
  "Salzburg - Salzburg",
  "Salzburg - Hallein",
  "Steiermark - Graz",
  "Steiermark - Leoben",
  "Kärnten - Klagenfurt",
  "Kärnten - Villach",
  "Tirol - Innsbruck",
  "Tirol - Kufstein",
  "Vorarlberg - Bregenz",
  "Vorarlberg - Dornbirn",
];

const sortOptions = [
  {
    label: "Beste Gesamtbewertung",
    value: "",
  },
  {
    label: "Bester Match-Wert",
    value: "matchScore",
  },
  {
    label: "Höchstes Tempo",
    value: "highestTempo",
  },
  {
    label: "Neueste Spieler",
    value: "newestPlayers",
  },
  {
    label: "Beste Fremdbewertung",
    value: "bestRated",
  },
];

const formatAttributeLabel = (attribute: string) => {
  return attribute.charAt(0).toUpperCase() + attribute.slice(1);
};

const formatPositions = (positions: string[] | string) => {
  return Array.isArray(positions) ? positions.join(", ") : positions;
};

export default function PlayerSearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");

  const [tempo, setTempo] = useState(0);
  const [shooting, setShooting] = useState(0);
  const [passing, setPassing] = useState(0);
  const [dribbling, setDribbling] = useState(0);
  const [defending, setDefending] = useState(0);
  const [physical, setPhysical] = useState(0);

  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(0);
  const [minScore, setMinScore] = useState(0);

  const [verified, setVerified] = useState(false);
  const [openToPlay, setOpenToPlay] = useState(false);
  const [hasExternalRating, setHasExternalRating] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [currentClubId, setCurrentClubId] = useState<number | null>(null);

  const [sortBy, setSortBy] = useState("");
  const [ratingViews, setRatingViews] = useState<
    Record<number, "external" | "self">
  >({});

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerResult | null>(
    null,
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [trialDates, setTrialDates] = useState<TrialDates>({});
  const [inviteMessage, setInviteMessage] = useState(
    "Wir möchten dich zu einem Probetraining einladen.",
  );

  const hasClubFit = useMemo(() => {
    return players.some((player) => typeof player.clubFitPercent === "number");
  }, [players]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setAllowed(true);
    fetch(`${API_BASE}/api/clubs/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return response.json() as Promise<{ id?: number } | null>;
      })
      .then((clubProfile) => {
        if (typeof clubProfile?.id === "number") {
          setCurrentClubId(clubProfile.id);
          localStorage.setItem("clubId", String(clubProfile.id));
        }
      })
      .catch(() => {
        setCurrentClubId(null);
      });
  }, [router]);

  const fetchPlayers = async () => {
    if (!allowed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        position,
        location,
        tempo: String(tempo),
        shooting: String(shooting),
        passing: String(passing),
        dribbling: String(dribbling),
        defending: String(defending),
        physical: String(physical),
        minAge: String(minAge),
        maxAge: String(maxAge),
        minScore: String(minScore),
      });

      if (verified) {
        params.set("verified", "true");
      }

      if (openToPlay) {
        params.set("openToPlay", "true");
      }

      if (hasExternalRating) {
        params.set("hasExternalRating", "true");
      }

      if (hasVideo) {
        params.set("hasVideo", "true");
      }

      if (sortBy) {
        params.set("sortBy", sortBy);
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/players/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Spieler konnten nicht geladen werden.");
      }

      const data = (await response.json()) as PlayerResult[];

      setPlayers(data);
    } catch (fetchError) {
      setError((fetchError as Error).message);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setPosition("");
    setLocation("");

    setTempo(0);
    setShooting(0);
    setPassing(0);
    setDribbling(0);
    setDefending(0);
    setPhysical(0);

    setMinAge(0);
    setMaxAge(0);
    setMinScore(0);

    setVerified(false);
    setOpenToPlay(false);
    setHasExternalRating(false);
    setHasVideo(false);
    setSortBy("");
  };

  const openInviteModal = (player: PlayerResult) => {
    setSelectedPlayer(player);
    setShowInviteModal(true);
  };

  const sendTrialInvitation = async () => {
    if (!selectedPlayer || !trialDates.selectedDate) {
      alert("Bitte wähle einen Haupttermin aus.");
      return;
    }

    const clubIdValue =
      currentClubId ??
      (typeof window !== "undefined"
        ? Number(localStorage.getItem("clubId"))
        : NaN);

    if (!Number.isFinite(clubIdValue) || clubIdValue <= 0) {
      alert("Clubprofil konnte nicht geladen werden. Bitte neu einloggen.");
      return;
    }

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE}/api/trial-trainings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          clubId: clubIdValue,
          scheduledAt: new Date(trialDates.selectedDate).toISOString(),
          alternativeDate1: trialDates.alternative1
            ? new Date(trialDates.alternative1).toISOString()
            : null,
          alternativeDate2: trialDates.alternative2
            ? new Date(trialDates.alternative2).toISOString()
            : null,
          alternativeDate3: trialDates.alternative3
            ? new Date(trialDates.alternative3).toISOString()
            : null,
          notes: inviteMessage,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message || "Einladung konnte nicht gesendet werden.",
        );
      }

      alert("Einladung wurde gesendet.");
      setShowInviteModal(false);
      setTrialDates({});
    } catch (inviteError) {
      alert((inviteError as Error).message);
    }
  };

  useEffect(() => {
    if (!allowed) {
      return;
    }

    fetchPlayers();
  }, [allowed]);

  if (!allowed) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#ebfff1_0%,#f7faf8_45%,#eef6f1_100%)] px-4 py-8 text-black sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {user?.role === "club" && <ClubNav />}
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="top-6 w-full rounded-3xl border border-green-100 bg-white/95 p-6 shadow-[0_14px_40px_rgba(16,185,129,0.12)] backdrop-blur lg:sticky lg:w-[320px]">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
              Aktives Scouting
            </p>
            <h1 className="mt-2 text-3xl font-black">Spielersuche</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Filtere nach Position, Standort, Qualität und Verfügbarkeit.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Position
              </label>
              <select
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                className="w-full rounded-xl border border-green-100 bg-white px-3 py-2 outline-none focus:border-green-400"
              >
                {POSITION_OPTIONS.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "Alle Positionen"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Standort
              </label>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-xl border border-green-100 bg-white px-3 py-2 outline-none focus:border-green-400"
              >
                {AUSTRIAN_STATE_OPTIONS.map((option) => (
                  <option key={option || "all-locations"} value={option}>
                    {option || "Alle Bundesländer"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Mindestalter
                </label>
                <input
                  type="number"
                  min={0}
                  value={minAge}
                  onChange={(event) =>
                    setMinAge(Number(event.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-green-100 bg-white px-3 py-2 outline-none focus:border-green-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Höchstalter
                </label>
                <input
                  type="number"
                  min={0}
                  value={maxAge}
                  onChange={(event) =>
                    setMaxAge(Number(event.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-green-100 bg-white px-3 py-2 outline-none focus:border-green-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mindest-Gesamtbewertung
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(event) =>
                  setMinScore(Number(event.target.value) || 0)
                }
                className="w-full rounded-xl border border-green-100 bg-white px-3 py-2 outline-none focus:border-green-400"
              />
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mindestattribute
              </p>

              <div className="space-y-3">
                {[
                  { label: "Tempo", value: tempo, setter: setTempo },
                  { label: "Schuss", value: shooting, setter: setShooting },
                  { label: "Passen", value: passing, setter: setPassing },
                  {
                    label: "Dribbling",
                    value: dribbling,
                    setter: setDribbling,
                  },
                  {
                    label: "Defensive",
                    value: defending,
                    setter: setDefending,
                  },
                  { label: "Physis", value: physical, setter: setPhysical },
                ].map((attribute) => (
                  <div key={attribute.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{attribute.label}</span>
                      <span className="font-semibold">{attribute.value}</span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={attribute.value}
                      onChange={(event) =>
                        attribute.setter(Number(event.target.value) || 0)
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-green-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Schnellfilter
              </p>

              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(event) => setVerified(event.target.checked)}
                  className="h-4 w-4 rounded border-green-300"
                />
                Verifiziert
              </label>

              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={openToPlay}
                  onChange={(event) => setOpenToPlay(event.target.checked)}
                  className="h-4 w-4 rounded border-green-300"
                />
                Wechselbereit
              </label>

              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasExternalRating}
                  onChange={(event) =>
                    setHasExternalRating(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-green-300"
                />
                Nur mit Fremdbewertung
              </label>

              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasVideo}
                  onChange={(event) => setHasVideo(event.target.checked)}
                  className="h-4 w-4 rounded border-green-300"
                />
                Video vorhanden
              </label>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Sortieren nach
              </label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-xl border border-green-100 bg-white px-3 py-2 outline-none focus:border-green-400"
              >
                {sortOptions.map((option) => (
                  <option key={option.value || "default"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={fetchPlayers}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-2 text-sm font-bold text-white transition hover:brightness-105"
              >
                Suchen
              </button>

              <button
                onClick={resetFilters}
                className="rounded-xl border border-green-200 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-green-50"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-neutral-500">
                Suchergebnisse
              </p>
              <h2 className="text-3xl font-black">
                {players.length} Spieler gefunden
              </h2>
            </div>

            {hasClubFit ? (
              <p className="rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-green-700">
                Club-Fit sichtbar (angemeldet)
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="rounded-3xl border border-green-100 bg-white p-8 text-center text-neutral-600 shadow-sm">
              Spieler werden geladen...
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && players.length === 0 && !error ? (
            <div className="rounded-3xl border border-green-100 bg-white p-8 text-center text-neutral-600 shadow-sm">
              Keine Spieler passen zu deinen Filtern.
            </div>
          ) : null}

          <div className="space-y-4">
            {players.map((player) => (
              <article
                key={player.id}
                className="overflow-hidden rounded-3xl border border-green-100 bg-white p-5 shadow-[0_10px_28px_rgba(16,185,129,0.1)]"
              >
                <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
                  <img
                    src={
                      mediaUrl(
                        player.profileImagePath || player.profileImageUrl,
                        API_BASE,
                      ) || "https://placehold.co/180x180"
                    }
                    alt={player.name}
                    className="h-28 w-28 rounded-2xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/club/players/${player.id}`}
                        className="text-2xl font-black hover:text-green-700"
                      >
                        {player.name}
                      </Link>

                      {player.verified ? (
                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Verifiziert
                        </span>
                      ) : null}

                      {player.openToPlay ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Wechselbereit
                        </span>
                      ) : null}

                      {typeof player.clubFitPercent === "number" ? (
                        <span className="rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-700">
                          {player.clubFitPercent}% Club Fit
                        </span>
                      ) : null}

                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                      <span>
                        {formatPositions(player.position)} | {player.location}
                      </span>
                      {(player.videos?.length ?? 0) > 0 ? (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                          Video vorhanden
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {player.attributes ? (
                        Object.entries(player.attributes)
                          .filter(
                            ([key]) =>
                              ![
                                "id",
                                "playerId",
                                "profileId",
                                "reviewCount",
                              ].includes(key),
                          )
                          .map(([key, value]) => (
                            <div key={key}>
                              <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                <span>{formatAttributeLabel(key)}</span>
                                <span>{value}</span>
                              </div>

                              <div className="h-2 rounded-full bg-green-100">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                                  style={{
                                    width: `${Math.min(value, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-neutral-500">
                          Keine Attribute verfügbar
                        </p>
                      )}
                    </div>

                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-3 text-right lg:min-w-44">
                    {(() => {
                      const activeRatingView =
                        ratingViews[player.id] ?? "external";
                      const externalRatingCount =
                        player.externalRatingCount ?? player.ratingCount ?? 0;
                      const externalRating =
                        player.externalRating ?? player.averageRating ?? 0;
                      const selfRating =
                        player.selfRating ?? player.overallScore;
                      const hasRating = externalRatingCount > 0;

                      return (
                        <>
                          <div className="mb-3 grid grid-cols-2 rounded-xl bg-white p-1 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setRatingViews((current) => ({
                                  ...current,
                                  [player.id]: "external",
                                }))
                              }
                              className={`rounded-lg px-2 py-2 text-xs font-black transition ${
                                activeRatingView === "external"
                                  ? "bg-green-600 text-white"
                                  : "text-green-700 hover:bg-green-50"
                              }`}
                            >
                              Fremd
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRatingViews((current) => ({
                                  ...current,
                                  [player.id]: "self",
                                }))
                              }
                              className={`rounded-lg px-2 py-2 text-xs font-black transition ${
                                activeRatingView === "self"
                                  ? "bg-green-600 text-white"
                                  : "text-green-700 hover:bg-green-50"
                              }`}
                            >
                              Selbst
                            </button>
                          </div>

                          <p className="text-xs font-black uppercase tracking-[0.12em] text-green-700">
                            {activeRatingView === "external"
                              ? "Fremdbewertung"
                              : "Eigenbewertung"}
                          </p>
                          <p className="mt-2 text-4xl font-black text-green-700">
                            {activeRatingView === "external"
                              ? hasRating
                                ? Math.round(externalRating)
                                : "-"
                              : Math.round(selfRating)}
                          </p>
                          {activeRatingView === "external" ? (
                            hasRating ? (
                              <p className="mt-1 text-xs font-bold text-green-800">
                                {externalRatingCount}{" "}
                                {externalRatingCount === 1
                                  ? "Bewertung"
                                  : "Bewertungen"}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs font-bold text-green-800">
                                Keine Bewertung
                              </p>
                            )
                          ) : (
                            <p className="mt-1 text-xs font-bold text-green-800">
                              Aus Profilangaben
                            </p>
                          )}
                          <button
                            onClick={() => openInviteModal(player)}
                            className="mt-4 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-sm font-bold text-white transition hover:brightness-105"
                          >
                            Zum Probetraining einladen
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {showInviteModal && selectedPlayer ? (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="modal-panel w-full max-w-2xl rounded-3xl border border-green-100 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600">
                  Probetraining-Einladung
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {selectedPlayer.name} einladen
                </h3>
              </div>

              <button
                onClick={() => setShowInviteModal(false)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-sm"
              >
                Schließen
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                onChange={(event) =>
                  setTrialDates((current) => ({
                    ...current,
                    selectedDate: event.target.value,
                  }))
                }
                className="rounded-xl border border-green-100 px-3 py-2 outline-none focus:border-green-400"
              />

              <input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                onChange={(event) =>
                  setTrialDates((current) => ({
                    ...current,
                    alternative1: event.target.value,
                  }))
                }
                className="rounded-xl border border-green-100 px-3 py-2 outline-none focus:border-green-400"
              />

              <input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                onChange={(event) =>
                  setTrialDates((current) => ({
                    ...current,
                    alternative2: event.target.value,
                  }))
                }
                className="rounded-xl border border-green-100 px-3 py-2 outline-none focus:border-green-400"
              />

              <input
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                onChange={(event) =>
                  setTrialDates((current) => ({
                    ...current,
                    alternative3: event.target.value,
                  }))
                }
                className="rounded-xl border border-green-100 px-3 py-2 outline-none focus:border-green-400"
              />
            </div>

            <textarea
              value={inviteMessage}
              onChange={(event) => setInviteMessage(event.target.value)}
              className="mt-3 min-h-[120px] w-full rounded-xl border border-green-100 px-3 py-2 outline-none focus:border-green-400"
            />

            <button
              onClick={sendTrialInvitation}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white"
            >
              Einladung senden
            </button>
          </div>
        </div>
      ) : null}
      </div>
    </main>
  );
}
