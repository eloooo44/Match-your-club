"use client";

import { useEffect, useState } from "react";
import { API_BASE, API_URL } from "@/src/lib/apiBase";
import { mediaUrl } from "@/src/lib/media";

type TrialTraining = {
  id: number;

  status: string;

  scheduledAt: string;
  selectedDate?: string;

  notes?: string;

  feedback?: string;
  rating?: {
    id: number;
  } | null;

  player: {
    id: number;
    name: string;
    position: string[];
    reviewCount?: number;

    profileImagePath?: string;
    profileImageUrl?: string;

    attributes?: {
      tempo: number;
      shooting: number;
      passing: number;
      dribbling: number;
      defending: number;
      physical: number;
    };
  };
};

const formatPositions = (positions: string[] | string) => {
  return Array.isArray(positions) ? positions.join(", ") : positions;
};

export default function TrialTrainingsPage() {
  const [trainings, setTrainings] = useState<TrialTraining[]>([]);
  const [reviews, setReviews] = useState<any>({});
  const [savedReviews, setSavedReviews] = useState<Record<number, boolean>>({});
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);

  useEffect(() => {
    const clubIdValue =
      typeof window !== "undefined"
        ? Number(localStorage.getItem("clubId") || "1")
        : 1;
    fetch(`${API_URL}/trial-trainings/club/${clubIdValue}`)
      .then((res) => res.json())
      .then((data) => setTrainings(data));
  }, []);

  const [feedbacks, setFeedbacks] = useState<{
    [key: number]: string;
  }>({});

  const updateStatus = async (id: number, status: string) => {
    await fetch(`${API_URL}/trial-trainings/${id}`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        status,
      }),
    });

    setTrainings((prev) =>
      prev.map((training) =>
        training.id === id
          ? {
              ...training,
              status,
            }
          : training,
      ),
    );
  };

  return (
    <main className="min-h-screen bg-[#f6faf7] px-8 py-10 text-black dark:bg-[#f6faf7] dark:text-black">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-10 text-5xl font-bold">Probetrainings</h1>

        <div className="space-y-6">
          {trainings.map((training) => (
            <div
              key={training.id}
              className="rounded-3xl border border-green-100 bg-white p-8 shadow-[0_10px_30px_rgba(34,197,94,0.08)] dark:border-green-100 dark:bg-white"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <img
                    src={
                      mediaUrl(
                        training.player.profileImagePath ||
                          training.player.profileImageUrl,
                        API_BASE,
                      ) || "https://placehold.co/120x120"
                    }
                    alt={training.player.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />

                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold">
                        {training.player.name}
                      </h2>
                      {typeof training.player.reviewCount === "number" && (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold text-sm ${
                            training.player.reviewCount === 0
                              ? "border-neutral-300 bg-neutral-100 text-neutral-400"
                              : "border-green-500 bg-green-50 text-green-700"
                          }`}
                        >
                          {training.player.reviewCount}
                        </div>
                      )}
                    </div>

                    <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                      {formatPositions(training.player.position)}
                    </p>

                    <p className="mt-3 text-sm">
                      📅 {new Date(training.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {training.status === "ACCEPTED" &&
                    training.selectedDate &&
                    new Date() >
                      new Date(
                        new Date(training.selectedDate).getTime() +
                          2 * 60 * 60 * 1000,
                      ) && (
                      <button
                        onClick={() => updateStatus(training.id, "COMPLETED")}
                        className="rounded-2xl bg-blue-500 px-5 py-3 font-bold text-white"
                      >
                        Probetraining abschließen
                      </button>
                    )}
                </div>
              </div>

              <div className="mt-6">
                <div
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-bold
  ${
    training.status === "PENDING"
      ? "bg-lime-100 text-lime-700"
      : training.status === "ACCEPTED"
        ? "bg-green-100 text-green-700"
        : training.status === "REJECTED"
          ? "bg-red-500/20 text-red-500"
          : "bg-blue-500/20 text-blue-500"
  }`}
                >
                  {training.status}
                </div>
                {training.feedback && (
                  <div className="mt-6 rounded-2xl bg-green-50 p-5 dark:bg-green-50">
                    <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                      Probetraining-Feedback
                    </p>

                    <p className="mt-3 leading-relaxed">{training.feedback}</p>
                  </div>
                )}
              </div>
              {training.status === "COMPLETED" &&
                training.player.attributes &&
                (() => {
                  const hasSavedReview =
                    savedReviews[training.id] ||
                    Boolean(training.feedback) ||
                    Boolean(training.rating);
                  const isReviewCollapsed =
                    hasSavedReview && expandedReviewId !== training.id;

                  if (isReviewCollapsed) {
                    return (
                      <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-4 dark:bg-green-50">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black uppercase tracking-[0.12em] text-green-700">
                              Probetraining-Bewertung
                            </p>
                            <p className="mt-1 text-sm font-semibold text-neutral-600">
                              Bewertung wurde gespeichert.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedReviewId(training.id)}
                            className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-bold text-green-700 transition hover:bg-green-100"
                          >
                            Bearbeiten
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-8 rounded-3xl bg-green-50 p-6 dark:bg-green-50">
                      <h3 className="mb-6 text-2xl font-bold">Probetraining-Bewertung</h3>

                      <div className="grid gap-5 md:grid-cols-2">
                        {Object.entries(training.player.attributes)
                          .filter(
                            ([key]) =>
                              !["id", "playerId", "reviewCount"].includes(key),
                          )
                          .map(([key, value]) => (
                            <div key={key}>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="capitalize font-semibold">
                                  {key}
                                </span>

                                <div className="flex gap-4 text-sm">
                                  <span className="text-neutral-500">
                                  Aktuell: {String(value)}
                                  </span>

                                  <span className="font-bold text-[var(--primary)]">
                                    Bewertet:{" "}
                                    {reviews[training.id]?.[key] ?? Number(value)}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <input
                                  type="range"
                                  min={1}
                                  max={99}
                                  value={
                                    reviews[training.id]?.[key] ?? Number(value)
                                  }
                                  onChange={(e) =>
                                    setReviews({
                                      ...reviews,

                                      [training.id]: {
                                        ...reviews[training.id],

                                        [key]: Number(e.target.value),
                                      },
                                    })
                                  }
                                  className="w-full accent-[var(--primary)]"
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="mt-8">
                        <h3 className="mb-4 text-xl font-bold">Scout-Feedback</h3>

                        <textarea
                          placeholder="Feedback zum Probetraining..."
                          value={feedbacks[training.id] || ""}
                          onChange={(e) =>
                            setFeedbacks({
                              ...feedbacks,

                              [training.id]: e.target.value,
                            })
                          }
                          className="min-h-[160px] w-full rounded-2xl border border-green-100 bg-white p-5 outline-none dark:border-green-100"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const reviewedAttributes = Object.fromEntries(
                            Object.entries(training.player.attributes ?? {})
                              .filter(
                                ([key]) =>
                                  !["id", "playerId", "reviewCount"].includes(key),
                              )
                              .map(([key, value]) => [
                                key,
                                reviews[training.id]?.[key] ?? Number(value),
                              ]),
                          );

                          await fetch(
                            `${API_URL}/trial-trainings/${training.id}/review`,
                            {
                              method: "PATCH",

                              headers: {
                                "Content-Type": "application/json",
                              },

                              body: JSON.stringify({
                                ...reviewedAttributes,

                                feedback: feedbacks[training.id],
                              }),
                            },
                          );

                          setSavedReviews((current) => ({
                            ...current,
                            [training.id]: true,
                          }));
                          setExpandedReviewId(null);
                          alert("Bewertung wurde gesendet.");
                        }}
                        className="mt-8 w-full rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 px-6 py-4 text-lg font-bold text-white"
                      >
                        Bewertung senden
                      </button>
                    </div>
                  );
                })()}
              {training.notes && training.status !== "COMPLETED" && (
                <div className="mt-6 rounded-2xl bg-green-50 p-5 dark:bg-green-50">
                  <p className="text-sm leading-relaxed">{training.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
