"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import ClubNav from "@/src/components/ClubNav";

type TrialTraining = {
  id: number;
  status: string;
  scheduledAt: string;
  alternativeDate1?: string | null;
  alternativeDate2?: string | null;
  alternativeDate3?: string | null;
  selectedDate?: string;
  notes?: string;
  feedback?: string;
  rating?: {
    id: number;
  } | null;
  player: {
    id: number;
    name: string;
    position: string[] | string;
    reviewCount?: number;
    profileImagePath?: string;
    profileImageUrl?: string;
    skills?: string[];
    highlightedSkills?: string[];
    attributes?: {
      tempo: number;
      shooting: number;
      passing: number;
      dribbling: number;
      defending: number;
      physical: number;
      reviewCount?: number;
    };
  };
};

type ClubProfile = {
  id: number;
  clubName: string;
};

import { API_BASE } from "@/src/lib/apiBase";

const skillLabels: Record<string, string> = {
  REFLEXE: "Reflexe",
  STRAFRAUMBEHERRSCHUNG: "Strafraumbeherrschung",
  ZWEIKAMPFSTAERKE: "Zweikampfstärke",
  KOPFBALLSPIEL: "Kopfballspiel",
  SPIELAUFBAU: "Spielaufbau",
  PASSGENAUIGKEIT: "Passgenauigkeit",
  SPIELUEBERSICHT: "Spielübersicht",
  TEMPO: "Tempo",
  DRIBBLING: "Dribbling",
  AUSDAUER: "Ausdauer",
  PHYSIS: "Physis",
  DEFENSIVARBEIT: "Defensivarbeit",
  PRESSING: "Pressing",
  FLANKENSPIEL: "Flankenspiel",
  BALLKONTROLLE: "Ballkontrolle",
  ABSCHLUSS: "Abschluss",
  EINS_GEGEN_EINS: "Eins-gegen-Eins",
  HOHE_BAELLE: "Hohe Bälle",
  ABSTOESSE: "Abstöße",
  SPIELEROEFFNUNG: "Spieleröffnung",
  KOMMUNIKATION: "Kommunikation",
  STELLUNGSSPIEL: "Stellungsspiel",
  FANGSICHERHEIT: "Fangsicherheit",
  REAKTIONSSCHNELLIGKEIT: "Reaktionsschnelligkeit",
  ELFMETER: "Elfmeter-Killer",
  MITSPIELENDER_TORMANN: "Mitspielender Tormann",
};

const formatPositions = (positions: string[] | string) =>
  Array.isArray(positions) ? positions.join(", ") : positions;

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const dateTimeValueFromString = (value?: string | null) =>
  value ? toLocalInputValue(new Date(value)) : "";

const getEffectiveTrialDate = (training: TrialTraining) =>
  training.selectedDate || training.scheduledAt;

const getTrialWindowState = (training: TrialTraining) => {
  const effectiveTrialDate = getEffectiveTrialDate(training);

  if (!effectiveTrialDate || training.status !== "ACCEPTED") {
    return {
      isRunning: false,
      canComplete: false,
    };
  }

  const now = Date.now();
  const startsAt = new Date(effectiveTrialDate).getTime();
  const endsAt = startsAt + 2 * 60 * 60 * 1000;

  return {
    isRunning: now >= startsAt && now <= endsAt,
    canComplete: now > endsAt,
  };
};

