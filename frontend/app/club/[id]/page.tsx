"use client";

import { use, useEffect, useState } from "react";
import BackToPreviousPage from "@/src/components/BackToPreviousPage";
import { API_URL } from "@/src/lib/apiBase";
import { mediaUrl } from "@/src/lib/media";

type Club = {
  id: number;
  clubName: string;
  verband: string;
  wettbewerb: string;
  league: string;
  location: string;
  description?: string;
  logoPath?: string;
};

type ClubRating = {
  id: number;
  score: number;
  comment?: string | null;
  createdAt: string;
  player: {
    id: number;
    name: string;
    position: string[] | string;
    profileImagePath?: string | null;
    profileImageUrl?: string | null;
  };
  trialTraining?: {
    id: number;
    scheduledAt: string;
    feedback?: string | null;
  } | null;
};

const formatPositions = (positions: string[] | string) =>
  Array.isArray(positions) ? positions.join(", ") : positions;

export default function ClubDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);

  const [club, setClub] = useState<Club | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "ratings">("profile");
  const [ratings, setRatings] = useState<ClubRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsError, setRatingsError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/clubs`)
      .then((res) => res.json())
      .then((data) => {
        const foundClub = data.find((club: Club) => club.id === Number(id));

        setClub(foundClub);
      });
  }, [id]);

  useEffect(() => {
    setRatingsLoading(true);
    setRatingsError("");

    fetch(`${API_URL}/clubs/${id}/ratings`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Bewertungen konnten nicht geladen werden.");
        }

        return res.json();
      })
      .then((data) => setRatings(data as ClubRating[]))
      .catch((error) => {
        setRatings([]);
        setRatingsError((error as Error).message);
      })
      .finally(() => setRatingsLoading(false));
  }, [id]);

  if (!club) {
    return <main className="p-10 text-2xl">Lädt...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f6faf7] px-8 py-12 text-black dark:bg-[#f6faf7] dark:text-black">
      <div className="mx-auto max-w-5xl">
        <BackToPreviousPage />

        <div className="rounded-[40px] border border-green-100 bg-white p-10 shadow-2xl dark:border-green-100 dark:bg-white">
          <div className="flex flex-col gap-10 md:flex-row md:items-center">
            {club.logoPath && (
              <img
                src={mediaUrl(club.logoPath) || ""}
                alt={club.clubName}
                className="h-40 w-40 rounded-full object-cover"
              />
            )}

            <div className="flex-1">
              <h1 className="text-6xl font-bold">{club.clubName}</h1>

              <p className="mt-4 text-xl text-neutral-500 dark:text-neutral-400">
                {[club.wettbewerb, club.league]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <p className="mt-2 text-lg">📍 {club.location}</p>

              <button className="mt-8 rounded-2xl bg-green-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-105">
                Jetzt bewerben
              </button>
            </div>
          </div>

          <div className="mt-12 overflow-x-auto rounded-2xl border border-green-100 bg-white shadow-sm">
            <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`min-w-36 border-b-2 px-7 py-5 text-base font-black ${
                activeTab === "profile"
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              Profil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ratings")}
              className={`min-w-36 border-b-2 px-7 py-5 text-base font-black ${
                activeTab === "ratings"
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              Bewertungen
            </button>
            </div>
          </div>

          <div className="stable-tab-panel">
            {activeTab === "profile" && (
              <div className="mt-10">
                <h2 className="mb-4 text-3xl font-bold">Über den Verein</h2>

                <p className="max-w-3xl text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {club.description}
                </p>
              </div>
            )}

            {activeTab === "ratings" && (
              <div className="mt-10">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">Abgegebene Bewertungen</h2>
                  <p className="mt-2 text-sm font-semibold text-neutral-500">
                    Bewertungen aus abgeschlossenen Probetrainings.
                  </p>
                </div>
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">
                  {ratings.length} {ratings.length === 1 ? "Bewertung" : "Bewertungen"}
                </div>
              </div>

              {ratingsError && (
                <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {ratingsError}
                </p>
              )}

              {ratingsLoading && (
                <div className="rounded-2xl bg-green-50 p-6 font-bold text-neutral-500">
                  Lädt...
                </div>
              )}

              {!ratingsLoading && !ratingsError && ratings.length === 0 && (
                <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-8">
                  <h3 className="text-xl font-black">Noch keine Bewertungen</h3>
                  <p className="mt-2 text-sm font-semibold text-neutral-500">
                    Sobald der Club ein Probetraining bewertet, erscheint es hier.
                  </p>
                </div>
              )}

              {!ratingsLoading && ratings.length > 0 && (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <article
                      key={rating.id}
                      className="rounded-2xl border border-green-100 bg-green-50 p-5"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              mediaUrl(
                                rating.player.profileImagePath ||
                                  rating.player.profileImageUrl,
                              ) || "https://placehold.co/96x96"
                            }
                            alt={rating.player.name}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="text-xl font-black">
                              {rating.player.name}
                            </h3>
                            <p className="mt-1 text-sm font-semibold text-neutral-500">
                              {formatPositions(rating.player.position)}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-green-700">
                              {new Date(
                                rating.trialTraining?.scheduledAt ||
                                  rating.createdAt,
                              ).toLocaleDateString("de-AT")}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white px-5 py-3 text-center">
                          <p className="text-3xl font-black text-green-700">
                            {rating.score}
                          </p>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                            /99
                          </p>
                        </div>
                      </div>

                      {(rating.comment || rating.trialTraining?.feedback) && (
                        <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold leading-relaxed text-neutral-700">
                          {rating.comment || rating.trialTraining?.feedback}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
