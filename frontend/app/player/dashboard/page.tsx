"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import DashboardLayout from "@/src/components/DashboardLayout";
import { apiFetch } from "@/src/services/api";

type DashboardClub = {
  id: number;
  clubName: string;
  league: string;
  location: string;
  logoPath?: string | null;
  interactionTypes?: string[];
  matchScore?: number;
};

type PlayerDashboardData = {
  counts: {
    applications: number;
    trialTrainings: number;
    matches: number;
    interactedClubs: number;
  };
  matches: DashboardClub[];
  interactedClubs: DashboardClub[];
};

const emptyDashboard: PlayerDashboardData = {
  counts: {
    applications: 0,
    trialTrainings: 0,
    matches: 0,
    interactedClubs: 0,
  },
  matches: [],
  interactedClubs: [],
};

const statCards = [
  {
    key: "applications",
    label: "Bewerbungen",
    description: "Abgeschickte Bewerbungen",
    href: "/player/applications",
  },
  {
    key: "trialTrainings",
    label: "Probetrainings",
    description: "Deine Probetrainings und Einladungen",
    href: "/my-trials",
  },
  {
    key: "matches",
    label: "Aktuelle Matches",
    description: "Passende Clubs laut Matching",
    href: "/matches",
  },
  {
    key: "interactedClubs",
    label: "Interagierte Clubs",
    description: "Clubs mit Kontaktpunkten",
    href: "/player/clubs",
  },
] as const;

export default function PlayerDashboard() {
  const [dashboard, setDashboard] =
    useState<PlayerDashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Bitte erneut einloggen.");
      setLoading(false);
      return;
    }

    apiFetch("/players/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((data) => {
        setDashboard(data as PlayerDashboardData);
      })
      .catch((err) => {
        setError(
          (err as Error).message || "Übersicht konnte nicht geladen werden.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout title="Spieler-Übersicht">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-3xl bg-[var(--card)] p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              {card.label}
            </p>
            <h2 className="mt-3 text-5xl font-black">
              {loading ? "-" : dashboard.counts[card.key]}
            </h2>
            <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-[var(--card)] p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                Matches
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Aktuelle Club-Matches
              </h2>
            </div>
            <Link
              href="/player/clubs"
              className="rounded-xl border border-green-200 px-4 py-2 text-sm font-black text-green-700 transition hover:bg-green-50"
            >
              Clubs ansehen
            </Link>
          </div>

          <div className="space-y-4">
            {!loading && dashboard.matches.length === 0 && (
              <p className="rounded-2xl border border-dashed border-neutral-200 bg-white p-5 text-sm font-semibold text-neutral-500">
                Noch keine aktuellen Matches gefunden.
              </p>
            )}

            {dashboard.matches.map((club) => (
              <ClubRow
                key={club.id}
                club={club}
                rightLabel={
                  club.matchScore !== undefined
                    ? `${club.matchScore}%`
                    : undefined
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-[var(--card)] p-8 shadow-lg">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
              Interaktionen
            </p>
            <h2 className="mt-2 text-3xl font-black">Clubs mit Kontakt</h2>
          </div>

          <div className="space-y-4">
            {!loading && dashboard.interactedClubs.length === 0 && (
              <p className="rounded-2xl border border-dashed border-neutral-200 bg-white p-5 text-sm font-semibold text-neutral-500">
                Du hast noch mit keinem Club interagiert.
              </p>
            )}

            {dashboard.interactedClubs.map((club) => (
              <ClubRow
                key={club.id}
                club={club}
                rightLabel={club.interactionTypes?.join(", ")}
              />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

const ClubRow = ({
  club,
  rightLabel,
}: {
  club: DashboardClub;
  rightLabel?: string;
}) => (
  <Link
    href={`/player/clubs/${club.id}`}
    className="flex items-center justify-between gap-4 rounded-2xl border border-green-100 bg-white p-5 text-black transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div className="min-w-0">
      <h3 className="truncate text-xl font-black">{club.clubName}</h3>
      <p className="mt-1 text-sm font-semibold text-gray-500">
        {[club.league, club.location].filter(Boolean).join(" · ")}
      </p>
    </div>

    {rightLabel && (
      <span className="shrink-0 rounded-xl bg-green-50 px-3 py-2 text-sm font-black text-green-700">
        {rightLabel}
      </span>
    )}
  </Link>
);
