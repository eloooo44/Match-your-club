"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import BackToPreviousPage from "@/src/components/BackToPreviousPage";
import { apiFetch } from "@/services/api";
import { mediaUrl } from "@/src/lib/media";

type PlayerVideo = {
  id: number;
  title: string;
  videoUrl?: string | null;
  videoPath?: string | null;
};

type PlayerRating = {
  id: number;
  ratingType: string;
  score: number;
  comment?: string | null;
  skillRatings?: {
    id: number;
    skill: string;
    stars: number;
  }[];
  tempo?: number | null;
  shooting?: number | null;
  passing?: number | null;
  dribbling?: number | null;
  defending?: number | null;
  physical?: number | null;
  fromUser?: {
    email: string;
    role: string;
  };
  trialTraining?: {
    club?: {
      clubName?: string | null;
      logoPath?: string | null;
    } | null;
  } | null;
};

type ClubHistoryEntry = {
  id: number;
  clubName: string;
  relationType: string;
  teamCategory?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  games?: number | null;
  goals?: number | null;
  yellowCards?: number | null;
  redCards?: number | null;
};

type PlayerTrialTraining = {
  id: number;
  status: string;
  feedback?: string | null;
  club?: {
    clubName?: string | null;
    logoPath?: string | null;
    user?: {
      email?: string | null;
    };
  };
};

type Player = {
  id: number;
  userId: number;
  name: string;
  position: string[];
  location: string;
  description?: string | null;
  openToPlay: boolean;
  oefbProfileUrl?: string | null;
  profileImageUrl?: string | null;
  profileImagePath?: string | null;
  birthdate?: string;
  skills?: string[];
  highlightedSkills?: string[];
  preferredFoot?: string | null;
  weakFootRating?: number | null;
  heightCm?: number | null;
  attributes?: {
    tempo: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    reviewCount?: number;
  } | null;
  videos?: PlayerVideo[];
  ratings?: PlayerRating[];
  clubHistory?: ClubHistoryEntry[];
  trialTrainings?: PlayerTrialTraining[];
};

type EditProfileForm = {
  name: string;
  position: string[];
  birthdate: string;
  location: string;
  description: string;
  openToPlay: boolean;
};

import { API_BASE as apiBaseUrl } from "@/src/lib/apiBase";
const positionOptions = ["GK", "IV", "LV", "RV", "ZDM", "ZM", "ZOM", "ST", "LF", "RF"];
const attributeLabels: Record<string, string> = {
  tempo: "Tempo",
  shooting: "Schuss",
  passing: "Pässe",
  dribbling: "Dribbling",
  defending: "Defensive",
  physical: "Physis",
};
const attributeKeys = ["tempo", "shooting", "passing", "dribbling", "defending", "physical"] as const;
const skillLabels: Record<string, string> = {
  REFLEXE: "Reflexe",
  STRAFRAUMBEHERRSCHUNG: "Strafraumbeherrschung",
  ZWEIKAMPFSTAERKE: "Zweikampfstärke",
  ZWEIKAMPFSTÄRKE: "Zweikampfstärke",
  KOPFBALLSPIEL: "Kopfballspiel",
  SPIELAUFBAU: "Spielaufbau",
  PASSGENAUIGKEIT: "Passgenauigkeit",
  SPIELUEBERSICHT: "Spielübersicht",
  SPIELÜBERSICHT: "Spielübersicht",
  TEMPO: "Tempo",
  TORABSCHLUSS: "Torabschluss",
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
  FUSSSPIEL: "Fußspiel",
  ABSTOESSE: "Abstöße",
  ABSCHLAEGE: "Abschläge",
  SPIELEROEFFNUNG: "Spieleröffnung",
  KOMMUNIKATION: "Kommunikation",
  STELLUNGSSPIEL: "Stellungsspiel",
  FANGSICHERHEIT: "Fangsicherheit",
  REAKTIONSSCHNELLIGKEIT: "Reaktionsschnelligkeit",
  ELFMETER: "Elfmeter-Killer",
  MITSPIELENDER_TORMANN: "Mitspielender Tormann",
};

const formatPositions = (positions?: string[] | string) => {
  if (!positions) return "Nicht angegeben";
  return Array.isArray(positions) ? positions.join(", ") : positions;
};

const formatAge = (birthdate?: string) => {
  if (!birthdate) return "Nicht angegeben";
  const match = birthdate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const birthday = match
    ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
    : new Date(birthdate);

  if (Number.isNaN(birthday.getTime())) return "Nicht angegeben";

  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDelta = today.getMonth() - birthday.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthday.getDate())) age -= 1;
  return `${age} Jahre`;
};

const toDateInputValue = (birthdate?: string) => {
  const match = birthdate?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
};

