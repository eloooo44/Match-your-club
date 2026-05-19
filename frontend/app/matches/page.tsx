"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PlayerNav from "@/src/components/PlayerNav";
import { useAuth } from "@/src/hooks/useAuth";
import { mediaUrl } from "@/src/lib/media";
import { apiFetch } from "@/src/services/api";

import { API_BASE } from "@/src/lib/apiBase";

type ClubMatch = {
  id: number;
  clubName: string;
  league?: string | null;
  location?: string | null;
  logoPath?: string | null;
  matchScore: number;
};

type PlayerMatch = {
  playerId: number;
  playerName: string;
  position: string[];
  location?: string | null;
  profileImagePath?: string | null;
  profileImageUrl?: string | null;
  matchScore: number;
};

const formatPositions = (positions: string[] | string) => {
  return Array.isArray(positions) ? positions.join(" | ") : positions;
};

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [clubMatches, setClubMatches] = useState<ClubMatch[]>([]);
  const [playerMatches, setPlayerMatches] = useState<PlayerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadMatches = async () => {
      setLoading(true);
      setError("");

      try {
        if (user?.role === "player") {
          const data = (await apiFetch("/matching/player", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })) as ClubMatch[];

          const sortedClubs = [...(data ?? [])]
            .filter((club) => club.matchScore > 75)
            .sort((a, b) => b.matchScore - a.matchScore);

          setClubMatches(sortedClubs);
          setPlayerMatches([]);
          return;
        }

        if (user?.role === "club") {
          const data = (await apiFetch("/matching/club", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })) as PlayerMatch[];

          const uniqueMatches = data.filter(
            (match, index, self) =>
              index ===
              self.findIndex((item) => item.playerId === match.playerId),
          );

          uniqueMatches.sort((a, b) => b.matchScore - a.matchScore);

          setPlayerMatches(uniqueMatches);
          setClubMatches([]);
          return;
        }

        setError("Unbekannte Benutzerrolle.");
      } catch (err) {
        setError(
          (err as Error).message || "Matches konnten nicht geladen werden.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [authLoading, isAuthenticated, router, user?.role]);

  const heading = useMemo(() => {
    if (user?.role === "player") {
      return "Deine Club-Matches";
    }

    if (user?.role === "club") {
      return "Deine Spieler-Matches";
    }

    return "Matches";
  }, [user?.role]);

  return (
    <main className="min-h-screen bg-[#f6faf7] px-6 py-10 text-black sm:px-8">
      <div className="mx-auto max-w-7xl">
        {user?.role === "player" && <PlayerNav />}
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
            Matching
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">{heading}</h1>
          <p className="mt-3 text-sm font-semibold text-neutral-600">
            {user?.role === "player"
              ? "Hier siehst du die Clubs, die zu deinem Profil passen."
              : "Hier siehst du die Spieler, die zu deinem Clubprofil passen."}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm font-semibold text-neutral-600">
            Matches werden geladen...
          </div>
        )}

        {!loading && user?.role === "player" && clubMatches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-6 text-sm font-semibold text-neutral-500">
            Keine Clubs mit einem Matching-Wert über 75% gefunden.
          </div>
        )}

        {!loading && user?.role === "club" && playerMatches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-6 text-sm font-semibold text-neutral-500">
            Noch keine passenden Spieler gefunden.
          </div>
        )}

        {!loading && user?.role === "player" && clubMatches.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {clubMatches.map((club) => {
              const logo = mediaUrl(club.logoPath, API_BASE);

              return (
                <Link
                  key={club.id}
                  href={`/player/clubs/${club.id}`}
                  className="rounded-3xl border border-green-100 bg-white p-6 shadow-[0_10px_30px_rgba(34,197,94,0.08)] transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-green-100 bg-green-50">
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${club.clubName} Logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-black text-green-700">
                          CLUB
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black">
                        {club.clubName}
                      </h2>
                      <p className="mt-1 truncate text-sm font-semibold text-neutral-500">
                        {[club.league, club.location]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-500">
                      Matching
                    </span>
                    <span className="rounded-xl bg-green-50 px-3 py-2 text-sm font-black text-green-700">
                      {club.matchScore}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && user?.role === "club" && playerMatches.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {playerMatches.map((player) => {
              const image = player.profileImagePath
                ? `${API_BASE}/${player.profileImagePath}`
                : (player.profileImageUrl ?? null);

              return (
                <Link
                  key={player.playerId}
                  href={`/player/${player.playerId}`}
                  className="rounded-3xl border border-green-100 bg-white p-6 shadow-[0_10px_30px_rgba(34,197,94,0.08)] transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-green-100 bg-green-50">
                      {image ? (
                        <img
                          src={image}
                          alt={player.playerName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-black text-green-700">
                          DU
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black">
                        {player.playerName}
                      </h2>
                      <p className="mt-1 truncate text-sm font-semibold text-neutral-500">
                        {formatPositions(player.position)}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-neutral-500">
                        {player.location || "Ort nicht angegeben"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-500">
                      Matching
                    </span>
                    <span className="rounded-xl bg-green-50 px-3 py-2 text-sm font-black text-green-700">
                      {Math.round(player.matchScore * 100)}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
