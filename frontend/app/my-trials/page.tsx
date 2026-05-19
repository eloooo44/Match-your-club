"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import PlayerNav from "@/src/components/PlayerNav";
import { mediaUrl } from "@/src/lib/media";

type Trial = {
  id: number;
  status: string;
  scheduledAt: string;
  notes?: string;
  feedback?: string | null;
  rating?: {
    id: number;
    comment?: string | null;
    score?: number | null;
    tempo?: number | null;
    shooting?: number | null;
    passing?: number | null;
    dribbling?: number | null;
    defending?: number | null;
    physical?: number | null;
  } | null;
  initiatedBy: string;
  alternativeDate1?: string | null;
  alternativeDate2?: string | null;
  alternativeDate3?: string | null;
  selectedDate?: string | null;
  club: {
    clubName: string;
    logoPath?: string | null;
    sportsGroundName?: string | null;
    sportsGroundAddress?: string | null;
    sportsGroundZipCode?: string | null;
    sportsGroundCity?: string | null;
  };
};

type PlayerProfile = {
  id: number;
};

import { API_BASE } from "@/src/lib/apiBase";

const statusLabels: Record<string, string> = {
  PENDING: "Offen",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
  COMPLETED: "Abgeschlossen",
};

const getEffectiveTrialDate = (trial: Trial) =>
  trial.selectedDate || trial.scheduledAt;

const isTrialRunning = (trial: Trial) => {
  const effectiveTrialDate = getEffectiveTrialDate(trial);

  if (!effectiveTrialDate || trial.status !== "ACCEPTED") {
    return false;
  }

  const now = Date.now();
  const startsAt = new Date(effectiveTrialDate).getTime();
  const endsAt = startsAt + 2 * 60 * 60 * 1000;

  return now >= startsAt && now <= endsAt;
};