const toStoredBirthdate = (value: string) => {
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}/${year}` : "";
};

const formatYearRange = (startDate?: string | null, endDate?: string | null) => {
  const start = startDate ? new Date(startDate).getFullYear() : undefined;
  const end = endDate ? new Date(endDate).getFullYear() : undefined;

  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - Heute`;
  return "Zeitraum offen";
};

const ratingToPercent = (score: number) => {
  return score <= 5 ? Math.round(score * 20) : Math.round(score);
};

const getRatingAttributeScore = (rating: PlayerRating) => {
  const values = attributeKeys.map((key) => rating[key]);

  if (values.every((value) => typeof value === "number")) {
    return Math.round(
      (values as number[]).reduce((sum, value) => sum + value, 0) /
        values.length,
    );
  }

  return ratingToPercent(rating.score);
};

const ratingTypeLabels: Record<string, string> = {
  TRIAL: "Probetraining-Bewertung",
};

const getEmbeddableVideoUrl = (url?: string | null) => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId =
        parsedUrl.searchParams.get("v") ||
        parsedUrl.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "vimeo.com") {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`}>
    {children}
  </section>
);

export default function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [player, setPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "career" | "ratings">("about");
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [closingEditProfile, setClosingEditProfile] = useState(false);
  const [closingVideoModal, setClosingVideoModal] = useState(false);
  const [editForm, setEditForm] = useState<EditProfileForm | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadPlayer = async () => {
    const response = await fetch(`${apiBaseUrl}/api/players`);
    const players = (await response.json()) as Player[];
    const foundPlayer = players.find((playerItem) => playerItem.id === Number(id));

    if (!foundPlayer) {
      setPlayer(null);
      return;
    }

    setPlayer(foundPlayer);
    setEditForm({
      name: foundPlayer.name,
      position: foundPlayer.position,
      birthdate: toDateInputValue(foundPlayer.birthdate),
      location: foundPlayer.location,
      description: foundPlayer.description ?? "",
      openToPlay: foundPlayer.openToPlay,
    });

    const userId = Number(localStorage.getItem("userId"));
    const role = localStorage.getItem("userRole");
    setIsOwnProfile(role === "player" && userId === foundPlayer.userId);
  };

  useEffect(() => {
    loadPlayer().catch(() => setPlayer(null));
  }, [id]);

  const imageUrl =
    mediaUrl(player?.profileImagePath || player?.profileImageUrl, apiBaseUrl) ||
    "https://placehold.co/300x300";

  const overallScore = useMemo(() => {
    if (!player?.attributes) return null;
    const values = [
      player.attributes.tempo,
      player.attributes.shooting,
      player.attributes.passing,
      player.attributes.dribbling,
      player.attributes.defending,
      player.attributes.physical,
    ];
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [player]);

  const skills = useMemo(() => {
    const highlightedSkillSet = new Set(player?.highlightedSkills ?? []);

    return (player?.skills ?? []).map((skill) => ({
      key: skill,
      label: skillLabels[skill] ?? skill,
      highlighted: highlightedSkillSet.has(skill),
    }));
  }, [player]);

  const skillRatingSummaries = useMemo(() => {
    const highlightedSkillSet = new Set(player?.highlightedSkills ?? []);
    const playerSkillSet = new Set(player?.skills ?? []);
    const grouped = new Map<
      string,
      { total: number; count: number; confirmed: boolean }
    >();

    for (const rating of player?.ratings ?? []) {
      for (const skillRating of rating.skillRatings ?? []) {
        if (!playerSkillSet.has(skillRating.skill)) {
          continue;
        }

        const current =
          grouped.get(skillRating.skill) ?? {
            total: 0,
            count: 0,
            confirmed: false,
          };

        current.total += Number(skillRating.stars);
        current.count += 1;
        current.confirmed =
          current.confirmed ||
          (highlightedSkillSet.has(skillRating.skill) &&
            Number(skillRating.stars) >= 4.5);
        grouped.set(skillRating.skill, current);
      }
    }

    return Array.from(playerSkillSet).map((skill) => {
      const summary = grouped.get(skill);
      return {
        skill,
        label: skillLabels[skill] ?? skill,
        highlighted: highlightedSkillSet.has(skill),
        average: summary ? summary.total / summary.count : null,
        count: summary?.count ?? 0,
        confirmed: summary?.confirmed ?? false,
      };
    });
  }, [player]);

  const averageRating = useMemo(() => {
    const ratings = player?.ratings ?? [];
    if (ratings.length === 0) {
      return null;
    }
    const average = ratings.reduce((sum, rating) => sum + getRatingAttributeScore(rating), 0) / ratings.length;
    return Math.round(average);
  }, [player]);

  const externalAttributeAverages = useMemo(() => {
    const ratings = player?.ratings ?? [];
    const ratingsWithAttributes = ratings.filter((rating) =>
      attributeKeys.every((key) => typeof rating[key] === "number"),
    );

    if (ratingsWithAttributes.length === 0) {
      return null;
    }

    return attributeKeys.reduce(
      (averages, key) => ({
        ...averages,
        [key]: Math.round(
          ratingsWithAttributes.reduce(
            (sum, rating) => sum + Number(rating[key] ?? 0),
            0,
          ) / ratingsWithAttributes.length,
        ),
      }),
      {} as Record<(typeof attributeKeys)[number], number>,
    );
  }, [player]);

  const clubHistory = player?.clubHistory ?? [];
  const currentClubEntry = clubHistory.find((entry) => !entry.endDate);
  const lastClubEntry = clubHistory[0];
  const isSearchingWithoutClub = Boolean(player?.openToPlay && !currentClubEntry);
  const clubStatusLabel = isSearchingWithoutClub ? "Status" : "Aktueller Verein";
  const clubStatusValue = isSearchingWithoutClub
    ? "Auf der Suche"
    : currentClubEntry?.clubName ?? "Nicht angegeben";
  const lastStationValue = lastClubEntry?.clubName ?? "Keine letzte Station hinterlegt";

  const togglePosition = (position: string) => {
    setEditForm((current) => {
      if (!current) return current;
      const selected = current.position.includes(position);
      const nextPositions = selected
        ? current.position.filter((item) => item !== position)
        : current.position.length >= 3
          ? current.position
          : [...current.position, position];
      return { ...current, position: nextPositions };
    });
  };

  const saveProfile = async () => {
    if (!editForm) return;
    if (editForm.position.length === 0) {
      setError("Mindestens eine Position auswählen.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const updatedPlayer = (await apiFetch("/players/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          position: editForm.position,
          birthdate: toStoredBirthdate(editForm.birthdate),
          location: editForm.location,
          description: editForm.description,
          openToPlay: editForm.openToPlay,
        }),
      })) as Player;
      setPlayer(updatedPlayer);
      closeEditProfileModal();
    } catch (err) {
      setError((err as Error).message || "Profil konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOwnProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setDeleteError("Du musst angemeldet sein, um dein Profil zu löschen.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      await apiFetch("/players/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("oefbProfileUrl");

      router.replace("/");
    } catch (err) {
      setDeleteError(
        (err as Error).message || "Profil konnte nicht gelöscht werden.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditProfileModal = () => {
    setClosingEditProfile(false);
    setDeleteWarningOpen(false);
    setDeleteError("");
    setShowEditProfile(true);
  };

  const closeEditProfileModal = () => {
    setClosingEditProfile(true);
    window.setTimeout(() => {
      setShowEditProfile(false);
      setClosingEditProfile(false);
      setDeleteWarningOpen(false);
      setDeleteError("");
    }, 180);
  };

  const closeVideoModal = () => {
    setClosingVideoModal(true);
    window.setTimeout(() => {
      setShowVideoModal(false);
      setClosingVideoModal(false);
    }, 180);
  };

  const openVideoModal = () => {
    setClosingVideoModal(false);
    setShowVideoModal(true);
  };

  const addVideo = async () => {
    if (!player) return;
    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("playerId", String(player.id));
      formData.append("title", videoTitle.trim() || "Highlight-Video");
      if (videoUrl.trim()) formData.append("videoUrl", videoUrl.trim());
      if (videoFile) formData.append("video", videoFile);

      await fetch(`${apiBaseUrl}/api/player-videos`, {
        method: "POST",
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Video konnte nicht gespeichert werden.");
        }
      });

      setVideoTitle("");
      setVideoUrl("");
      setVideoFile(null);
      closeVideoModal();
      await loadPlayer();
    } catch (err) {
      setError((err as Error).message || "Video konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (videoId: number) => {
    if (!player) return;
    setSaving(true);
    setError("");

    try {
      await fetch(`${apiBaseUrl}/api/player-videos/${videoId}`, {
        method: "DELETE",
      }).then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Video konnte nicht gelöscht werden.");
        }
      });

      setPlayer({
        ...player,
        videos: (player.videos ?? []).filter((video) => video.id !== videoId),
      });
    } catch (err) {
      setError((err as Error).message || "Video konnte nicht gelöscht werden.");
    } finally {
      setSaving(false);
    }
  };

  if (!player) {
    return <main className="min-h-screen bg-[#f6f7f8] p-10 text-2xl">Lädt...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f6f7f8] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <BackToPreviousPage />

        <Card className="mb-7">
          <div className="flex flex-col gap-7 md:flex-row md:items-center">
            <div className="relative size-36 shrink-0 overflow-hidden rounded-full border-4 border-green-500">
              <img
                src={imageUrl}
                alt={player.name}
                className="size-full scale-125 object-cover object-center"
              />
              {overallScore !== null && overallScore >= 86 && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-4 py-1 text-sm font-black text-white">
                  Top Talent
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="break-words text-4xl font-black sm:text-5xl">{player.name}</h1>
                {player.oefbProfileUrl && <VerifiedBadge />}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-2xl font-black text-green-600">{formatPositions(player.position)}</p>
                {overallScore !== null && (
                  <span className="rounded-xl bg-green-500 px-4 py-2 text-2xl font-black text-white">
                    {overallScore}
                  </span>
                )}
              </div>
              <p className="mt-4 text-lg font-bold text-slate-500">Standort: {player.location}</p>
              {player.openToPlay && (
                <p className="mt-3 w-fit rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-700">
                  Auf Vereinssuche
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={openEditProfileModal}
                    className="rounded-xl bg-green-600 px-6 py-3 text-base font-black text-white transition hover:bg-green-700"
                  >
                    Profil bearbeiten
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl border-2 border-green-600 px-6 py-3 text-base font-black text-green-700 transition hover:bg-green-50"
                  >
                    Zum Probetraining einladen
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-7 p-0">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={`min-w-36 border-b-2 px-7 py-5 text-base font-black ${
                activeTab === "about"
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              Über Mich
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("career")}
              className={`min-w-36 border-b-2 px-7 py-5 text-base font-black ${
                activeTab === "career"
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              Karriere
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
        </Card>

        <section className="grid gap-6 lg:grid-cols-[0.68fr_1.32fr]">
          <div className="grid gap-6">
            {activeTab === "about" ? (
              <Card className="transition-all duration-300 ease-out">
                <h2 className="text-2xl font-black">Spielerinformationen</h2>
                <div className="mt-6 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoBox
                      label="Größe"
                      value={player.heightCm ? `${player.heightCm} cm` : "Nicht angegeben"}
                    />
                    <InfoBox label="Alter" value={formatAge(player.birthdate)} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoBox label="Position" value={formatPositions(player.position)} />
                    <InfoBox
                      label="Status"
                      value={player.openToPlay ? "Auf Vereinssuche" : "Nicht aktiv suchend"}
                    />
                  </div>
                  <InfoBox
                    label="Selbstbewertung"
                    value={
                      overallScore === null
                        ? "Noch keine Selbstbewertung hinterlegt"
                        : `${overallScore} aus Profilangaben`
                    }
                  />
                </div>

                <div className="my-6 h-px bg-neutral-100" />
                <h3 className="text-xl font-black">Bevorzugter Fuß</h3>
                <div className="mt-5 grid gap-4 rounded-xl bg-neutral-50 p-4">
                  {(["Links", "Rechts"] as const).map((foot) => {
                    const isStrongFoot = player.preferredFoot === foot;
                    const strength = isStrongFoot ? 5 : (player.weakFootRating ?? 3);
                    const footLabel = foot === "Links" ? "L" : "R";

                    return (
                      <div
                        key={foot}
                        className={`rounded-xl border p-4 ${
                          isStrongFoot
                            ? "border-green-500 bg-green-50"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-neutral-950">{footLabel}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                              {isStrongFoot ? "Starker Fuß" : "Schwacher Fuß"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              isStrongFoot
                                ? "bg-green-500 text-white"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {isStrongFoot ? "SF" : "WF"}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-5 gap-1.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span
                              key={index}
                              className={`h-2 rounded-full ${
                                index < strength ? "bg-green-500" : "bg-neutral-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : activeTab === "career" ? (
              <Card className="transition-all duration-300 ease-out">
                <h2 className="text-2xl font-black">Spielerattribute</h2>
                {player.attributes ? (
                  <div className="mt-6 grid gap-5">
                    {attributeKeys
                      .map((key) => [key, player.attributes?.[key]] as const)
                      .filter((entry): entry is readonly [typeof attributeKeys[number], number] => typeof entry[1] === "number")
                      .map(([key, value]) => (
                        <div key={key}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-lg font-black text-slate-600">
                              {attributeLabels[key]}
                            </span>
                            <span className="text-lg font-black text-green-600">{Math.round(Number(value))}</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${Math.min(Number(value), 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm font-semibold text-neutral-500">
                    Noch keine Attribute hinterlegt.
                  </p>
                )}
                <div className="mt-8 border-t border-neutral-100 pt-6">
                  <h3 className="text-xl font-black">Hauptfähigkeiten</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <span
                          key={skill.key}
                          className={`rounded-full border px-4 py-2 text-sm font-black ${
                            skill.highlighted
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-green-200 bg-green-50 text-green-700"
                          }`}
                        >
                          {skill.highlighted ? "★ " : ""}
                          {skill.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm font-semibold text-neutral-500">
                        Keine Fähigkeiten hinterlegt.
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ) : averageRating !== null ? (
              <Card className="transition-all duration-300 ease-out">
                <h2 className="text-2xl font-black">Fremdbewertete Attribute</h2>
                {externalAttributeAverages ? (
                  <div className="mt-6 grid gap-5">
                    {attributeKeys.map((key) => {
                      const value = externalAttributeAverages[key] ?? 0;

                      return (
                        <div key={key}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-lg font-black text-slate-600">
                              {attributeLabels[key]}
                            </span>
                            <span className="text-lg font-black text-green-600">
                              {Math.round(Number(value))}
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${Math.min(Number(value), 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm font-semibold text-neutral-500">
                    Noch keine detaillierten Fremdbewertungen hinterlegt.
                  </p>
                )}
              </Card>
            ) : null}
          </div>

          <div className="grid gap-6">
            {activeTab === "about" ? (
              <>
                <Card>
                  <h2 className="text-2xl font-black">Vereinsinformationen</h2>
                  <div className="mt-6 grid gap-4">
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                      <p className="text-sm font-black text-slate-500">{clubStatusLabel}</p>
                      <p className="mt-2 text-2xl font-black">{clubStatusValue}</p>
                      {isSearchingWithoutClub && (
                        <p className="mt-3 text-sm font-bold text-slate-600">
                          Letzte Station: {lastStationValue}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                      <p className="text-sm font-black text-slate-500">Sucht Verein in</p>
                      <p className="mt-2 text-2xl font-black">{player.location}</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-2xl font-black">Über mich</h2>
                  <p className="mt-5 text-lg leading-8 text-slate-700">
                    {player.description || "Noch keine Beschreibung hinterlegt."}
                  </p>
                </Card>

                {((player.videos && player.videos.length > 0) || isOwnProfile) && (
                  <Card>
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-2xl font-black">
                        {player.videos && player.videos.length > 0
                          ? "Highlight-Video"
                          : "Jetzt Video hochladen"}
                      </h2>
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={openVideoModal}
                          className="grid size-11 place-items-center rounded-full bg-neutral-950 text-xl font-black text-white transition hover:bg-neutral-800"
                          aria-label="Video hinzufügen"
                          title="Video hinzufügen"
                        >
                          ✎
                        </button>
                      )}
                    </div>
                    {player.videos && player.videos.length > 0 && (
                      <div className="mt-5 grid gap-5">
                        {player.videos.map((video) => {
                          const embedUrl = getEmbeddableVideoUrl(video.videoUrl);
                          const localVideoUrl = video.videoPath
                            ? mediaUrl(video.videoPath, apiBaseUrl) || ""
                            : video.videoUrl || undefined;

                          return (
                            <div key={video.id} className="overflow-hidden rounded-xl bg-black">
                              {embedUrl ? (
                                <iframe
                                  className="aspect-video w-full"
                                  src={embedUrl}
                                  title={video.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              ) : (
                                <video
                                  controls
                                  className="w-full"
                                  src={localVideoUrl}
                                />
                              )}
                              <div className="flex items-center justify-between gap-4 p-4">
                                <p className="text-lg font-black text-white">{video.title}</p>
                                {isOwnProfile && (
                                  <button
                                    type="button"
                                    onClick={() => deleteVideo(video.id)}
                                    disabled={saving}
                                    className="rounded-xl border border-white/20 px-3 py-2 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Löschen
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                )}
              </>
            ) : activeTab === "career" ? (
              <Card>
                <h2 className="text-2xl font-black">Karriereverlauf</h2>
                <div className="mt-6 grid gap-5">
                  {player.clubHistory && player.clubHistory.length > 0 ? (
                    player.clubHistory.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-neutral-200 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xl font-black">{entry.clubName}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              {[entry.relationType, entry.teamCategory]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-slate-500">
                            {formatYearRange(entry.startDate, entry.endDate)}
                          </p>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                          <CareerStat label="Spiele" value={entry.games ?? 0} tone="green" />
                          <CareerStat label="Tore" value={entry.goals ?? 0} tone="green" />
                          <CareerStat
                            label="Gelbe Karten"
                            value={entry.yellowCards ?? 0}
                            tone="yellow"
                          />
                          <CareerStat label="Rote Karten" value={entry.redCards ?? 0} tone="red" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-neutral-50 p-4 text-sm font-semibold text-neutral-500">
                      Noch keine Vereinsstationen hinterlegt.
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              <RatingsCard
                ratings={player.ratings ?? []}
                averageRating={averageRating}
                completedTrials={player.trialTrainings ?? []}
                attributes={externalAttributeAverages}
                skillSummaries={skillRatingSummaries}
              />
            )}
          </div>
        </section>
      </div>

      {showEditProfile && editForm && (
        <EditProfileModal
          editForm={editForm}
          error={error}
          saving={saving}
          closing={closingEditProfile}
          onClose={closeEditProfileModal}
          onSave={saveProfile}
          onChange={setEditForm}
          onTogglePosition={togglePosition}
          deleteWarningOpen={deleteWarningOpen}
          deleteLoading={deleteLoading}
          deleteError={deleteError}
          onOpenDeleteWarning={() => {
            setDeleteWarningOpen(true);
            setDeleteError("");
          }}
          onCancelDelete={() => {
            setDeleteWarningOpen(false);
            setDeleteError("");
          }}
          onDelete={deleteOwnProfile}
        />
      )}

      {showVideoModal && (
        <VideoModal
          error={error}
          saving={saving}
          videoTitle={videoTitle}
          videoUrl={videoUrl}
          closing={closingVideoModal}
          onClose={closeVideoModal}
          onSave={addVideo}
          onTitleChange={setVideoTitle}
          onUrlChange={setVideoUrl}
          onFileChange={setVideoFile}
        />
      )}
    </main>
  );
}

const InfoBox = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-sm font-bold text-slate-500">{label}</p>
    <p className="mt-1 break-words text-lg font-black">{value}</p>
  </div>
);

const CareerStat = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "yellow" | "red";
}) => {
  const toneClass = {
    green: "text-green-600",
    yellow: "text-amber-500",
    red: "text-red-500",
  }[tone];

  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center">
      <p className={`text-3xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
};

const VerifiedBadge = () => (
  <span
    className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-500 text-xl font-black leading-none text-white shadow-sm"
    aria-label="ÖFB-verifiziert"
    title="ÖFB-verifiziert"
  >
    ✓
  </span>
);

const RatingsCard = ({
  ratings,
  averageRating,
  completedTrials,
  attributes,
  skillSummaries,
}: {
  ratings: PlayerRating[];
  averageRating: number | null;
  completedTrials: PlayerTrialTraining[];
  attributes: Record<(typeof attributeKeys)[number], number> | null;
  skillSummaries: {
    skill: string;
    label: string;
    highlighted: boolean;
    average: number | null;
    count: number;
    confirmed: boolean;
  }[];
}) => {
  const [skillsOpen, setSkillsOpen] = useState(false);

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Fremdbewertungen</h2>
          {averageRating !== null && (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              aus {ratings.length}{" "}
              {ratings.length === 1
                ? "Bewertung"
                : "Bewertungen"}
            </p>
          )}
        </div>
        {averageRating !== null && (
          <div className="shrink-0 rounded-2xl bg-green-500 px-5 py-3 text-right text-white">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/75">
              Gesamt
            </p>
            <p className="text-4xl font-black">{averageRating}</p>
          </div>
        )}
      </div>
      {averageRating !== null ? (
        <>
          {skillSummaries.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-amber-100 bg-amber-50">
              <button
                type="button"
                onClick={() => setSkillsOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div>
                  <h3 className="text-xl font-black">Bestätigte Fähigkeiten</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Clubbewertungen der Skills, die der Spieler selbst angegeben hat.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-amber-700">
                  {skillsOpen ? "Ausblenden" : "Anzeigen"}
                </span>
              </button>
              {skillsOpen && (
                <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
                  {skillSummaries.map((summary) => (
                    <div
                      key={summary.skill}
                      className="rounded-xl bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">
                            {summary.highlighted ? "★ " : ""}
                            {summary.label}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {summary.highlighted
                              ? "Vom Spieler hervorgehoben"
                              : "Vom Spieler angegeben"}
                          </p>
                        </div>
                        {summary.confirmed && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                            Bestätigt
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-700">
                        {summary.average !== null
                          ? `${summary.average.toFixed(1)}/5 aus ${summary.count} Bewertung${
                              summary.count === 1 ? "" : "en"
                            }`
                          : "Noch nicht von Clubs bewertet"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        <div className="mt-6 grid gap-4">
          {ratings.length > 0 ? ratings.map((rating) => {
            const ratingClub = rating.trialTraining?.club;

            return (
              <div
                key={rating.id}
                className="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-green-50 text-sm font-black text-green-700">
                    {ratingClub?.logoPath ? (
                      <img
                        src={mediaUrl(ratingClub.logoPath, apiBaseUrl) || ""}
                        alt={ratingClub.clubName || "Club"}
                        className="size-full object-cover"
                      />
                    ) : (
                      (ratingClub?.clubName || "CL").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900">
                      {ratingClub?.clubName ||
                        ratingTypeLabels[rating.ratingType] ||
                        rating.fromUser?.email ||
                        rating.ratingType ||
                        "Bewertung"}
                    </p>
                    {rating.fromUser?.email && (
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {rating.fromUser.email}
                      </p>
                    )}
                    {rating.comment && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {rating.comment}
                      </p>
                    )}
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <RatingDetail
                        label="Typ"
                        value={ratingTypeLabels[rating.ratingType] || rating.ratingType}
                      />
                      <RatingDetail
                        label="Gesamt"
                        value={`${getRatingAttributeScore(rating)}/99`}
                      />
                      <RatingDetail label="Von" value={rating.fromUser?.role || "Club"} />
                    </div>
                    {attributeKeys.every((key) => typeof rating[key] === "number") && (
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {attributeKeys.map((key) => (
                          <RatingDetail
                            key={key}
                            label={attributeLabels[key]}
                            value={`${rating[key]}/99`}
                          />
                        ))}
                      </div>
                    )}
                    {rating.skillRatings && rating.skillRatings.length > 0 && (
                      <div className="mt-4 rounded-lg bg-white p-3">
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">
                          Skill-Bewertung
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rating.skillRatings.map((skillRating) => (
                            <span
                              key={skillRating.id}
                              className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"
                            >
                              {skillLabels[skillRating.skill] ??
                                skillRating.skill}
                              {" "}
                              {Number(skillRating.stars).toFixed(1)}/5
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="w-fit rounded-xl bg-green-500 px-4 py-2 text-xl font-black text-white sm:justify-self-end">
                  {getRatingAttributeScore(rating)}
                </span>
              </div>
            );
          }) : (
            completedTrials.map((trial) => (
              <div
                key={trial.id}
                className="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 gap-4">
                    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-green-50 text-sm font-black text-green-700">
                      {trial.club?.logoPath ? (
                        <img
                          src={mediaUrl(trial.club.logoPath, apiBaseUrl) || ""}
                          alt={trial.club?.clubName || "Club"}
                          className="size-full object-cover"
                        />
                      ) : (
                        (trial.club?.clubName || "CL").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900">Probetraining-Bewertung</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {trial.club?.clubName || trial.club?.user?.email || "Club"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {trial.feedback || "Basierend auf einem abgeschlossenen Probetraining."}
                      </p>
                    </div>
                  </div>
                  {attributes && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {attributeKeys.map((key) => (
                        <RatingDetail
                          key={key}
                          label={attributeLabels[key]}
                          value={`${attributes[key]}/99`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="w-fit self-start rounded-xl bg-green-500 px-4 py-2 text-xl font-black text-white sm:justify-self-end">
                  {averageRating}
                </span>
              </div>
            ))
          )}
        </div>
      </>
      ) : (
      <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm font-semibold text-neutral-500">
        Noch keine Bewertung erhalten.
      </p>
      )}
    </Card>
  );
};

const RatingDetail = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-lg bg-white px-3 py-2">
    <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
  </div>
);

const EditProfileModal = ({
  editForm,
  error,
  saving,
  closing,
  onClose,
  onSave,
  onChange,
  onTogglePosition,
  deleteWarningOpen,
  deleteLoading,
  deleteError,
  onOpenDeleteWarning,
  onCancelDelete,
  onDelete,
}: {
  editForm: EditProfileForm;
  error: string;
  saving: boolean;
  closing: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (form: EditProfileForm) => void;
  onTogglePosition: (position: string) => void;
  deleteWarningOpen: boolean;
  deleteLoading: boolean;
  deleteError: string;
  onOpenDeleteWarning: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) => (
  <div className={`${closing ? "modal-backdrop-out" : "modal-backdrop"} fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-sm`}>
    <div className={`${closing ? "modal-panel-out" : "modal-panel"} w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl`}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black">Profil bearbeiten</h2>
        <button type="button" onClick={onClose} className="rounded-full border border-neutral-200 px-3 py-1 text-sm font-black">
          Schließen
        </button>
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Name</span>
          <input
            value={editForm.name}
            onChange={(event) => onChange({ ...editForm, name: event.target.value })}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 font-semibold outline-none focus:border-green-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Geburtsdatum</span>
          <input
            type="date"
            value={editForm.birthdate}
            onChange={(event) => onChange({ ...editForm, birthdate: event.target.value })}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 font-semibold outline-none focus:border-green-500"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Region</span>
          <input
            value={editForm.location}
            onChange={(event) => onChange({ ...editForm, location: event.target.value })}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 font-semibold outline-none focus:border-green-500"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Beschreibung</span>
          <textarea
            value={editForm.description}
            onChange={(event) => onChange({ ...editForm, description: event.target.value })}
            rows={4}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-semibold outline-none focus:border-green-500"
          />
        </label>
      </div>
      <div className="mt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Positionen</p>
        <div className="flex flex-wrap gap-2">
          {positionOptions.map((position) => {
            const selected = editForm.position.includes(position);
            const disabled = !selected && editForm.position.length >= 3;
            return (
              <button
                key={position}
                type="button"
                onClick={() => onTogglePosition(position)}
                disabled={disabled}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  selected
                    ? "border-green-500 bg-green-500 text-white"
                    : disabled
                      ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-green-300"
                }`}
              >
                {position}
              </button>
            );
          })}
        </div>
      </div>
      <label className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-neutral-50 p-4 text-sm font-bold">
        <span>
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
            Wechselbereit
          </span>
          <span className="mt-1 block text-sm font-black text-neutral-900">
            {editForm.openToPlay ? "Auf Vereinssuche" : "Nicht auf Suche"}
          </span>
        </span>
        <input
          type="checkbox"
          checked={editForm.openToPlay}
          onChange={(event) => onChange({ ...editForm, openToPlay: event.target.checked })}
          className="peer sr-only"
        />
        <span className="relative h-8 w-14 shrink-0 rounded-full bg-neutral-300 transition after:absolute after:left-1 after:top-1 after:size-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-green-500 peer-checked:after:translate-x-6" />
      </label>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-6 h-12 w-full rounded-xl bg-green-500 font-black text-white transition hover:bg-green-600 disabled:bg-neutral-300"
      >
        {saving ? "Speichert..." : "Speichern"}
      </button>

      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-black text-red-800">
              Profil unwiderruflich löschen
            </h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
              Dein Account und dein Spielerprofil werden dauerhaft aus der
              Datenbank entfernt.
            </p>
          </div>
          {!deleteWarningOpen && (
            <button
              type="button"
              onClick={onOpenDeleteWarning}
              className="h-11 rounded-xl bg-red-700 px-4 text-sm font-black text-white transition hover:bg-red-800"
            >
              Profil löschen
            </button>
          )}
        </div>

        {deleteWarningOpen && (
          <div className="mt-4 rounded-xl border border-red-300 bg-white p-4">
            <p className="text-sm font-black text-red-800">
              Soll dein Profil wirklich gelöscht werden?
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-neutral-700">
              Diese Aktion kann nicht rückgängig gemacht werden. Dein Profil ist
              danach für andere nicht mehr sichtbar.
            </p>

            {deleteError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onDelete}
                disabled={deleteLoading}
                className="h-11 rounded-xl bg-red-700 px-4 text-sm font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {deleteLoading ? "Löscht..." : "Ja, endgültig löschen"}
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                disabled={deleteLoading}
                className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-black text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const VideoModal = ({
  error,
  saving,
  videoTitle,
  videoUrl,
  closing,
  onClose,
  onSave,
  onTitleChange,
  onUrlChange,
  onFileChange,
}: {
  error: string;
  saving: boolean;
  videoTitle: string;
  videoUrl: string;
  closing: boolean;
  onClose: () => void;
  onSave: () => void;
  onTitleChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
}) => (
  <div className={`${closing ? "modal-backdrop-out" : "modal-backdrop"} fixed inset-0 z-50 grid place-items-center bg-black/40 px-4`}>
    <div className={`${closing ? "modal-panel-out" : "modal-panel"} w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl`}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black">Video hinzufügen</h2>
        <button type="button" onClick={onClose} className="rounded-full border border-neutral-200 px-3 py-1 text-sm font-black">
          Schließen
        </button>
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <div className="mt-5 grid gap-4">
        <label>
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Titel</span>
          <input
            value={videoTitle}
            onChange={(event) => onTitleChange(event.target.value)}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 font-semibold outline-none focus:border-green-500"
            placeholder="Highlight-Video"
          />
        </label>
        <label>
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Video-Datei</span>
          <input
            type="file"
            accept="video/*"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-semibold"
          />
        </label>
        <label>
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Oder Video-URL</span>
          <input
            value={videoUrl}
            onChange={(event) => onUrlChange(event.target.value)}
            className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 font-semibold outline-none focus:border-green-500"
            placeholder="https://..."
          />
        </label>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-6 h-12 w-full rounded-xl bg-green-500 font-black text-white transition hover:bg-green-600 disabled:bg-neutral-300"
      >
        {saving ? "Speichert..." : "Video speichern"}
      </button>
    </div>
  </div>
);
