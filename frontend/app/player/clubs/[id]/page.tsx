"use client";

import { use, useEffect, useState } from "react";
import BackToPreviousPage from "@/src/components/BackToPreviousPage";
import { mediaUrl } from "@/src/lib/media";

// Types for club profile (mirroring club dashboard and player detail view)
type Club = {
  id: number;
  clubName?: string;
  name?: string;
  logoUrl?: string | null;
  logoPath?: string | null;
  verband?: string | null;
  league?: string | null;
  wettbewerb?: string | null;
  liga?: string | null;
  location?: string | null;
  phone?: string | null;
  sportsGroundName?: string | null;
  sportsGroundAddress?: string | null;
  sportsGroundZipCode?: string | null;
  sportsGroundCity?: string | null;
  oefbClubProfileUrl?: string | null;
  leagueTableData?: {
    headers?: string[];
    rows?: string[][];
    sourceUrl?: string;
    tableUrl?: string;
    crawledAt?: string;
  } | null;
  email?: string | null;
  description?: string | null;
  user?: {
    email?: string | null;
  };
  requirements?: ClubRequirement[];
};

type ClubListResponse =
  | Club[]
  | {
      clubs?: Club[];
      data?: Club[];
      items?: Club[];
      message?: string;
    };

type ClubRequirement = {
  id: number;
  position: string;
  minTempo: number;
  minShooting: number;
  minPassing: number;
  minDribbling: number;
  minDefending: number;
  minPhysical: number;
  tempoWeight: number;
  shootingWeight: number;
  passingWeight: number;
  dribblingWeight: number;
  defendingWeight: number;
  physicalWeight: number;
  requiredSkills?: string[];
  highlightedSkills?: string[];
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

type PlayerProfile = {
  id: number;
  position: string[] | string;
  attributes?: {
    tempo: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  } | null;
  skills?: string[];
  highlightedSkills?: string[];
};

import { API_BASE as apiBaseUrl } from "@/src/lib/apiBase";

const formatPositions = (positions: string[] | string) =>
  Array.isArray(positions) ? positions.join(", ") : positions;

const requirementAttributes = [
  ["Tempo", "tempo", "minTempo"],
  ["Schuss", "shooting", "minShooting"],
  ["Passen", "passing", "minPassing"],
  ["Dribbling", "dribbling", "minDribbling"],
  ["Defensive", "defending", "minDefending"],
  ["Physis", "physical", "minPhysical"],
] as const;

const normalizePosition = (position: string) => position.trim().toUpperCase();

const positionGroups = [
  ["ST", "LF", "RF", "ZOM"],
  ["ZOM", "ZM", "ZDM"],
  ["LV", "RV", "LF", "RF"],
  ["IV", "ZDM"],
  ["LV", "RV", "IV", "ZDM"],
];

const positionAttributeWeights: Record<string, Partial<Record<keyof NonNullable<PlayerProfile["attributes"]>, number>>> = {
  ST: { shooting: 3, tempo: 2, physical: 2 },
  LF: { tempo: 3, dribbling: 3, shooting: 2, passing: 1 },
  RF: { tempo: 3, dribbling: 3, shooting: 2, passing: 1 },
  ZOM: { passing: 3, dribbling: 2, shooting: 2 },
  ZM: { passing: 3, dribbling: 1, defending: 1, physical: 1 },
  ZDM: { defending: 3, physical: 2, passing: 2 },
  IV: { defending: 3, physical: 2, passing: 1 },
  LV: { tempo: 2, defending: 2, physical: 2, passing: 1, dribbling: 1 },
  RV: { tempo: 2, defending: 2, physical: 2, passing: 1, dribbling: 1 },
};

const positionSkills: Record<string, string[]> = {
  ST: ["ABSCHLUSS", "TEMPO", "DRIBBLING", "BALLKONTROLLE", "KOPFBALLSPIEL"],
  LF: ["TEMPO", "DRIBBLING", "FLANKENSPIEL", "BALLKONTROLLE"],
  RF: ["TEMPO", "DRIBBLING", "FLANKENSPIEL", "BALLKONTROLLE"],
  ZOM: ["PASSGENAUIGKEIT", "SPIELUEBERSICHT", "BALLKONTROLLE", "ABSCHLUSS"],
  ZM: ["PASSGENAUIGKEIT", "SPIELUEBERSICHT", "SPIELAUFBAU", "AUSDAUER"],
  ZDM: ["DEFENSIVARBEIT", "ZWEIKAMPFSTAERKE", "PASSGENAUIGKEIT", "PHYSIS", "SPIELAUFBAU"],
  IV: ["DEFENSIVARBEIT", "ZWEIKAMPFSTAERKE", "KOPFBALLSPIEL", "PHYSIS"],
  LV: ["TEMPO", "AUSDAUER", "DEFENSIVARBEIT", "FLANKENSPIEL"],
  RV: ["TEMPO", "AUSDAUER", "DEFENSIVARBEIT", "FLANKENSPIEL"],
};

const calculatePositionProximity = (
  playerPositions: string[] | string | undefined,
  requirementPosition: string,
) => {
  if (!playerPositions) return 0;

  const positions = Array.isArray(playerPositions)
    ? playerPositions
    : playerPositions.split(",");
  const normalizedPositions = positions.map((position) =>
    normalizePosition(position),
  );
  const required = normalizePosition(requirementPosition);

  if (normalizedPositions.includes(required)) return 1;
  if (required === "GK" || normalizedPositions.includes("GK")) return 0;

  const hasSharedGroup = positionGroups.some(
    (group) =>
      group.includes(required) &&
      normalizedPositions.some((position) => group.includes(position)),
  );

  return hasSharedGroup ? 0.6 : 0.1;
};

const skillLabel = (skill: string) =>
  skill
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace("Fussspiel", "Fußspiel")
    .replace("Abstoesse", "Abstöße")
    .replace("Abschlaege", "Abschläge")
    .replace("Spieleroeffnung", "Spieleröffnung")
    .replace("Hohe Baelle", "Hohe Bälle")
    .replace("Zweikampfstaerke", "Zweikampfstärke")
    .replace("Elfmeter", "Elfmeter-Killer");

const positionsOverlap = (
  playerPositions: string[] | string | undefined,
  requirementPosition: string,
) => {
  if (!playerPositions) {
    return false;
  }

  const positions = Array.isArray(playerPositions)
    ? playerPositions
    : playerPositions.split(",");

  return positions
    .map((position) => normalizePosition(position))
    .includes(normalizePosition(requirementPosition));
};

const calculateSoftRequirementMatch = (
  requirement: ClubRequirement,
  attributes?: PlayerProfile["attributes"],
  player?: PlayerProfile | null,
) => {
  if (requirement.position === "GK") {
    const requiredSkills = requirement.requiredSkills ?? [];
    const importantSkills = requirement.highlightedSkills ?? [];
    const playerSkills = new Set(player?.skills ?? []);
    const highlightedSkills = new Set(player?.highlightedSkills ?? []);

    if (requiredSkills.length === 0 && importantSkills.length === 0) {
      return player?.position &&
        positionsOverlap(player.position, requirement.position)
        ? 100
        : 0;
    }

    const baseScore = requiredSkills.length > 0
      ? requiredSkills.reduce((sum, skill) => {
          if (!playerSkills.has(skill)) {
            return sum;
          }

          return sum + (highlightedSkills.has(skill) ? 1 : 0.8);
        }, 0) / requiredSkills.length
      : 0;
    const bonus = importantSkills.length > 0
      ? importantSkills.reduce(
          (sum, skill) => sum + (highlightedSkills.has(skill) ? 1 : 0),
          0,
        ) / importantSkills.length
      : 0;

    return Math.round(Math.min(baseScore + bonus * 0.2, 1) * 100);
  }

  if (!attributes) {
    return null;
  }

  const playerSkills = new Set(player?.skills ?? []);
  const highlightedSkills = new Set(player?.highlightedSkills ?? []);
  const requiredSkills = requirement.requiredSkills ?? [];
  const importantSkills = requirement.highlightedSkills ?? [];
  const explicitSkillScore = requiredSkills.length > 0
    ? requiredSkills.reduce((sum, skill) => {
        if (!playerSkills.has(skill)) {
          return sum;
        }

        return sum + (highlightedSkills.has(skill) ? 1 : 0.8);
      }, 0) / requiredSkills.length
    : 0;
  const bonus = importantSkills.length > 0
    ? importantSkills.reduce(
        (sum, skill) => sum + (highlightedSkills.has(skill) ? 1 : 0),
        0,
      ) / importantSkills.length
    : 0;
  const recommendedSkills = positionSkills[normalizePosition(requirement.position)] ?? [];
  const positionSkillScore = recommendedSkills.length > 0
    ? recommendedSkills.reduce(
        (sum, skill) => sum + (playerSkills.has(skill) ? 1 : 0),
        0,
      ) / recommendedSkills.length
    : 0;
  const combinedSkillScore =
    requiredSkills.length > 0 || importantSkills.length > 0
      ? Math.min(explicitSkillScore + bonus * 0.2, 1)
      : positionSkillScore * 0.8;
  const positionScore = calculatePositionProximity(
    player?.position,
    requirement.position,
  );
  const weightedScore = requirementAttributes.reduce(
    (sum, [, playerKey, reqKey]) => {
      const weightKey = `${playerKey}Weight` as keyof ClubRequirement;
      const requiredValue = Math.max(Number(requirement[reqKey]), 1);
      const playerValue = attributes[playerKey];
      const weight = Number(requirement[weightKey]);
      const ratio = Math.pow(Math.min(playerValue / requiredValue, 1), 2);

      return sum + ratio * weight;
    },
    0,
  );
  const totalWeight = requirementAttributes.reduce((sum, [, playerKey]) => {
    const weightKey = `${playerKey}Weight` as keyof ClubRequirement;

    return sum + Number(requirement[weightKey]);
  }, 0);

  const attributeScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const criticalWeights =
    positionAttributeWeights[normalizePosition(requirement.position)];
  const criticalAttributeScore = criticalWeights
    ? Object.entries(criticalWeights).reduce((sum, [key, weight]) => {
        const reqKey = `min${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof ClubRequirement;
        const playerValue = attributes[key as keyof typeof attributes];
        const requiredValue = Math.max(Number(requirement[reqKey]), 1);
        const ratio = Math.pow(Math.min(playerValue / requiredValue, 1), 2);

        return sum + ratio * Number(weight);
      }, 0) /
      Object.values(criticalWeights).reduce(
        (sum, weight) => sum + Number(weight),
        0,
      )
    : attributeScore;
  const baseScore =
    attributeScore * 0.45 +
    criticalAttributeScore * 0.25 +
    combinedSkillScore * 0.2 +
    positionScore * 0.1;
  const positionCap = positionScore >= 1 ? 1 : 0.48 + positionScore * 0.42;
  const skillAdjustedCap =
    combinedSkillScore < 0.5 ? Math.max(positionCap - 0.08, 0.35) : positionCap;

  return Math.round(Math.min(baseScore, skillAdjustedCap) * 100);
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`}
  >
    {children}
  </section>
);

export default function ClubProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [club, setClub] = useState<Club | null>(null);
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<
    "idle" | "success" | "exists" | "error"
  >("idle");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "ratings">("profile");
  const [ratings, setRatings] = useState<ClubRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState("");
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    const loadClub = async () => {
      const response = await fetch(`${apiBaseUrl}/api/clubs`);
      const clubResponse = (await response.json()) as ClubListResponse;

      if (!response.ok) {
        throw new Error(
          Array.isArray(clubResponse)
            ? "Club konnte nicht geladen werden."
            : clubResponse.message || "Club konnte nicht geladen werden.",
        );
      }

      const clubs = Array.isArray(clubResponse)
        ? clubResponse
        : clubResponse.clubs || clubResponse.data || clubResponse.items || [];

      const foundClub = clubs.find((clubItem) => clubItem.id === Number(id));
      if (foundClub) {
        setClub({
          ...foundClub,
          name: foundClub.name ?? foundClub.clubName,
          liga: foundClub.liga ?? foundClub.league,
          email: foundClub.user?.email ?? null,
        });
      } else {
        setClub(null);
      }
    };
    loadClub().catch((error) => {
      setLoadError((error as Error).message);
      setClub(null);
    });
  }, [id]);

  useEffect(() => {
    const loadRatings = async () => {
      setRatingsLoading(true);
      setRatingsError("");

      try {
        const response = await fetch(`${apiBaseUrl}/api/clubs/${id}/ratings`);
        const data = (await response.json().catch(() => null)) as
          | ClubRating[]
          | { message?: string }
          | null;

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(
            !Array.isArray(data) && data?.message
              ? data.message
              : "Bewertungen konnten nicht geladen werden.",
          );
        }

        setRatings(data);
      } catch (error) {
        setRatings([]);
        setRatingsError((error as Error).message);
      } finally {
        setRatingsLoading(false);
      }
    };

    loadRatings();
  }, [id]);

  useEffect(() => {
    const loadPlayerProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setPlayerProfile(null);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/players/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setPlayerProfile(null);
        return;
      }

      setPlayerProfile((await response.json()) as PlayerProfile);
    };

    loadPlayerProfile().catch(() => setPlayerProfile(null));
  }, []);

  const applyForClub = async () => {
    setApplying(true);
    setApplicationStatus("idle");
    setApplicationMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Bitte melde dich an, um dich zu bewerben.");
      }

      const profileResponse = await fetch(`${apiBaseUrl}/api/players/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Spielerprofil konnte nicht geladen werden.");
      }

      const profile = (await profileResponse.json()) as { id?: number };

      if (!profile.id) {
        throw new Error("Spielerprofil konnte nicht geladen werden.");
      }

      const applicationResponse = await fetch(`${apiBaseUrl}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId: profile.id,
          clubId: Number(id),
          message: `Ich möchte mich bei ${displayName} bewerben.`,
        }),
      });

      if (!applicationResponse.ok) {
        const errorBody = await applicationResponse.json().catch(() => null);
        const message = errorBody?.message || "Bewerbung fehlgeschlagen.";

        if (message === "Application already exists") {
          setApplicationStatus("exists");
          setApplicationMessage("Du hast dich bereits bei diesem Club beworben.");
          return;
        }

        throw new Error(message);
      }

      setApplicationStatus("success");
      setApplicationMessage("Bewerbung erfolgreich gesendet.");
    } catch (error) {
      setApplicationStatus("error");
      setApplicationMessage((error as Error).message);
    } finally {
      setApplying(false);
    }
  };

  const logoUrl =
    mediaUrl(club?.logoPath, apiBaseUrl) ||
    club?.logoUrl ||
    "https://placehold.co/300x300";

  if (!club) {
    return (
      <main className="min-h-screen bg-[#f6f7f8] p-10 text-2xl">
        {loadError || "Lädt..."}
      </main>
    );
  }

  const displayName = club.name || club.clubName || "Unbekannter Club";
  const displayLocation = club.location || "Nicht angegeben";
  const displayEmail = club.email || "Nicht angegeben";
  const displayPhone = club.phone?.trim() || "";
  const hasSportsGroundInfo =
    Boolean(club.sportsGroundName?.trim()) ||
    Boolean(club.sportsGroundAddress?.trim()) ||
    Boolean(club.sportsGroundZipCode?.trim()) ||
    Boolean(club.sportsGroundCity?.trim());
  const sportsGroundCityLine =
    [club.sportsGroundZipCode?.trim(), club.sportsGroundCity?.trim()]
      .filter(Boolean)
      .join(" ") || "Nicht angegeben";
  const hasLeagueTable =
    Array.isArray(club.leagueTableData?.rows) &&
    club.leagueTableData!.rows!.length > 0;
  const leagueTableHeaders =
    club.leagueTableData?.headers && club.leagueTableData.headers.length > 0
      ? club.leagueTableData.headers
      : club.leagueTableData?.rows?.[0]?.map(
          (_, index) => `Spalte ${index + 1}`,
        ) || [];
  const leagueTableRows = club.leagueTableData?.rows || [];
  const normalizeTableText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const clubNameKey = normalizeTableText(displayName);
  const isOpenedClubRow = (row: string[]) => {
    if (!clubNameKey) {
      return false;
    }

    return row.some((cell) => {
      const cellKey = normalizeTableText(cell);
      return cellKey.includes(clubNameKey) || clubNameKey.includes(cellKey);
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f7f8] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <BackToPreviousPage />

        <Card className="mb-7">
          <div className="flex flex-col gap-7 md:flex-row md:items-center">
            <div className="relative w-fit shrink-0">
              <img
                src={logoUrl}
                alt={displayName}
                className="size-36 rounded-full border-4 border-green-500 object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-4xl font-black sm:text-5xl">
                {displayName}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600">
                <p className="inline-flex items-center gap-2 text-base font-medium sm:text-lg">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21s7-5.438 7-11a7 7 0 1 0-14 0c0 5.562 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {displayLocation}
                </p>
                <p className="inline-flex items-center gap-2 text-base font-medium sm:text-lg">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                  <span className="break-all">{displayEmail}</span>
                </p>
                {displayPhone && (
                  <p className="inline-flex items-center gap-2 text-base font-medium sm:text-lg">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.33 1.76.62 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.28a2 2 0 0 1 2.11-.45c.84.29 1.71.5 2.6.62A2 2 0 0 1 22 16.92Z" />
                    </svg>
                    {displayPhone}
                  </p>
                )}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={applyForClub}
                  disabled={applying || applicationStatus === "success"}
                  className="rounded-2xl bg-green-600 px-7 py-4 text-base font-black text-white shadow-lg shadow-green-950/15 transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
                >
                  {applying
                    ? "Bewerbung wird gesendet..."
                    : applicationStatus === "success"
                      ? "Beworben"
                      : "Jetzt bewerben"}
                </button>
                {applicationMessage && (
                  <p
                    className={`text-sm font-bold ${
                      applicationStatus === "error"
                        ? "text-red-600"
                        : "text-green-700"
                    }`}
                  >
                    {applicationMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-7 p-0">
          <div className="flex overflow-x-auto">
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
        </Card>

        <div className="stable-tab-panel">
          {activeTab === "profile" ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <Card>
                <h2 className="text-2xl font-black">Vereinsinformationen</h2>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-sm font-black text-slate-500">
                      Wettbewerb
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {club.wettbewerb || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                    <p className="text-sm font-black text-slate-500">Liga</p>
                    <p className="mt-2 text-2xl font-black">
                      {club.liga || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-black text-slate-500">
                      Sportplatz
                    </p>
                    {hasSportsGroundInfo ? (
                      <div className="mt-2 space-y-1 text-sm font-bold text-slate-800">
                        <p>{club.sportsGroundName || "Nicht angegeben"}</p>
                        <p>{club.sportsGroundAddress || "Nicht angegeben"}</p>
                        <p>{sportsGroundCityLine}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-base font-black">
                        Nicht angegeben
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                {hasLeagueTable ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-2xl font-black">Ligatabelle</h2>
                      {club.oefbClubProfileUrl && (
                        <a
                          href={club.oefbClubProfileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-black uppercase tracking-[0.14em] text-green-700 hover:text-green-800"
                        >
                          Quelle ÖFB
                        </a>
                      )}
                    </div>
                    <div className="mt-5 overflow-x-auto">
                      <table className="min-w-full border-collapse overflow-hidden rounded-xl border border-neutral-200">
                        <thead className="bg-neutral-100">
                          <tr>
                            {leagueTableHeaders.map((header, index) => (
                              <th
                                key={`${header}-${index}`}
                                className="border-b border-neutral-200 px-3 py-2 text-left text-xs font-black uppercase tracking-[0.08em] text-neutral-600"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {leagueTableRows.map((row, rowIndex) => {
                            const highlighted = isOpenedClubRow(row);

                            return (
                              <tr
                                key={`row-${rowIndex}`}
                                className={
                                  highlighted
                                    ? "bg-green-100"
                                    : rowIndex % 2 === 0
                                      ? "bg-white"
                                      : "bg-neutral-50"
                                }
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={`cell-${rowIndex}-${cellIndex}`}
                                    className={`border-b px-3 py-2 text-sm font-semibold ${
                                      highlighted
                                        ? "border-green-200 text-green-900"
                                        : "border-neutral-200 text-neutral-700"
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black">Über den Verein</h2>
                    <p className="mt-5 text-lg leading-8 text-slate-700">
                      {club.description || "Noch keine Beschreibung hinterlegt."}
                    </p>
                  </>
                )}
              </Card>
            </section>

            <Card className="mt-7">
              <h2 className="mb-4 text-2xl font-black">
                Gesuchte Spielerattribute
              </h2>
              {club.requirements && club.requirements.length > 0 ? (
                <>
                  <p className="mb-3 text-sm font-semibold text-neutral-500">
                    Nach rechts scrollen, um alle gesuchten Profile zu sehen.
                  </p>
                  <div className="mb-4 grid gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-bold text-neutral-600 sm:grid-cols-3">
                    <div>
                      <span className="text-neutral-950">Match %</span>{" "}
                      zeigt, wie nah deine Werte am Profil sind.
                    </div>
                    <div>
                      <span className="text-neutral-950">Grau</span> ist der
                      Mindestwert des Vereins.
                    </div>
                    <div className="whitespace-nowrap">
                      <span className="text-green-700">Grün</span> ist dein
                      erfüllter Wert.{" "}
                      <span className="text-amber-700">Gelb</span>, wenn du
                      darunter liegst.
                    </div>
                  </div>
                  <div className="-mx-2 overflow-x-auto px-2 pb-2">
                    <div
                      className="grid min-w-full gap-4"
                      style={{
                        gridTemplateColumns: `repeat(${club.requirements.length}, minmax(320px, 1fr))`,
                      }}
                    >
                      {club.requirements.map((req) => {
                        const playerAttributes = playerProfile?.attributes;
                        const positionMatches = positionsOverlap(
                          playerProfile?.position,
                          req.position,
                        );
                        const matchPercent = calculateSoftRequirementMatch(
                          req,
                          playerAttributes,
                          playerProfile,
                        );

                        return (
                          <article
                            key={req.id}
                            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                                  Gesuchte Position
                                </p>
                                <p className="mt-1 text-lg font-black text-neutral-950">
                                  {req.position}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-sm font-black ${
                                  (matchPercent ?? 0) >= 70
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {matchPercent === null ? "-" : `${matchPercent}%`}
                              </span>
                            </div>
                            <div className="mb-3 rounded-xl border border-white bg-white px-3 py-2">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-bold text-neutral-700">
                                  Deine Position
                                </span>
                                <span
                                  className={`text-sm font-black ${
                                    positionMatches
                                      ? "text-green-700"
                                      : "text-amber-700"
                                  }`}
                                >
                                  {playerProfile
                                    ? formatPositions(playerProfile.position)
                                    : "Nicht geladen"}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-2">
                              {req.position === "GK" ? (
                                <div className="rounded-xl border border-white bg-white px-3 py-2">
                                  <p className="text-sm font-black text-neutral-800">
                                    Tormann-Fähigkeiten
                                  </p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {(req.requiredSkills ?? []).length > 0 ? (
                                      (req.requiredSkills ?? []).map((skill) => {
                                        const hasSkill = playerProfile?.skills?.includes(skill);
                                        const highlighted = playerProfile?.highlightedSkills?.includes(skill);

                                        return (
                                          <span
                                            key={`${req.id}-${skill}`}
                                            className={`rounded-full px-3 py-1 text-xs font-black ${
                                              hasSkill
                                                ? highlighted
                                                  ? "bg-neutral-950 text-white"
                                                  : "bg-green-100 text-green-700"
                                                : "bg-amber-100 text-amber-700"
                                            }`}
                                          >
                                            {skillLabel(skill)}
                                          </span>
                                        );
                                      })
                                    ) : (
                                      <span className="text-sm font-semibold text-neutral-500">
                                        Keine Skill-Anforderungen hinterlegt.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : requirementAttributes.map(
                                ([label, playerKey, reqKey]) => {
                                  const requiredValue = Number(req[reqKey]);
                                  const ownValue = playerAttributes?.[playerKey];
                                  const isMatched =
                                    typeof ownValue === "number" &&
                                    ownValue >= requiredValue;

                                  return (
                                    <div
                                      key={`${req.id}-${label}`}
                                      className="rounded-xl border border-white bg-white px-3 py-2"
                                    >
                                      <div className="mb-1 flex items-center justify-between gap-3">
                                        <span className="text-sm font-bold text-neutral-700">
                                          {label}
                                        </span>
                                        <span
                                          className={`text-sm font-black ${
                                            isMatched
                                              ? "text-green-700"
                                              : "text-amber-700"
                                          }`}
                                        >
                                          {ownValue ?? "-"}/{requiredValue}
                                        </span>
                                      </div>
                                      <div className="grid gap-1.5">
                                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                                          <div
                                            className="h-full rounded-full bg-neutral-400"
                                            style={{
                                              width: `${Math.min(requiredValue, 99)}%`,
                                            }}
                                          />
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                                          <div
                                            className={`h-full rounded-full ${
                                              isMatched
                                                ? "bg-green-500"
                                                : "bg-amber-500"
                                            }`}
                                            style={{
                                              width: `${Math.min(Number(ownValue ?? 0), 99)}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="mt-1 flex justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                                        <span>Club</span>
                                        <span>Du</span>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-neutral-500">
                  Keine Anforderungen hinterlegt.
                </p>
              )}
            </Card>
          </>
        ) : (
          <Card>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Abgegebene Bewertungen</h2>
                <p className="mt-2 text-sm font-semibold text-neutral-500">
                  Bewertungen aus abgeschlossenen Probetrainings.
                </p>
              </div>
              <div className="w-fit rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">
                {ratings.length}{" "}
                {ratings.length === 1 ? "Bewertung" : "Bewertungen"}
              </div>
            </div>

            {ratingsError && (
              <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {ratingsError}
              </p>
            )}

            {ratingsLoading && (
              <div className="rounded-2xl bg-neutral-50 p-6 font-bold text-neutral-500">
                Lädt...
              </div>
            )}

            {!ratingsLoading && !ratingsError && ratings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8">
                <h3 className="text-xl font-black">Noch keine Bewertungen</h3>
                <p className="mt-2 text-sm font-semibold text-neutral-500">
                  Sobald dieser Club ein Probetraining bewertet, erscheint es
                  hier.
                </p>
              </div>
            )}

            {!ratingsLoading && ratings.length > 0 && (
              <div className="grid gap-4">
                {ratings.map((rating) => (
                  <article
                    key={rating.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            mediaUrl(
                              rating.player.profileImagePath ||
                                rating.player.profileImageUrl,
                              apiBaseUrl,
                            ) || "https://placehold.co/96x96"
                          }
                          alt={rating.player.name}
                          className="size-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-xl font-black">
                            {rating.player.name}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-neutral-500">
                            {formatPositions(rating.player.position)}
                          </p>
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-green-700">
                            {new Date(
                              rating.trialTraining?.scheduledAt ||
                                rating.createdAt,
                            ).toLocaleDateString("de-AT")}
                          </p>
                        </div>
                      </div>

                      <div className="w-fit rounded-2xl bg-white px-5 py-3 text-center">
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
          </Card>
          )}
        </div>
      </div>
    </main>
  );
}