export default function ClubTrialTrainingsPage() {
  const searchParams = useSearchParams();
  const playerIdFromApplication = searchParams.get("playerId") || "";
  const playerNameFromApplication = searchParams.get("playerName") || "";

  const [club, setClub] = useState<ClubProfile | null>(null);
  const [trainings, setTrainings] = useState<TrialTraining[]>([]);
  const [reviews, setReviews] = useState<Record<number, Record<string, number>>>(
    {},
  );
  const [skillReviews, setSkillReviews] = useState<
    Record<number, Record<string, number>>
  >({});
  const [feedbacks, setFeedbacks] = useState<Record<number, string>>({});
  const [savedReviews, setSavedReviews] = useState<Record<number, boolean>>({});
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(
    null,
  );
  const [pendingReviewTrainingId, setPendingReviewTrainingId] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activePlayerId, setActivePlayerId] = useState(playerIdFromApplication);
  const [activePlayerName, setActivePlayerName] = useState(
    playerNameFromApplication,
  );
  const [activeTrainingId, setActiveTrainingId] = useState<number | null>(null);
  const [showInviteCard, setShowInviteCard] = useState(
    Boolean(playerIdFromApplication),
  );
  const [trialForm, setTrialForm] = useState({
    scheduledAt: toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    alternative1: "",
    alternative2: "",
    alternative3: "",
    notes: playerNameFromApplication
      ? `Einladung zum Probetraining für ${playerNameFromApplication}.`
      : "Einladung zum Probetraining.",
  });

  const loadTrainings = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Bitte melde dich als Club an.");
      }

      const clubResponse = await fetch(`${API_BASE}/api/clubs/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!clubResponse.ok) {
        throw new Error("Clubprofil konnte nicht geladen werden.");
      }

      const clubProfile = (await clubResponse.json()) as ClubProfile;
      setClub(clubProfile);

      const trainingsResponse = await fetch(
        `${API_BASE}/api/trial-trainings/club/${clubProfile.id}`,
      );

      if (!trainingsResponse.ok) {
        throw new Error("Probetrainings konnten nicht geladen werden.");
      }

      setTrainings((await trainingsResponse.json()) as TrialTraining[]);
    } catch (loadError) {
      setError((loadError as Error).message);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, []);

  const createTrialInvitation = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!club) {
        throw new Error("Clubprofil konnte nicht geladen werden.");
      }

      if (!activePlayerId) {
        throw new Error("Kein Spieler aus einer Bewerbung ausgewählt.");
      }

      if (!trialForm.scheduledAt) {
        throw new Error("Bitte einen Haupttermin auswählen.");
      }

      const payload = {
        playerId: Number(activePlayerId),
        clubId: club.id,
        scheduledAt: new Date(trialForm.scheduledAt).toISOString(),
        alternativeDate1: trialForm.alternative1
          ? new Date(trialForm.alternative1).toISOString()
          : null,
        alternativeDate2: trialForm.alternative2
          ? new Date(trialForm.alternative2).toISOString()
          : null,
        alternativeDate3: trialForm.alternative3
          ? new Date(trialForm.alternative3).toISOString()
          : null,
        notes: trialForm.notes,
      };

      const response = await fetch(
        activeTrainingId
          ? `${API_BASE}/api/trial-trainings/${activeTrainingId}`
          : `${API_BASE}/api/trial-trainings`,
        {
          method: activeTrainingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || "Einladung fehlgeschlagen.");
      }

      setMessage(
        activeTrainingId
          ? "Probetraining wurde aktualisiert."
          : "Probetraining wurde erstellt.",
      );
      await loadTrainings();
      setActiveTrainingId(null);
      setShowInviteCard(false);
    } catch (createError) {
      setError((createError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openInviteEditor = (training: TrialTraining) => {
    if (training.status === "COMPLETED") {
      setError("Abgeschlossene Probetrainings können nicht mehr umgeplant werden.");
      return;
    }

    setActivePlayerId(String(training.player.id));
    setActivePlayerName(training.player.name);
    setActiveTrainingId(training.id);
    setTrialForm({
      scheduledAt: dateTimeValueFromString(training.scheduledAt),
      alternative1: dateTimeValueFromString(training.alternativeDate1),
      alternative2: dateTimeValueFromString(training.alternativeDate2),
      alternative3: dateTimeValueFromString(training.alternativeDate3),
      notes:
        training.notes ||
        `Einladung zum Probetraining für ${training.player.name}.`,
    });
    setShowInviteCard(true);
    setMessage("");
    setError("");
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`${API_BASE}/api/trial-trainings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    setTrainings((prev) =>
      prev.map((training) =>
        training.id === id ? { ...training, status } : training,
      ),
    );
  };

  const saveReview = async (training: TrialTraining) => {
    if (!training.player.attributes) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const reviewedAttributes = Object.fromEntries(
        Object.entries(training.player.attributes)
          .filter(
            ([key]) => !["id", "playerId", "reviewCount"].includes(key),
          )
          .map(([key, value]) => [
            key,
            reviews[training.id]?.[key] ?? Number(value),
          ]),
      );

      const response = await fetch(
        `${API_BASE}/api/trial-trainings/${training.id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...reviewedAttributes,
            feedback: feedbacks[training.id],
            skillRatings: Object.fromEntries(
              (training.player.skills ?? []).map((skill) => [
                skill,
                skillReviews[training.id]?.[skill] ?? 3,
              ]),
            ),
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message || "Bewertung konnte nicht gespeichert werden.",
        );
      }

      setSavedReviews((current) => ({
        ...current,
        [training.id]: true,
      }));
      setExpandedReviewId(null);
      setPendingReviewTrainingId(null);
      setMessage("Bewertung gespeichert.");
      await loadTrainings();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6faf7] px-6 py-10 text-black">
      <div className="mx-auto max-w-7xl">
        <ClubNav />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-green-700">
              {club?.clubName || "Club"}
            </p>
            <h1 className="mt-2 text-5xl font-black">Probetrainings</h1>
          </div>
          <Link
            href="/club/applications"
            className="rounded-2xl border border-green-200 px-5 py-3 text-sm font-black text-green-700 transition hover:bg-green-50"
          >
            Zurück zu Bewerbungen
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </p>
        )}

        {activePlayerId && showInviteCard && (
          <section className="mb-8 rounded-3xl border border-green-100 bg-white p-6 shadow-[0_10px_30px_rgba(34,197,94,0.08)]">
            <div className="mb-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-green-700">
                Probetraining einladen
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {activePlayerName || "Ausgewählter Spieler"}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Haupttermin", "scheduledAt"],
                ["Alternative 1", "alternative1"],
                ["Alternative 2", "alternative2"],
                ["Alternative 3", "alternative3"],
              ].map(([label, key]) => (
                <label key={key}>
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                    {label}
                  </span>
                  <input
                    type="datetime-local"
                    value={trialForm[key as keyof typeof trialForm]}
                    onChange={(event) =>
                      setTrialForm((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-semibold outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
                  />
                </label>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                Nachricht
              </span>
              <textarea
                value={trialForm.notes}
                onChange={(event) =>
                  setTrialForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-2xl border border-green-100 bg-white p-4 text-sm font-semibold outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={createTrialInvitation}
                disabled={saving}
                className="rounded-2xl bg-green-600 px-6 py-4 text-sm font-black text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {saving
                  ? "Wird gespeichert..."
                  : activeTrainingId
                    ? "Probetraining aktualisieren"
                    : "Probetraining erstellen"}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteCard(false)}
                className="rounded-2xl border border-neutral-200 px-6 py-4 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
              >
                Schließen
              </button>
            </div>
          </section>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 font-bold text-neutral-500">
            Lädt...
          </div>
        ) : (
          <div className="space-y-6">
            {trainings.length === 0 && (
              <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-8 font-semibold text-neutral-500">
                Noch keine Probetrainings geplant.
              </div>
            )}

            {trainings.map((training) => (
              <div
                key={training.id}
                className="rounded-3xl border border-green-100 bg-white p-8 shadow-[0_10px_30px_rgba(34,197,94,0.08)]"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-5">
                    <img
                      src={
                        training.player.profileImagePath
                          ? `${API_BASE}/${training.player.profileImagePath}`
                          : training.player.profileImageUrl ||
                            "https://placehold.co/120x120"
                      }
                      alt={training.player.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                    <div>
                      <Link
                        href={`/player/${training.player.id}`}
                        className="text-3xl font-black hover:text-green-700"
                      >
                        {training.player.name}
                      </Link>
                      <p className="mt-1 text-neutral-500">
                        {formatPositions(training.player.position)}
                      </p>
                      <p className="mt-3 text-sm">
                        Haupttermin:{" "}
                        {new Date(training.scheduledAt).toLocaleString("de-AT")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {(() => {
                      const trialWindow = getTrialWindowState(training);

                      if (trialWindow.isRunning) {
                        return (
                          <span className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 font-bold text-amber-700">
                            Trial läuft
                          </span>
                        );
                      }

                      return training.status !== "COMPLETED" ? (
                        <button
                          type="button"
                          onClick={() => openInviteEditor(training)}
                          className="rounded-2xl border border-green-200 px-5 py-3 font-bold text-green-700 transition hover:bg-green-50"
                        >
                          Bearbeiten
                        </button>
                      ) : null;
                    })()}
                    {(() => {
                      const trialWindow = getTrialWindowState(training);

                      return trialWindow.canComplete ? (
                          <button
                            onClick={() => updateStatus(training.id, "COMPLETED")}
                            className="rounded-2xl bg-blue-500 px-5 py-3 font-bold text-white"
                          >
                            Abschließen
                          </button>
                        ) : null;
                    })()}
                  </div>
                </div>

                <div className="mt-6">
                  <div
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${
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
                  {training.notes && training.status !== "COMPLETED" && (
                    <div className="mt-6 rounded-2xl bg-green-50 p-5">
                      <p className="text-sm leading-relaxed">
                        {training.notes}
                      </p>
                    </div>
                  )}
                  {training.feedback && (
                    <div className="mt-6 rounded-2xl bg-green-50 p-5">
                      <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                        Probetraining-Feedback
                      </p>
                      <p className="mt-3 leading-relaxed">
                        {training.feedback}
                      </p>
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
                        <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-[0.12em] text-green-700">
                                Probetraining-Bewertung
                              </p>
                              <p className="mt-1 text-sm font-semibold text-neutral-600">
                                {hasSavedReview
                                  ? "Bewertung wurde gespeichert."
                                  : "Bewertungsskala ist eingeklappt."}
                              </p>
                            </div>
                            {!hasSavedReview && (
                              <button
                                type="button"
                                onClick={() => setExpandedReviewId(training.id)}
                                className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-bold text-green-700 transition hover:bg-green-100"
                              >
                                Bewertung öffnen
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="mt-8 rounded-3xl bg-green-50 p-6">
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
                                  <span className="font-bold text-green-700">
                                    {reviews[training.id]?.[key] ?? Number(value)}
                                    /99
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={1}
                                  max={99}
                                  value={reviews[training.id]?.[key] ?? Number(value)}
                                  onChange={(event) =>
                                    setReviews((current) => ({
                                      ...current,
                                      [training.id]: {
                                        ...current[training.id],
                                        [key]: Number(event.target.value),
                                      },
                                    }))
                                  }
                                  className="w-full accent-green-500"
                                />
                              </div>
                            ))}
                        </div>

                        <textarea
                          placeholder="Feedback zum Probetraining..."
                          value={feedbacks[training.id] || ""}
                          onChange={(event) =>
                            setFeedbacks((current) => ({
                              ...current,
                              [training.id]: event.target.value,
                            }))
                          }
                          className="mt-6 min-h-[140px] w-full rounded-2xl border border-green-100 bg-white p-5 outline-none"
                        />

                        {training.player.skills && training.player.skills.length > 0 && (
                          <div className="mt-6 rounded-2xl bg-white p-5">
                            <div className="mb-5">
                              <h4 className="text-xl font-black">
                                Fähigkeiten bewerten
                              </h4>
                              <p className="mt-1 text-sm font-semibold text-neutral-500">
                                Bewerte die vom Spieler angegebenen Skills mit 0.5 bis 5 Sternen.
                              </p>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                              {training.player.skills.map((skill) => {
                                const value = skillReviews[training.id]?.[skill] ?? 3;
                                const highlighted =
                                  training.player.highlightedSkills?.includes(skill);

                                return (
                                  <div
                                    key={skill}
                                    className="rounded-2xl border border-green-100 bg-green-50 p-4"
                                  >
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                      <div>
                                        <p className="font-black">
                                          {skillLabels[skill] ?? skill}
                                        </p>
                                        {highlighted && (
                                          <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-amber-600">
                                            Hervorgehoben
                                          </p>
                                        )}
                                      </div>
                                      <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-green-700">
                                        {value.toFixed(1)}/5
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={0.5}
                                      max={5}
                                      step={0.5}
                                      value={value}
                                      onChange={(event) =>
                                        setSkillReviews((current) => ({
                                          ...current,
                                          [training.id]: {
                                            ...current[training.id],
                                            [skill]: Number(event.target.value),
                                          },
                                        }))
                                      }
                                      className="w-full accent-green-500"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setPendingReviewTrainingId(training.id)}
                          disabled={saving}
                          className="mt-5 w-full rounded-2xl bg-green-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
                        >
                          Bewertung speichern
                        </button>
                      </div>
                    );
                  })()}
              </div>
            ))}
          </div>
        )}
      </div>
      {pendingReviewTrainingId !== null && (
        <div className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="modal-panel w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-red-600">
              Bewertung final speichern
            </p>
            <h2 className="mt-3 text-2xl font-black">
              Willst du die Bewertung wirklich speichern?
            </h2>
            <p className="mt-4 leading-7 text-neutral-600">
              Andere Vereine und der Spieler sehen deine Bewertung. Die
              Bewertung kann danach nicht mehr geändert werden.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingReviewTrainingId(null)}
                disabled={saving}
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  const training = trainings.find(
                    (item) => item.id === pendingReviewTrainingId,
                  );
                  if (training) {
                    void saveReview(training);
                  }
                }}
                className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {saving ? "Wird gespeichert..." : "Trotzdem speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