export default function MyTrialsPage() {
  const router = useRouter();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [chosenDates, setChosenDates] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTrials = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const profileResponse = await fetch(`${API_BASE}/api/players/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Spielerprofil konnte nicht geladen werden.");
      }

      const profile = (await profileResponse.json()) as PlayerProfile;

      const trialsResponse = await fetch(
        `${API_BASE}/api/trial-trainings/player/${profile.id}`,
      );

      if (!trialsResponse.ok) {
        throw new Error("Probetrainings konnten nicht geladen werden.");
      }

      setTrials((await trialsResponse.json()) as Trial[]);
    } catch (loadError) {
      setError((loadError as Error).message);
      setTrials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrials();
  }, []);

  const updateTrial = async (
    id: number,
    body: { status: string; selectedDate?: string },
  ) => {
    const response = await fetch(`${API_BASE}/api/trial-trainings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message || "Probetraining konnte nicht geändert werden.");
    }

    setTrials((current) =>
      current.map((trial) =>
        trial.id === id
          ? {
              ...trial,
              status: body.status,
              selectedDate: body.selectedDate ?? trial.selectedDate,
            }
          : trial,
      ),
    );
  };

  const availableDates = selectedTrial
    ? [
        selectedTrial.scheduledAt,
        selectedTrial.alternativeDate1,
        selectedTrial.alternativeDate2,
        selectedTrial.alternativeDate3,
      ].filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-[#f6faf7] px-6 py-10 text-black sm:px-8">
      <div className="mx-auto max-w-7xl">
        <PlayerNav />
        <h1 className="mb-3 text-5xl font-black">Meine Probetrainings</h1>
        <p className="mb-10 text-sm font-semibold text-neutral-500">
          Alle Probetraining-Einladungen, die du von Clubs erhalten hast.
        </p>

        {error && (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        {loading && (
          <div className="rounded-3xl bg-white p-8 font-bold text-neutral-500">
            Lädt...
          </div>
        )}

        {!loading && trials.length === 0 && (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-10">
            <h2 className="text-2xl font-black">Noch keine Einladungen</h2>
            <p className="mt-3 text-sm font-semibold text-neutral-500">
              Sobald ein Club dich zum Probetraining einlädt, erscheint die
              Einladung hier.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {trials.map((trial) => (
            <article
              key={trial.id}
              className="rounded-3xl border border-green-100 bg-white p-8 shadow-[0_10px_30px_rgba(34,197,94,0.08)]"
            >
              {(() => {
                const isReviewed = Boolean(trial.rating || trial.feedback?.trim());
                const reviewText = trial.rating?.comment || trial.feedback;
                const ratingAttributes = trial.rating
                  ? [
                      ["Tempo", trial.rating.tempo],
                      ["Schuss", trial.rating.shooting],
                      ["Pässe", trial.rating.passing],
                      ["Dribbling", trial.rating.dribbling],
                      ["Defensive", trial.rating.defending],
                      ["Physis", trial.rating.physical],
                    ].filter((entry): entry is [string, number] =>
                      typeof entry[1] === "number",
                    )
                  : [];
                const trialRunning = isTrialRunning(trial);

                return (
                  <>
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <img
                    src={
                      trial.club.logoPath
                        ? mediaUrl(trial.club.logoPath, API_BASE) ||
                          "https://placehold.co/120x120"
                        : "https://placehold.co/120x120"
                    }
                    alt={trial.club.clubName}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-3xl font-black">
                      {trial.club.clubName}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-neutral-500">
                      Haupttermin:{" "}
                      {new Date(trial.scheduledAt).toLocaleString("de-AT")}
                    </p>
                    {trial.selectedDate && (
                      <p className="mt-1 text-sm font-bold text-green-700">
                        Gewählt:{" "}
                        {new Date(trial.selectedDate).toLocaleString("de-AT")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isReviewed ? (
                    <span className="rounded-2xl bg-blue-100 px-6 py-3 font-black text-blue-700">
                      Bewertet
                    </span>
                  ) : trialRunning ? (
                    <span className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-3 font-black text-amber-700">
                      Trial läuft
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSelectedTrial(trial);
                          setChosenDates((current) => ({
                            ...current,
                            [trial.id]: trial.selectedDate || trial.scheduledAt,
                          }));
                          setShowDateModal(true);
                        }}
                        disabled={trial.status === "COMPLETED" || isReviewed}
                        className="rounded-2xl bg-green-600 px-6 py-3 font-black text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
                      >
                        {trial.status === "ACCEPTED" && trial.selectedDate
                          ? "Termin bearbeiten"
                          : "Termin auswählen"}
                      </button>
                      <button
                        onClick={() => updateTrial(trial.id, { status: "REJECTED" })}
                        disabled={trial.status === "REJECTED" || trial.status === "COMPLETED" || isReviewed}
                        className="rounded-2xl border border-red-200 px-6 py-3 font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300"
                      >
                        Ablehnen
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${
                    isReviewed
                      ? "bg-blue-100 text-blue-700"
                      : trial.status === "PENDING"
                      ? "bg-lime-100 text-lime-700"
                      : trial.status === "ACCEPTED"
                        ? "bg-green-100 text-green-700"
                        : trial.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {isReviewed ? "Bewertet" : statusLabels[trial.status] || trial.status}
                </span>
                {trial.status === "REJECTED" && (
                  <button
                    onClick={() => updateTrial(trial.id, { status: "PENDING" })}
                    className="ml-3 rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Entscheidung ändern
                  </button>
                )}
              </div>

              {isReviewed ? (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                        Bewertung vom Club
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-blue-900">
                        {reviewText || "Der Club hat deine Leistung bewertet."}
                      </p>
                    </div>
                    {typeof trial.rating?.score === "number" && (
                      <span className="rounded-2xl bg-blue-600 px-4 py-2 text-lg font-black text-white">
                        {trial.rating.score}/99
                      </span>
                    )}
                  </div>
                  {ratingAttributes.length > 0 && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {ratingAttributes.map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl bg-white px-4 py-3"
                        >
                          <p className="text-xs font-black uppercase tracking-[0.08em] text-blue-400">
                            {label}
                          </p>
                          <p className="mt-1 text-base font-black text-blue-950">
                            {value}/99
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : trial.notes && (
                <div className="mt-6 rounded-2xl bg-green-50 p-5">
                  <p className="text-sm leading-relaxed">{trial.notes}</p>
                </div>
              )}

              {!isReviewed && (trial.status === "ACCEPTED" || trial.selectedDate) && (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-green-700">
                    Sportplatz
                  </p>
                  <p className="mt-2 text-base font-black text-green-900">
                    {trial.club.sportsGroundName ||
                      "Sportplatz wird vom Club noch bekanntgegeben."}
                  </p>
                  {(trial.club.sportsGroundAddress ||
                    trial.club.sportsGroundZipCode ||
                    trial.club.sportsGroundCity) && (
                    <p className="mt-1 text-sm font-semibold text-green-800">
                      {[
                        trial.club.sportsGroundAddress,
                        [trial.club.sportsGroundZipCode, trial.club.sportsGroundCity]
                          .filter(Boolean)
                          .join(" "),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      </div>

      {showDateModal && selectedTrial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 text-black shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black">Termin auswählen</h2>
                <p className="mt-2 text-neutral-500">
                  Wähle einen der verfügbaren Termine.
                </p>
              </div>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-3xl font-bold"
              >
                x
              </button>
            </div>

            <div className="space-y-4">
              {availableDates.map((date, index) => (
                <button
                  key={`${date}-${index}`}
                  onClick={() =>
                    setChosenDates((current) => ({
                      ...current,
                      [selectedTrial.id]: date!,
                    }))
                  }
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 transition ${
                    chosenDates[selectedTrial.id] === date
                      ? "border-green-500 bg-green-50"
                      : "border-green-100"
                  }`}
                >
                  <span>{new Date(date!).toLocaleString("de-AT")}</span>
                  <span className="text-sm font-black text-green-600">
                    {new Date(date!).getTime() ===
                    new Date(selectedTrial.scheduledAt).getTime()
                      ? "Haupttermin"
                      : "Alternative"}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={async () => {
                await updateTrial(selectedTrial.id, {
                  selectedDate: chosenDates[selectedTrial.id],
                  status: "ACCEPTED",
                });
                setShowDateModal(false);
                setSelectedTrial(null);
              }}
              className="mt-8 w-full rounded-2xl bg-green-600 px-6 py-4 text-lg font-black text-white transition hover:bg-green-500"
            >
              Auswahl bestätigen
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
