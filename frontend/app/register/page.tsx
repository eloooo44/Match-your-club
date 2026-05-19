"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/services/api";
import { mediaUrl } from "@/src/lib/media";

interface OefbRegistrationPreview {
  source: {
    url: string;
  };
  identity: {
    firstName?: string;
    lastName?: string;
    fullName: string;
    position?: string;
    heightCm?: number;
    profileImageUrl?: string;
  };
  currentClub: {
    name?: string;
  };
  history?: ClubHistoryEntry[];
  statistics: Array<{
    category?: string;
    label?: string;
    games?: number;
    goals?: number;
    yellowCards?: number;
    yellowRedCards?: number;
    redCards?: number;
  }>;
}

interface ClubHistoryEntry {
  club: string;
  teamCategory: string;
  from: string;
  to: string;
  games: string;
  goals: string;
  yellowCards: string;
  redCards: string;
}

interface EditableOefbData {
  firstName: string;
  lastName: string;
  position: string;
  birthDate: string;
  currentClub: string;
  heightCm: string;
  games: string;
  goals: string;
  yellowCards: string;
  redCards: string;
  about: string;
  skills: string;
  highlightedSkills: string;
  preferredFoot: string;
  weakFootRating: string;
  searchRegion: string;
  clubHistory: ClubHistoryEntry[];
  profileImageUrl?: string;
}

interface SelfRatingAttributes {
  tempo: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    role: "club" | "player";
  };
}

interface ClubCompetitionOption {
  verband: string;
  wettbewerbe: Array<{
    name: string;
    ligen: string[];
  }>;
}

interface OefbClubPreview {
  source: {
    url: string;
    tableUrl: string;
    fetchedAt: string;
  };
  clubName?: string;
  sportsGroundName?: string;
  sportsGroundAddress?: string;
  sportsGroundZipCode?: string;
  sportsGroundCity?: string;
  obmannEmail?: string;
  obmannPhone?: string;
  logoUrl?: string;
  location?: string;
  leagueTable?: {
    headers: string[];
    rows: string[][];
    totalRows: number;
    leagueName?: string;
  };
  competitionSelection?: {
    verband: string;
    wettbewerb: string;
    league: string;
  } | null;
}

interface ClubProfileFormData {
  clubName: string;
  verband: string;
  wettbewerb: string;
  league: string;
  oefbClubProfileUrl: string;
  sportsGroundName: string;
  sportsGroundAddress: string;
  sportsGroundZipCode: string;
  sportsGroundCity: string;
  obmannEmail: string;
  phone: string;
  description: string;
}

type AttributeKey =
  | "tempo"
  | "shooting"
  | "passing"
  | "dribbling"
  | "defending"
  | "physical";

type AttributePriority = 1 | 2 | 3;

type ClubRequirementFormData = {
  positions: string[];
  byPosition: Record<string, ClubPositionRequirementData>;
};

type ClubPositionRequirementData = {
  attributePriority: Record<AttributeKey, AttributePriority>;
  minValues: Record<AttributeKey, number>;
  requiredSkills: string[];
  highlightedSkills: string[];
};

const defaultOefbUrl =
  "https://www.oefb.at/Profile/Spieler/1493621?Mohammed-Bilge";

const clubAttributeLabels: Array<{ key: AttributeKey; label: string }> = [
  { key: "tempo", label: "Tempo" },
  { key: "shooting", label: "Schießen" },
  { key: "passing", label: "Passen" },
  { key: "dribbling", label: "Dribbling" },
  { key: "defending", label: "Verteidigung" },
  { key: "physical", label: "Physis" },
];

const goalkeeperSkillOptions = [
  "Reflexe",
  "Strafraumbeherrschung",
  "Eins-gegen-Eins",
  "Abstöße",
  "Spieleröffnung",
  "Kommunikation",
  "Stellungsspiel",
  "Fangsicherheit",
  "Reaktionsschnelligkeit",
  "Elfmeter-Killer",
  "Mitspielender Tormann",
];

const fieldPlayerSkillOptions = [
  "Zweikampfstärke",
  "Kopfballspiel",
  "Spielaufbau",
  "Passgenauigkeit",
  "Spielübersicht",
  "Tempo",
  "Dribbling",
  "Ausdauer",
  "Physis",
  "Defensivarbeit",
  "Pressing",
  "Flankenspiel",
  "Ballkontrolle",
  "Abschluss",
];

const footballSkillOptions = [
  ...fieldPlayerSkillOptions,
  ...goalkeeperSkillOptions,
];

const createDefaultClubPositionRequirement = (): ClubPositionRequirementData => ({
  attributePriority: {
    tempo: 1,
    shooting: 1,
    passing: 1,
    dribbling: 1,
    defending: 1,
    physical: 1,
  },
  minValues: {
    tempo: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
  },
  requiredSkills: [],
  highlightedSkills: [],
});

const RequiredMark = () => (
  <span className="ml-1 font-black text-red-500" title="Pflichtfeld">
    *
  </span>
);

const austrianRegionOptions = [
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

const birthDayOptions = Array.from({ length: 31 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const birthMonthOptions = [
  ["01", "Jänner"],
  ["02", "Februar"],
  ["03", "März"],
  ["04", "April"],
  ["05", "Mai"],
  ["06", "Juni"],
  ["07", "Juli"],
  ["08", "August"],
  ["09", "September"],
  ["10", "Oktober"],
  ["11", "November"],
  ["12", "Dezember"],
];
const currentYear = new Date().getFullYear();
const birthYearOptions = Array.from({ length: 61 }, (_, index) =>
  String(currentYear - 8 - index),
);

const positionGroups = [
  {
    label: "TOR",
    positions: ["GK"],
  },
  {
    label: "VER",
    positions: ["LV", "RV", "IV"],
  },
  {
    label: "MIT",
    positions: ["ZDM", "ZM", "ZOM"],
  },
  {
    label: "ANG",
    positions: ["LF", "RF", "ST"],
  },
];
const selectablePositions = positionGroups.flatMap((group) => group.positions);

const getBirthDateParts = (birthDate: string) => {
  const [year = "", month = "", day = ""] = birthDate.split("-");

  return {
    day,
    month,
    year,
  };
};

const isValidBirthDate = (birthDate: string) => {
  const { year, month, day } = getBirthDateParts(birthDate);

  if (!year || !month || !day) {
    return false;
  }

  const parsedDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.getUTCFullYear() === Number(year) &&
    parsedDate.getUTCMonth() + 1 === Number(month) &&
    parsedDate.getUTCDate() === Number(day)
  );
};

const formatBirthDateForStorage = (birthDate: string) => {
  const { year, month, day } = getBirthDateParts(birthDate);

  return `${day}/${month}/${year}`;
};

const numberOrUndefined = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const numberValue = Number(trimmedValue);

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const normalizeStatCategory = (value?: string) =>
  value?.trim().toUpperCase() ?? "";

const TEAM_CATEGORY_OPTIONS = [
  "KM",
  "1B",
  "RES",
  "U23",
  "Nachwuchs",
  "Sonstiges",
];

const normalizeTeamCategory = (value?: string) => {
  const normalized = normalizeStatCategory(value);

  if (/^U(?:[1-9]|1[0-8])$/.test(normalized)) {
    return "Nachwuchs";
  }

  return value?.trim() ?? "";
};

const getPreferredOefbStat = (statistics: OefbRegistrationPreview["statistics"]) => {
  const preferredCategories = ["KM", "1B", "U23", "RES", "U18", "U17", "U16"];

  return (
    preferredCategories
      .map((category) =>
        statistics.find((stat) => {
          const normalizedCategory = normalizeStatCategory(stat.category);
          const normalizedLabel = normalizeStatCategory(stat.label);

          return normalizedCategory === category || normalizedLabel === category;
        }),
      )
      .find(Boolean) ??
    statistics.find((stat) => {
      const category = normalizeStatCategory(stat.category || stat.label);

      return !/^U\d{1,2}$/.test(category);
    }) ??
    statistics[0] ??
    {}
  );
};

const toEditableOefbData = (
  preview: OefbRegistrationPreview,
): EditableOefbData => {
  const preferredStat = getPreferredOefbStat(preview.statistics);
  const preferredCategory = normalizeTeamCategory(
    preferredStat.category ?? preferredStat.label,
  );
  const importedStats = {
    games: String(preferredStat.games ?? ""),
    goals: String(preferredStat.goals ?? ""),
    yellowCards: String(preferredStat.yellowCards ?? ""),
    redCards: String(preferredStat.redCards ?? ""),
  };
  const currentClub = preview.currentClub.name ?? "";
  const nameParts = preview.identity.fullName.trim().split(/\s+/);
  const lastName = preview.identity.lastName ?? nameParts.at(-1) ?? "";
  const firstName =
    preview.identity.firstName ?? nameParts.slice(0, -1).join(" ");
  const clubHistory =
    preview.history
      ?.map((entry) => ({
        club: entry.club?.trim() ?? "",
        teamCategory: "",
        from: entry.from ?? "",
        to: entry.to ?? "",
        games: String(entry.games ?? ""),
        goals: String(entry.goals ?? ""),
        yellowCards: String(entry.yellowCards ?? ""),
        redCards: String(entry.redCards ?? ""),
      }))
      .filter((entry) => Boolean(entry.club)) ?? [];
  const clubHistoryWithStats = clubHistory.map((entry, index) => {
    const isCurrentClub =
      currentClub &&
      entry.club.trim().toLowerCase() === currentClub.trim().toLowerCase();
    const shouldUseImportedStats =
      isCurrentClub || (index === 0 && clubHistory.length === 1);

    if (!shouldUseImportedStats) {
      return entry;
    }

    return {
      ...entry,
      teamCategory: entry.teamCategory || preferredCategory,
      games: entry.games || importedStats.games,
      goals: entry.goals || importedStats.goals,
      yellowCards: entry.yellowCards || importedStats.yellowCards,
      redCards: entry.redCards || importedStats.redCards,
    };
  });

  return {
    firstName,
    lastName,
    position: preview.identity.position ?? "",
    birthDate: "",
    currentClub,
    heightCm: String(preview.identity.heightCm ?? ""),
    ...importedStats,
    about: "",
    skills: "",
    highlightedSkills: "",
    preferredFoot: "",
    weakFootRating: "3",
    searchRegion: "",
    clubHistory:
      clubHistoryWithStats.length > 0
        ? clubHistoryWithStats
        : currentClub
          ? [
              {
                club: currentClub,
                teamCategory: preferredCategory || "KM",
                from: "",
                to: "",
                ...importedStats,
              },
            ]
          : [],
    profileImageUrl: preview.identity.profileImageUrl ?? undefined,
  };
};

const emptyEditableOefbData = (fullName: string): EditableOefbData => {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: nameParts.slice(0, -1).join(" "),
    lastName: nameParts.at(-1) ?? "",
    position: "",
    birthDate: "",
    currentClub: "",
    heightCm: "",
    games: "",
    goals: "",
    yellowCards: "",
    redCards: "",
    about: "",
    skills: "",
    highlightedSkills: "",
    preferredFoot: "",
    weakFootRating: "3",
    searchRegion: "",
    clubHistory: [],
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [isClub, setIsClub] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    clubName: "",
    playerName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oefbUrl, setOefbUrl] = useState(defaultOefbUrl);
  const [oefbLoading, setOefbLoading] = useState(false);
  const [oefbPreview, setOefbPreview] =
    useState<OefbRegistrationPreview | null>(null);
  const [clubOefbUrl, setClubOefbUrl] = useState(
    "https://vereine.oefb.at/RbOJessas/News/",
  );
  const [clubOefbLoading, setClubOefbLoading] = useState(false);
  const [clubOefbPreview, setClubOefbPreview] =
    useState<OefbClubPreview | null>(null);
  const [registrationStep, setRegistrationStep] = useState<
    | "account"
    | "edit-oefb"
    | "self-rating"
    | "profile-picture"
    | "club-profile"
    | "club-requirements"
    | "club-logo"
  >("account");
  const [editableOefbData, setEditableOefbData] =
    useState<EditableOefbData | null>(null);
  const [selfRatingAttributes, setSelfRatingAttributes] =
    useState<SelfRatingAttributes>({
      tempo: 50,
      shooting: 50,
      passing: 50,
      dribbling: 50,
      defending: 50,
      physical: 50,
    });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
  const [clubProfileData, setClubProfileData] = useState<ClubProfileFormData>({
    clubName: "",
    verband: "",
    wettbewerb: "",
    league: "",
    oefbClubProfileUrl: "",
    sportsGroundName: "",
    sportsGroundAddress: "",
    sportsGroundZipCode: "",
    sportsGroundCity: "",
    obmannEmail: "",
    phone: "",
    description: "",
  });
  const [clubLogoFile, setClubLogoFile] = useState<File | null>(null);
  const [clubLogoPreview, setClubLogoPreview] = useState<string | null>(null);
  const [clubCompetitionOptions, setClubCompetitionOptions] = useState<
    ClubCompetitionOption[]
  >([]);
  const [clubRequirementData, setClubRequirementData] =
    useState<ClubRequirementFormData>({
      positions: [],
      byPosition: {},
    });
  const [activeClubRequirementPosition, setActiveClubRequirementPosition] =
    useState("");

  useEffect(() => {
    if (!isClub) {
      return;
    }

    apiFetch("/clubs/competition-options")
      .then((options) => {
        setClubCompetitionOptions(options as ClubCompetitionOption[]);
      })
      .catch(() => {
        setClubCompetitionOptions([]);
      });
  }, [isClub]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOefbImport = async () => {
    setError("");
    setOefbLoading(true);

    try {
      const data = (await apiFetch(
        `/oefb/player?url=${encodeURIComponent(oefbUrl)}`,
      )) as OefbRegistrationPreview;

      setOefbPreview(data);
      const editableData = toEditableOefbData(data);
      setEditableOefbData(editableData);
      setFormData((current) => ({
        ...current,
        playerName: `${editableData.firstName} ${editableData.lastName}`.trim(),
      }));
      setRegistrationStep("edit-oefb");
    } catch (err) {
      setOefbPreview(null);
      setError(
        (err as Error).message || "ÖFB-Daten konnten nicht geladen werden.",
      );
    } finally {
      setOefbLoading(false);
    }
  };

  const handleClubOefbImport = async () => {
    setError("");
    setClubOefbLoading(true);

    try {
      const preview = (await apiFetch(
        `/clubs/oefb-preview?url=${encodeURIComponent(clubOefbUrl)}`,
      )) as OefbClubPreview;

      setClubOefbPreview(preview);
      if (preview.logoUrl) {
        setClubLogoPreview(preview.logoUrl);
      }
      setClubProfileData((current) => ({
        ...current,
        clubName: preview.clubName || current.clubName,
        verband: preview.competitionSelection?.verband || current.verband,
        wettbewerb:
          preview.competitionSelection?.wettbewerb || current.wettbewerb,
        league: preview.competitionSelection?.league || current.league,
        oefbClubProfileUrl: preview.source.url,
        sportsGroundName:
          preview.sportsGroundName || current.sportsGroundName,
        sportsGroundAddress:
          preview.sportsGroundAddress || current.sportsGroundAddress,
        sportsGroundZipCode:
          preview.sportsGroundZipCode || current.sportsGroundZipCode,
        sportsGroundCity:
          preview.sportsGroundCity || current.sportsGroundCity,
        obmannEmail: preview.obmannEmail || current.obmannEmail,
        phone: preview.obmannPhone || current.phone,
      }));
      setFormData((current) => ({
        ...current,
        clubName: preview.clubName || current.clubName,
        email: preview.obmannEmail || current.email,
      }));
    } catch (err) {
      setClubOefbPreview(null);
      setError(
        (err as Error).message ||
          "ÖFB-Vereinsdaten konnten nicht geladen werden.",
      );
    } finally {
      setClubOefbLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    const name = isClub ? clubProfileData.clubName : formData.playerName;

    if (!isClub && (!name || !name.trim())) {
      setError("Spieler-Name erforderlich");
      return;
    }

    if (isClub && registrationStep === "account") {
      setRegistrationStep("club-profile");
      return;
    }

    if (isClub && registrationStep === "club-profile") {
      if (!clubProfileData.clubName.trim()) {
        setError("Club-Name erforderlich");
        return;
      }
      if (
        !clubProfileData.verband ||
        !clubProfileData.wettbewerb ||
        !clubProfileData.league
      ) {
        setError("Verband, Wettbewerb und Liga sind erforderlich");
        return;
      }

      const hasOefbClubUrl = Boolean(clubProfileData.oefbClubProfileUrl.trim());

      if (
        !hasOefbClubUrl &&
        (!clubProfileData.sportsGroundName.trim() ||
          !clubProfileData.sportsGroundAddress.trim() ||
          !clubProfileData.sportsGroundZipCode.trim() ||
          !clubProfileData.sportsGroundCity.trim())
      ) {
        setError(
          "Ohne ÖFB-Link sind Sportplatz, Adresse, PLZ und Stadt erforderlich.",
        );
        return;
      }

      if (clubRequirementData.positions.length === 0) {
        setError("Bitte mindestens eine gesuchte Position auswählen");
        return;
      }

      setActiveClubRequirementPosition(
        (current) => current || clubRequirementData.positions[0] || "",
      );
      setRegistrationStep("club-requirements");
      return;
    }

    if (isClub && registrationStep === "club-requirements") {
      const incompletePosition = clubRequirementData.positions.find((position) => {
        const requirement =
          clubRequirementData.byPosition[position] ??
          createDefaultClubPositionRequirement();

        return requirement.requiredSkills.length === 0;
      });

      if (incompletePosition) {
        setError(
          `Bitte für ${incompletePosition} mindestens eine Hauptfähigkeit auswählen.`,
        );
        setActiveClubRequirementPosition(incompletePosition);
        return;
      }

      setRegistrationStep("club-logo");
      return;
    }

    if (isClub && registrationStep === "club-logo" && !clubLogoFile && !clubLogoPreview) {
      setError("Bitte ein Vereinslogo hochladen");
      return;
    }

    // Account step -> move to profile editing
    if (!isClub && registrationStep === "account") {
      setEditableOefbData(
        (current) => current ?? emptyEditableOefbData(formData.playerName),
      );
      setRegistrationStep("edit-oefb");
      return;
    }

    // Edit ÖFB step -> show imported ÖFB statistics
    if (!isClub && registrationStep === "edit-oefb") {
      setRegistrationStep("self-rating");
      return;
    }

    // Self-rating step → move to profile-picture
    if (!isClub && registrationStep === "self-rating") {
      setRegistrationStep("profile-picture");
      return;
    }

    setLoading(true);

    try {
      if (!isClub && editableOefbData) {
        if (!isValidBirthDate(editableOefbData.birthDate)) {
          setError("Bitte ein vollständiges gültiges Geburtsdatum auswählen");
          setLoading(false);
          return;
        }

        if (selectedPositions.length === 0) {
          setError("Mindestens eine Position erforderlich");
          setLoading(false);
          return;
        }

        if (!editableOefbData.searchRegion && !editableOefbData.currentClub) {
          setError("Region oder aktueller Verein erforderlich");
          setLoading(false);
          return;
        }
      }

      try {
        await apiFetch("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: isClub ? "club" : "player",
          }),
        });
      } catch (registerError) {
        const message = (registerError as Error).message;

        if (message === "User already exists") {
          setError("Zu dieser E-Mail existiert bereits ein Konto.");
          setLoading(false);
          return;
        }

        throw registerError;
      }

      // For now, auto-login after registration
      const loginResponse = (await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })) as LoginResponse;

      if (loginResponse.token) {
        localStorage.setItem("token", loginResponse.token);
        localStorage.setItem("userRole", loginResponse.user.role);
        localStorage.setItem("userId", String(loginResponse.user.id));

        if (!isClub && oefbPreview) {
          localStorage.setItem("oefbProfileUrl", oefbPreview.source.url);
        }
        if (!isClub && editableOefbData) {
          localStorage.setItem(
            "oefbEditedProfile",
            JSON.stringify(editableOefbData),
          );
        }

        if (!isClub && editableOefbData) {
          let createdProfile: { id: number };
          let clubHistoryEntries = editableOefbData.clubHistory
            .filter((entry) => entry.club.trim())
            .map((entry) => ({ ...entry, club: entry.club.trim() }));
          const currentClubName = editableOefbData.currentClub.trim();
          const currentClubCategory =
            clubHistoryEntries.find(
              (entry) =>
                entry.club.toLowerCase() === currentClubName.toLowerCase(),
            )?.teamCategory || "KM";
          const currentClubStats = {
            teamCategory: currentClubCategory,
            games: editableOefbData.games,
            goals: editableOefbData.goals,
            yellowCards: editableOefbData.yellowCards,
            redCards: editableOefbData.redCards,
          };
          const currentClubHistoryIndex = clubHistoryEntries.findIndex(
            (entry) =>
              entry.club.toLowerCase() === currentClubName.toLowerCase(),
          );

          if (currentClubName && currentClubHistoryIndex === -1) {
            clubHistoryEntries.unshift({
              club: currentClubName,
              from: "",
              to: "",
              ...currentClubStats,
            });
          } else if (currentClubName) {
            clubHistoryEntries = clubHistoryEntries.map((entry, index) =>
              index === currentClubHistoryIndex
                ? {
                    ...entry,
                    teamCategory: entry.teamCategory || currentClubCategory,
                    games: entry.games || currentClubStats.games,
                    goals: entry.goals || currentClubStats.goals,
                    yellowCards:
                      entry.yellowCards || currentClubStats.yellowCards,
                    redCards: entry.redCards || currentClubStats.redCards,
                  }
                : entry,
            );
          }

          try {
            createdProfile = (await apiFetch("/players/profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loginResponse.token}`,
              },
              body: JSON.stringify({
                name: `${editableOefbData.firstName} ${editableOefbData.lastName}`.trim(),
                birthdate: formatBirthDateForStorage(
                  editableOefbData.birthDate,
                ),
                position: selectedPositions,
                location:
                  editableOefbData.searchRegion ||
                  editableOefbData.currentClub ||
                  "Nicht angegeben",
                description: editableOefbData.about || undefined,
                openToPlay: true,
                profileImageUrl: editableOefbData.profileImageUrl,
                oefbProfileUrl: oefbPreview?.source.url,
                skills: selectedSkills,
                highlightedSkills: selectedHighlightedSkills,
                preferredFoot: editableOefbData.preferredFoot || undefined,
                weakFootRating: Number(editableOefbData.weakFootRating || 3),
                heightCm: numberOrUndefined(editableOefbData.heightCm),
              }),
            })) as { id: number };
          } catch (profileError) {
            const message = (profileError as Error).message;

            if (message !== "Profile already exists") {
              throw profileError;
            }

            const existingProfile = (await apiFetch("/players/me", {
              headers: {
                Authorization: `Bearer ${loginResponse.token}`,
              },
            })) as { id: number } | null;

            if (!existingProfile) {
              throw profileError;
            }

            createdProfile = existingProfile;
          }

          try {
            await apiFetch("/player-attributes", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loginResponse.token}`,
              },
              body: JSON.stringify({
                playerId: createdProfile.id,
                ...selfRatingAttributes,
              }),
            });
          } catch (attributesError) {
            const message = (attributesError as Error).message;

            if (message !== "Attributes already exist") {
              throw attributesError;
            }
          }

          if (profileImageFile) {
            const imageFormData = new FormData();
            imageFormData.append("image", profileImageFile);

            await apiFetch(`/players/upload-image/${createdProfile.id}`, {
              method: "POST",
              body: imageFormData,
            });
          }

          await Promise.all(
            clubHistoryEntries.map((entry) =>
              apiFetch("/player-club-history", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  playerId: createdProfile.id,
                  clubName: entry.club.trim(),
                  relationType: "PLAYER",
                  teamCategory: entry.teamCategory || undefined,
                  startDate: entry.from || undefined,
                  endDate: entry.to || undefined,
                  games: numberOrUndefined(entry.games),
                  goals: numberOrUndefined(entry.goals),
                  yellowCards: numberOrUndefined(entry.yellowCards),
                  redCards: numberOrUndefined(entry.redCards),
                }),
              }),
            ),
          );

          router.push("/player/dashboard");
          return;
        }

        if (isClub) {
          let createdClub: { id: number };

          try {
            createdClub = (await apiFetch("/clubs/profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loginResponse.token}`,
              },
              body: JSON.stringify({
                userId: loginResponse.user.id,
                clubName: clubProfileData.clubName.trim(),
                verband: clubProfileData.verband,
                wettbewerb: clubProfileData.wettbewerb,
                league: clubProfileData.league,
                oefbClubProfileUrl:
                  clubProfileData.oefbClubProfileUrl.trim() || undefined,
                sportsGroundName:
                  clubProfileData.sportsGroundName.trim() || undefined,
                sportsGroundAddress:
                  clubProfileData.sportsGroundAddress.trim() || undefined,
                sportsGroundZipCode:
                  clubProfileData.sportsGroundZipCode.trim() || undefined,
                sportsGroundCity:
                  clubProfileData.sportsGroundCity.trim() || undefined,
                phone: clubProfileData.phone?.trim() || undefined,
                obmannEmail:
                  clubProfileData.obmannEmail?.trim() ||
                  formData.email.trim() ||
                  undefined,
                logoPath: clubLogoFile
                  ? undefined
                  : clubOefbPreview?.logoUrl || undefined,
                description: clubProfileData.description.trim() || undefined,
              }),
            })) as { id: number };
          } catch (clubProfileError) {
            const message = (clubProfileError as Error).message;

            if (message !== "Club profile already exists") {
              throw clubProfileError;
            }

            const existingClub = (await apiFetch("/clubs/me", {
              headers: {
                Authorization: `Bearer ${loginResponse.token}`,
              },
            })) as { id: number } | null;

            if (!existingClub) {
              throw clubProfileError;
            }

            createdClub = existingClub;
          }

          await Promise.all(
            clubRequirementData.positions.map((position) => {
              const requirement =
                clubRequirementData.byPosition[position] ??
                createDefaultClubPositionRequirement();

              return apiFetch("/club-requirements", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${loginResponse.token}`,
                },
                body: JSON.stringify({
                  position,
                  minTempo: requirement.minValues.tempo,
                  minShooting: requirement.minValues.shooting,
                  minPassing: requirement.minValues.passing,
                  minDribbling: requirement.minValues.dribbling,
                  minDefending: requirement.minValues.defending,
                  minPhysical: requirement.minValues.physical,
                  tempoWeight: requirement.attributePriority.tempo,
                  shootingWeight:
                    requirement.attributePriority.shooting,
                  passingWeight: requirement.attributePriority.passing,
                  dribblingWeight:
                    requirement.attributePriority.dribbling,
                  defendingWeight:
                    requirement.attributePriority.defending,
                  physicalWeight:
                    requirement.attributePriority.physical,
                  requiredSkills: requirement.requiredSkills,
                  highlightedSkills: requirement.highlightedSkills,
                  description: `Gesuchte Position: ${position}`,
                }),
              });
            }),
          );

          if (clubLogoFile) {
            const logoFormData = new FormData();
            logoFormData.append("logo", clubLogoFile);

            await apiFetch(`/clubs/${createdClub.id}/logo`, {
              method: "PATCH",
              body: logoFormData,
            });
          }

          router.push("/club/dashboard");
          return;
        } else {
          router.push("/player/dashboard");
        }
      }
    } catch (err) {
      setError((err as Error).message || "Registrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const activeName = formData.playerName;
  const passwordReady = formData.password.length >= 8;
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;
  const updateEditableOefbData = (
    field: keyof EditableOefbData,
    value: string,
  ) => {
    setEditableOefbData((current) => {
      if (!current) {
        return current;
      }

      const updated = {
        ...current,
        [field]: value,
      };

      if (field === "firstName" || field === "lastName") {
        const nextFirstName = field === "firstName" ? value : updated.firstName;
        const nextLastName = field === "lastName" ? value : updated.lastName;
        setFormData((form) => ({
          ...form,
          playerName: `${nextFirstName} ${nextLastName}`.trim(),
        }));
      }

      return updated;
    });
  };

  const selectedSkills =
    (editableOefbData?.skills ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean) ?? [];
  const selectedHighlightedSkills =
    (editableOefbData?.highlightedSkills ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean) ?? [];

  const toggleSkill = (skill: string) => {
    const nextSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((selectedSkill) => selectedSkill !== skill)
      : [...selectedSkills, skill];

    updateEditableOefbData("skills", nextSkills.join(", "));

    if (!nextSkills.includes(skill) && selectedHighlightedSkills.includes(skill)) {
      updateEditableOefbData(
        "highlightedSkills",
        selectedHighlightedSkills
          .filter((selectedSkill) => selectedSkill !== skill)
          .join(", "),
      );
    }
  };

  const toggleHighlightedSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      return;
    }

    const nextSkills = selectedHighlightedSkills.includes(skill)
      ? selectedHighlightedSkills.filter((selectedSkill) => selectedSkill !== skill)
      : [...selectedHighlightedSkills, skill];

    updateEditableOefbData("highlightedSkills", nextSkills.join(", "));
  };

  const toggleClubRequirementSkill = (
    type: "requiredSkills" | "highlightedSkills",
    skill: string,
  ) => {
    if (!activeClubRequirementPosition) {
      return;
    }

    setClubRequirementData((current) => {
      const currentRequirement =
        current.byPosition[activeClubRequirementPosition] ??
        createDefaultClubPositionRequirement();
      const selected = currentRequirement[type].includes(skill);
      const nextSkills = selected
        ? currentRequirement[type].filter((selectedSkill) => selectedSkill !== skill)
        : [...currentRequirement[type], skill];
      const nextRequirement = {
        ...currentRequirement,
        [type]: nextSkills,
      };

      if (type === "requiredSkills" && selected) {
        nextRequirement.highlightedSkills =
          currentRequirement.highlightedSkills.filter(
            (selectedSkill) => selectedSkill !== skill,
          );
      }

      return {
        ...current,
        byPosition: {
          ...current.byPosition,
          [activeClubRequirementPosition]: nextRequirement,
        },
      };
    });
  };

  const toggleClubPosition = (position: string) => {
    setClubRequirementData((current) => {
      const alreadySelected = current.positions.includes(position);
      const nextPositions = alreadySelected
        ? current.positions.filter((selected) => selected !== position)
        : current.positions.length >= 3
          ? current.positions
          : [...current.positions, position];
      const nextByPosition = { ...current.byPosition };

      if (alreadySelected) {
        delete nextByPosition[position];
        if (activeClubRequirementPosition === position) {
          setActiveClubRequirementPosition(nextPositions[0] ?? "");
        }
      } else if (!current.byPosition[position] && nextPositions.includes(position)) {
        nextByPosition[position] = createDefaultClubPositionRequirement();
        setActiveClubRequirementPosition(position);
      }

      return {
        ...current,
        positions: nextPositions,
        byPosition: nextByPosition,
      };
    });
  };

  const updateClubAttributePriority = (
    attribute: AttributeKey,
    priority: AttributePriority,
  ) => {
    if (!activeClubRequirementPosition) {
      return;
    }

    setClubRequirementData((current) => {
      const currentRequirement =
        current.byPosition[activeClubRequirementPosition] ??
        createDefaultClubPositionRequirement();

      return {
        ...current,
        byPosition: {
          ...current.byPosition,
          [activeClubRequirementPosition]: {
            ...currentRequirement,
            attributePriority: {
              ...currentRequirement.attributePriority,
              [attribute]: priority,
            },
          },
        },
      };
    });
  };

  const updateClubMinAttribute = (attribute: AttributeKey, value: number) => {
    if (!activeClubRequirementPosition) {
      return;
    }

    setClubRequirementData((current) => ({
      ...current,
      byPosition: {
        ...current.byPosition,
        [activeClubRequirementPosition]: {
          ...(current.byPosition[activeClubRequirementPosition] ??
            createDefaultClubPositionRequirement()),
          minValues: {
            ...(current.byPosition[activeClubRequirementPosition]?.minValues ??
              createDefaultClubPositionRequirement().minValues),
            [attribute]: value,
          },
        },
      },
    }));
  };

  const selectedPositions =
    (editableOefbData?.position ?? "")
      .split(",")
      .map((position) => position.trim())
      .filter((position) => selectablePositions.includes(position))
      .filter(Boolean) ?? [];
  const visiblePlayerSkillOptions = selectedPositions.includes("GK")
    ? footballSkillOptions
    : fieldPlayerSkillOptions;
  const activeClubRequirement =
    (activeClubRequirementPosition &&
      clubRequirementData.byPosition[activeClubRequirementPosition]) ||
    createDefaultClubPositionRequirement();
  const visibleClubSkillOptions = activeClubRequirementPosition === "GK"
    ? goalkeeperSkillOptions
    : fieldPlayerSkillOptions;
  const isActiveClubGoalkeeperRequirement =
    activeClubRequirementPosition === "GK";

  const calculateProgress = (checks: boolean[]) => {
    const completed = checks.filter(Boolean).length;

    return Math.round((completed / checks.length) * 100);
  };

  const playerProgress = calculateProgress([
    formData.playerName.trim().length > 0,
    formData.email.trim().length > 0,
    passwordReady,
    passwordsMatch,
    Boolean(editableOefbData?.firstName.trim()),
    Boolean(editableOefbData?.lastName.trim()),
    Boolean(editableOefbData?.birthDate && isValidBirthDate(editableOefbData.birthDate)),
    selectedPositions.length > 0,
    Boolean(editableOefbData?.searchRegion || editableOefbData?.currentClub),
    Boolean(editableOefbData?.preferredFoot),
    selectedSkills.length > 0,
    Boolean(editableOefbData?.about.trim()),
    Boolean(profileImageFile || profileImagePreview || editableOefbData?.profileImageUrl),
  ]);

  const clubProgress = calculateProgress([
    clubProfileData.clubName.trim().length > 0,
    formData.email.trim().length > 0,
    passwordReady,
    passwordsMatch,
    Boolean(clubProfileData.verband),
    Boolean(clubProfileData.wettbewerb),
    Boolean(clubProfileData.league),
    Boolean(clubProfileData.oefbClubProfileUrl.trim()),
    Boolean(clubProfileData.sportsGroundName.trim()),
    Boolean(clubProfileData.sportsGroundAddress.trim()),
    Boolean(clubProfileData.sportsGroundZipCode.trim()),
    Boolean(clubProfileData.sportsGroundCity.trim()),
    Boolean(clubProfileData.phone.trim()),
    clubRequirementData.positions.length > 0,
    clubRequirementData.positions.every(
      (position) =>
        (clubRequirementData.byPosition[position]?.requiredSkills.length ?? 0) >
        0,
    ),
    clubRequirementData.positions.some((position) =>
      Object.values(
        clubRequirementData.byPosition[position]?.attributePriority ??
          createDefaultClubPositionRequirement().attributePriority,
      ).some((priority) => priority > 1),
    ),
    clubRequirementData.positions.some((position) =>
      Object.values(
        clubRequirementData.byPosition[position]?.minValues ??
          createDefaultClubPositionRequirement().minValues,
      ).some((value) => value !== 50),
    ),
    Boolean(clubProfileData.description.trim()),
    Boolean(clubLogoFile || clubLogoPreview),
  ]);
  const progress = isClub ? clubProgress : playerProgress;

  const togglePosition = (position: string) => {
    const validSelectedPositions = selectedPositions.filter(
      (selectedPosition) => selectablePositions.includes(selectedPosition),
    );
    const nextPositions = selectedPositions.includes(position)
      ? validSelectedPositions.filter(
          (selectedPosition) => selectedPosition !== position,
        )
      : validSelectedPositions.length >= 3
        ? validSelectedPositions
        : [...validSelectedPositions, position];

    updateEditableOefbData("position", nextPositions.join(", "));
  };

  const selectPreferredFoot = (foot: "Links" | "Rechts") => {
    updateEditableOefbData("preferredFoot", foot);
  };

  const updateBirthDatePart = (
    part: "day" | "month" | "year",
    value: string,
  ) => {
    if (!editableOefbData) {
      return;
    }

    const currentParts = getBirthDateParts(editableOefbData.birthDate);
    const nextParts = {
      ...currentParts,
      [part]: value,
    };

    if (!nextParts.day && !nextParts.month && !nextParts.year) {
      updateEditableOefbData("birthDate", "");
      return;
    }

    updateEditableOefbData(
      "birthDate",
      `${nextParts.year}-${nextParts.month}-${nextParts.day}`,
    );
  };

  const updateClubHistoryEntry = (
    index: number,
    field: keyof ClubHistoryEntry,
    value: string,
  ) => {
    setEditableOefbData((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        clubHistory: current.clubHistory.map((entry, entryIndex) =>
          entryIndex === index
            ? {
                ...entry,
                [field]: value,
              }
            : entry,
        ),
      };
    });
  };

  const addClubHistoryEntry = () => {
    setEditableOefbData((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        clubHistory: [
          ...current.clubHistory,
          {
            club: "",
            teamCategory: "",
            from: "",
            to: "",
            games: "",
            goals: "",
            yellowCards: "",
            redCards: "",
          },
        ],
      };
    });
  };

  const removeClubHistoryEntry = (index: number) => {
    setEditableOefbData((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        clubHistory: current.clubHistory.filter(
          (_, entryIndex) => entryIndex !== index,
        ),
      };
    });
  };

  const birthDateParts = editableOefbData
    ? getBirthDateParts(editableOefbData.birthDate)
    : { day: "", month: "", year: "" };
  const overallSelfRating = Math.round(
    Object.values(selfRatingAttributes).reduce((sum, value) => sum + value, 0) /
      Object.keys(selfRatingAttributes).length,
  );
  const isEditingOefbProfile = !isClub && registrationStep === "edit-oefb";
  const isSelfRating = !isClub && registrationStep === "self-rating";
  const isProfilePicture = !isClub && registrationStep === "profile-picture";
  const isClubProfileStep = isClub && registrationStep === "club-profile";
  const isClubRequirementsStep =
    isClub && registrationStep === "club-requirements";
  const isClubLogoStep = isClub && registrationStep === "club-logo";
  const isExpandedRegistrationStep =
    isEditingOefbProfile ||
    isSelfRating ||
    isProfilePicture ||
    isClubProfileStep ||
    isClubRequirementsStep ||
    isClubLogoStep;
  const selectedVerband = clubCompetitionOptions.find(
    (option) => option.verband === clubProfileData.verband,
  );
  const wettbewerbOptions = selectedVerband?.wettbewerbe ?? [];
  const leagueOptions =
    wettbewerbOptions.find(
      (option) => option.name === clubProfileData.wettbewerb,
    )?.ligen ?? [];

  return (
    <div className="min-h-screen bg-[#f4f8f5] px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <div
        className={`mx-auto grid min-h-[calc(100vh-4rem)] w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-green-950/10 transition-[max-width,grid-template-columns] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpandedRegistrationStep
            ? "max-w-5xl lg:grid-cols-[0fr_1fr]"
            : "max-w-6xl lg:grid-cols-[0.92fr_1.08fr]"
        }`}
      >
        <section
          aria-hidden={isExpandedRegistrationStep}
          className={`relative hidden min-w-0 overflow-hidden bg-[#0b1f18] text-white transition-[opacity,transform,filter] duration-500 ease-out lg:flex ${
            isExpandedRegistrationStep
              ? "pointer-events-none opacity-0 -translate-x-8 blur-sm"
              : "opacity-100 translate-x-0 blur-0"
          }`}
        >
          <div className="flex min-w-[360px] flex-1 flex-col gap-10 p-10">
            <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-green-400/25 to-transparent" />
            <div className="relative">
              <Link
                href="/"
                className="inline-flex items-center gap-3 text-sm font-semibold text-green-100"
              >
                <span className="grid size-10 place-items-center rounded-full bg-green-400 text-lg font-black text-green-950">
                  M
                </span>
                Match your Club
              </Link>

              <div
                className={`relative mt-16 max-w-md ${
                  isClub ? "min-h-[520px]" : "min-h-[470px]"
                }`}
              >
                <div
                  aria-hidden={isClub}
                  className={`absolute inset-0 transition-all duration-500 ease-out ${
                    isClub
                      ? "pointer-events-none -z-10 translate-y-3 opacity-0"
                      : "z-10 translate-y-0 opacity-100"
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">
                    Spieler Registrierung
                  </p>
                  <h1 className="mt-5 text-5xl font-black leading-tight">
                    Dein Profil. Dein Spiel. Dein nächster Club.
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-green-50/75">
                    Erstelle ein professionelles Spielerprofil und mache es
                    Clubs leichter, dich schnell einzuschätzen.
                  </p>
                </div>

                <div
                  aria-hidden={!isClub}
                  className={`absolute inset-0 transition-all duration-500 ease-out ${
                    isClub
                      ? "z-10 translate-y-0 opacity-100"
                      : "pointer-events-none -z-10 translate-y-3 opacity-0"
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">
                    Club Registrierung
                  </p>
                  <h1 className="mt-5 text-5xl font-black leading-tight">
                    Dein Club. Dein Kader. Deine nächsten Verstärkungen.
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-green-50/75">
                    Erstelle euren Vereinsaccount und finde passende Spieler
                    schnell und gezielt.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[272px]">
              <div
                aria-hidden={isClub}
                className={`absolute inset-0 grid gap-4 transition-all duration-500 ease-out ${
                  isClub
                    ? "pointer-events-none -z-10 translate-y-3 opacity-0"
                    : "z-10 translate-y-0 opacity-100"
                }`}
              >
                {[
                  ["01", "Account erstellen", "Sichere deine Zugangsdaten."],
                  [
                    "02",
                    "Profil ausbauen",
                    "Füge Position, Erfahrung und Highlights hinzu.",
                  ],
                  [
                    "03",
                    "Clubs erreichen",
                    "Bewirb dich gezielt auf passende Möglichkeiten.",
                  ],
                ].map(([step, title, text]) => (
                  <div
                    key={`player-${step}`}
                    className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur"
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-green-300 font-bold text-green-950">
                        {step}
                      </span>
                      <div>
                        <h2 className="font-bold text-white">{title}</h2>
                        <p className="mt-1 text-sm leading-6 text-green-50/65">
                          {text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                aria-hidden={!isClub}
                className={`absolute inset-0 grid gap-4 transition-all duration-500 ease-out ${
                  isClub
                    ? "z-10 translate-y-0 opacity-100"
                    : "pointer-events-none -z-10 translate-y-3 opacity-0"
                }`}
              >
                {[
                  [
                    "01",
                    "Account erstellen",
                    "Lege euren Vereinszugang sicher an.",
                  ],
                  [
                    "02",
                    "Suchprofil festlegen",
                    "Wähle Positionen, wichtige Attribute und Mindestwerte.",
                  ],
                  [
                    "03",
                    "Logo hochladen",
                    "Füge euer Vereinslogo hinzu und schließe die Registrierung ab.",
                  ],
                ].map(([step, title, text]) => (
                  <div
                    key={`club-${step}`}
                    className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur"
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-green-300 font-bold text-green-950">
                        {step}
                      </span>
                      <div>
                        <h2 className="font-bold text-white">{title}</h2>
                        <p className="mt-1 text-sm leading-6 text-green-50/65">
                          {text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center bg-[radial-gradient(circle_at_top_right,#dcfce7,transparent_34%),linear-gradient(135deg,#ffffff,#f7fbf8)] p-5 sm:p-8 lg:p-12">
          <div
            className={`w-full transition-[max-width,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isExpandedRegistrationStep
                ? "max-w-4xl scale-[1.01]"
                : "max-w-xl scale-100"
            }`}
          >
            <div className="mb-8 lg:hidden">
              <Link href="/" className="text-2xl font-black text-green-800">
                Match your Club
              </Link>
              <div className="relative mt-2 min-h-5 text-sm text-neutral-600">
                <p
                  aria-hidden={isClub}
                  className={`absolute inset-0 transition-all duration-400 ease-out ${
                    isClub
                      ? "pointer-events-none -z-10 translate-y-1 opacity-0"
                      : "z-10 translate-y-0 opacity-100"
                  }`}
                >
                  Moderner Einstieg für Spieler und Clubs.
                </p>
                <p
                  aria-hidden={!isClub}
                  className={`absolute inset-0 transition-all duration-400 ease-out ${
                    isClub
                      ? "z-10 translate-y-0 opacity-100"
                      : "pointer-events-none -z-10 translate-y-1 opacity-0"
                  }`}
                >
                  Schneller Einstieg für Vereine.
                </p>
              </div>
            </div>

            {registrationStep === "account" && (
              <div className="mb-7 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsClub(false);
                      setRegistrationStep("account");
                      setError("");
                    }}
                    className={`rounded-full px-4 py-3 text-sm font-bold transition-all ${
                      !isClub
                        ? "bg-neutral-950 text-white shadow-lg shadow-neutral-950/15"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                    }`}
                  >
                    Spieler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsClub(true);
                      setRegistrationStep("account");
                      setError("");
                    }}
                    className={`rounded-full px-4 py-3 text-sm font-bold transition-all ${
                      isClub
                        ? "bg-neutral-950 text-white shadow-lg shadow-neutral-950/15"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                    }`}
                  >
                    Club
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleRegister}
              className="rounded-[1.5rem] border border-neutral-200 bg-white p-6 shadow-xl shadow-green-950/10 sm:p-8"
            >
              <div className="mb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="relative min-h-[92px] w-full min-w-0 sm:min-h-[82px]">
                    <div
                      aria-hidden={isClub}
                      className={`absolute inset-0 transition-all duration-400 ease-out ${
                        isClub
                          ? "pointer-events-none -z-10 translate-y-1 opacity-0"
                          : "z-10 translate-y-0 opacity-100"
                      }`}
                    >
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
                        Spieler-Account
                      </p>
                      <h2 className="mt-3 max-w-full text-3xl font-black leading-tight text-neutral-950 sm:text-4xl">
                        Spielerprofil starten
                      </h2>
                    </div>
                    <div
                      aria-hidden={!isClub}
                      className={`absolute inset-0 transition-all duration-400 ease-out ${
                        isClub
                          ? "z-10 translate-y-0 opacity-100"
                          : "pointer-events-none -z-10 translate-y-1 opacity-0"
                      }`}
                    >
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
                        Club-Account
                      </p>
                      <h2 className="mt-3 max-w-full text-3xl font-black leading-tight text-neutral-950 sm:text-4xl">
                        Club registrieren
                      </h2>
                    </div>
                  </div>
                  <div className="grid size-16 shrink-0 place-items-center self-start rounded-2xl bg-green-100 text-xl font-black text-green-800 sm:self-auto">
                    {progress}%
                  </div>
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                </div>
              )}

              <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-red-600">
                * = Pflichtfeld
              </p>

              <div
                aria-hidden={isClub}
                className={`overflow-hidden transition-all duration-500 ease-out ${
                  isClub
                    ? "pointer-events-none mb-0 max-h-0 -translate-y-2 opacity-0"
                    : "mb-6 max-h-[420px] translate-y-0 opacity-100"
                }`}
              >
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-900">
                    <span className="grid size-8 place-items-center rounded-full bg-green-100 text-base font-black text-green-800">
                      ✓
                    </span>
                    ÖFB verbinden = verifiziertes Profil für Clubs sichtbar
                    machen.
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1">
                      <span className="mb-2 block text-sm font-black text-green-900">
                        ÖFB-Profil live importieren
                      </span>
                      <input
                        type="url"
                        value={oefbUrl}
                        onChange={(event) => setOefbUrl(event.target.value)}
                        className="h-12 w-full rounded-xl border border-green-200 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                        placeholder="https://www.oefb.at/Profile/Spieler/..."
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleOefbImport}
                      disabled={oefbLoading}
                      className="h-12 rounded-xl bg-neutral-950 px-4 text-sm font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      {oefbLoading ? "Prüft..." : "Daten laden"}
                    </button>
                  </div>

                  {oefbPreview && registrationStep === "account" && (
                    <div className="mt-4 rounded-xl bg-white p-4 text-sm">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["Vorname", editableOefbData?.firstName],
                          ["Nachname", editableOefbData?.lastName],
                          ["Position", oefbPreview.identity.position],
                          ["Verein", oefbPreview.currentClub.name],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                              {label}
                            </p>
                            <p className="mt-1 truncate font-black text-neutral-950">
                              {value || "Nicht angegeben"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                aria-hidden={!isClub}
                className={`overflow-hidden transition-all duration-500 ease-out ${
                  !isClub
                    ? "pointer-events-none mb-0 max-h-0 -translate-y-2 opacity-0"
                    : "mb-6 max-h-[520px] translate-y-0 opacity-100"
                }`}
              >
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-900">
                    <span className="grid size-8 place-items-center rounded-full bg-green-100 text-base font-black text-green-800">
                      ✓
                    </span>
                    ÖFB-Vereinsseite verbinden und Vereinsdaten automatisch
                    übernehmen.
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1">
                      <span className="mb-2 block text-sm font-black text-green-900">
                        ÖFB-Vereinsprofil live importieren
                      </span>
                      <input
                        type="url"
                        value={clubOefbUrl}
                        onChange={(event) => setClubOefbUrl(event.target.value)}
                        className="h-12 w-full rounded-xl border border-green-200 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                        placeholder="https://vereine.oefb.at/RbOJessas/News/"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleClubOefbImport}
                      disabled={clubOefbLoading}
                      className="h-12 rounded-xl bg-neutral-950 px-4 text-sm font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      {clubOefbLoading ? "Prüft..." : "Daten laden"}
                    </button>
                  </div>

                  {clubOefbPreview && registrationStep === "account" && (
                    <div className="mt-4 rounded-xl bg-white p-4 text-sm">
                      {clubOefbPreview.logoUrl && (
                        <div className="mb-4 flex items-center gap-4 rounded-xl border border-green-100 bg-green-50 p-3">
                          <img
                            src={clubOefbPreview.logoUrl}
                            alt="Vereinslogo"
                            className="h-14 w-14 rounded-xl border border-neutral-200 bg-white object-contain p-1"
                          />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-green-700">
                              Vereinslogo
                            </p>
                            <p className="mt-0.5 font-black text-green-900">
                              Automatisch gefunden ✓
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["Club", clubOefbPreview.clubName],
                          ["Sportplatz", clubOefbPreview.sportsGroundName],
                          ["Adresse", clubOefbPreview.sportsGroundAddress],
                          [
                            "Ort",
                            [
                              clubOefbPreview.sportsGroundZipCode,
                              clubOefbPreview.sportsGroundCity,
                            ]
                              .filter(Boolean)
                              .join(" "),
                          ],
                          [
                            "Tabelle",
                            clubOefbPreview.leagueTable
                              ? `${clubOefbPreview.leagueTable.totalRows} Teams gefunden`
                              : "Nicht gefunden",
                          ],
                          [
                            "Liga",
                            clubOefbPreview.competitionSelection?.league ||
                              clubOefbPreview.leagueTable?.leagueName,
                          ],
                          ["E-Mail", clubOefbPreview.obmannEmail],
                          ["Telefonnummer", clubOefbPreview.obmannPhone],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                              {label}
                            </p>
                            <p className="mt-1 truncate font-black text-neutral-950">
                              {value || "Nicht angegeben"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isClub &&
                registrationStep === "edit-oefb" &&
                editableOefbData && (
                  <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-green-700">
                          Import bearbeiten
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-neutral-950">
                          Übernommene ÖFB-Daten anpassen
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRegistrationStep("account")}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-700 transition hover:bg-neutral-50"
                      >
                        Zurück
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {[
                        { field: "firstName", label: "Vorname", required: true },
                        { field: "lastName", label: "Nachname", required: true },
                        { field: "birthDate", label: "Geburtsdatum", required: true },
                        { field: "currentClub", label: "Aktueller Verein", required: false },
                        { field: "heightCm", label: "Größe in cm", required: false },
                      ].map(({ field, label, required }) => (
                        <label key={field} className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                            {label} {required && <RequiredMark />}
                          </span>
                          {field === "birthDate" ? (
                            <div className="grid grid-cols-[0.7fr_1.1fr_0.9fr] gap-2">
                              <select
                                aria-label="Geburtstag"
                                value={birthDateParts.day}
                                onChange={(event) =>
                                  updateBirthDatePart("day", event.target.value)
                                }
                                className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-black text-neutral-950 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                              >
                                <option value="">TT</option>
                                {birthDayOptions.map((day) => (
                                  <option key={day} value={day}>
                                    {day}
                                  </option>
                                ))}
                              </select>
                              <select
                                aria-label="Geburtsmonat"
                                value={birthDateParts.month}
                                onChange={(event) =>
                                  updateBirthDatePart(
                                    "month",
                                    event.target.value,
                                  )
                                }
                                className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-black text-neutral-950 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                              >
                                <option value="">Monat</option>
                                {birthMonthOptions.map(
                                  ([value, monthLabel]) => (
                                    <option key={value} value={value}>
                                      {monthLabel}
                                    </option>
                                  ),
                                )}
                              </select>
                              <select
                                aria-label="Geburtsjahr"
                                value={birthDateParts.year}
                                onChange={(event) =>
                                  updateBirthDatePart(
                                    "year",
                                    event.target.value,
                                  )
                                }
                                className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-black text-neutral-950 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                              >
                                <option value="">JJJJ</option>
                                {birthYearOptions.map((year) => (
                                  <option key={year} value={year}>
                                    {year}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={String(
                                editableOefbData[
                                  field as keyof EditableOefbData
                                ] ?? "",
                              )}
                              onChange={(event) =>
                                updateEditableOefbData(
                                  field as keyof EditableOefbData,
                                  event.target.value,
                                )
                              }
                              className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                            />
                          )}
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="mb-3 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Positionen <RequiredMark />
                      </p>
                      <div className="grid gap-3">
                        {positionGroups.map((group) => (
                          <div
                            key={group.label}
                            className="grid gap-2 sm:grid-cols-[70px_1fr] sm:items-center"
                          >
                            <p className="text-xs font-black tracking-[0.16em] text-neutral-500">
                              {group.label}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {group.positions.map((position) => {
                                const selected =
                                  selectedPositions.includes(position);
                                const disabled =
                                  !selected && selectedPositions.length >= 3;

                                return (
                                  <button
                                    key={position}
                                    type="button"
                                    onClick={() => togglePosition(position)}
                                    disabled={disabled}
                                    className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                                      selected
                                        ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-500/20"
                                        : disabled
                                          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                                          : "border-neutral-200 bg-white text-neutral-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                                    }`}
                                  >
                                    {position}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs font-semibold text-neutral-500">
                        Maximal 3 auswählbar · Ausgewählt:{" "}
                        {selectedPositions.length > 0
                          ? selectedPositions.join(", ")
                          : "Keine"}
                      </p>
                    </div>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Sucht Verein in <RequiredMark />
                      </span>
                      <select
                        value={editableOefbData.searchRegion ?? ""}
                        onChange={(event) =>
                          updateEditableOefbData(
                            "searchRegion",
                            event.target.value,
                          )
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                      >
                        <option value="">Region auswählen</option>
                        {austrianRegionOptions.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                      <p className="mb-3 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Bevorzugter Fuß <RequiredMark />
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(["Links", "Rechts"] as const).map((foot) => {
                          const isStrongFoot =
                            editableOefbData.preferredFoot === foot;
                          const strength = isStrongFoot
                            ? 5
                            : Number(editableOefbData.weakFootRating);
                          const strengthLabel = isStrongFoot
                            ? "Starker Fuß"
                            : "Schwacher Fuß";
                          const footLabel = foot === "Links" ? "L" : "R";

                          return (
                            <button
                              key={foot}
                              type="button"
                              onClick={() => selectPreferredFoot(foot)}
                              className={`rounded-2xl border p-4 text-left transition ${
                                isStrongFoot
                                  ? "border-green-500 bg-green-50 shadow-md shadow-green-500/15"
                                  : "border-neutral-200 bg-white hover:border-green-300 hover:bg-green-50/50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-lg font-black text-neutral-950">
                                    {footLabel}
                                  </p>
                                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                                    {strengthLabel}
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
                              <div className="mt-5 grid grid-cols-5 gap-1.5">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <span
                                    key={index}
                                    className={`h-2 rounded-full ${
                                      index < strength
                                        ? "bg-green-500"
                                        : "bg-neutral-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="mt-4 flex items-end justify-between">
                                <p className="text-3xl font-black text-neutral-950">
                                  {strength}/5
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <label className="mt-4 block">
                        <span className="mb-2 block text-xs font-bold text-neutral-500">
                          Schwacher Fuß: {editableOefbData.weakFootRating}/5
                        </span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={editableOefbData.weakFootRating ?? "3"}
                          onChange={(event) =>
                            updateEditableOefbData(
                              "weakFootRating",
                              event.target.value,
                            )
                          }
                          className="w-full accent-green-500"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Über mich
                      </span>
                      <textarea
                        value={editableOefbData.about ?? ""}
                        onChange={(event) =>
                          updateEditableOefbData("about", event.target.value)
                        }
                        rows={3}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                        placeholder="Kurzer Profiltext für Clubs..."
                      />
                    </label>

                    <div className="mt-4">
                      <p className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Hauptfähigkeiten <RequiredMark />
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {visiblePlayerSkillOptions.map((skill) => {
                          const selected = selectedSkills.includes(skill);
                          const highlighted = selectedHighlightedSkills.includes(skill);

                          return (
                            <div key={skill} className="flex overflow-hidden rounded-full border border-neutral-200 bg-neutral-50">
                              <button
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-4 py-2 text-sm font-black transition ${
                                  selected
                                    ? "bg-green-500 text-white"
                                    : "text-neutral-700 hover:bg-green-50 hover:text-green-700"
                                }`}
                              >
                                {skill}
                              </button>
                              {selected && (
                                <button
                                  type="button"
                                  onClick={() => toggleHighlightedSkill(skill)}
                                  className={`border-l px-3 py-2 text-sm font-black transition ${
                                    highlighted
                                      ? "border-green-400 bg-neutral-950 text-white"
                                      : "border-green-400 bg-green-100 text-green-800 hover:bg-green-200"
                                  }`}
                                  title="Als besondere Stärke hervorheben"
                                >
                                  ★
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs font-semibold text-neutral-500">
                        Ohne Limit auswählbar. Stern markiert besondere Stärken. Ausgewählt:{" "}
                        {selectedSkills.length > 0
                          ? selectedSkills.join(", ")
                          : "Keine"}
                      </p>
                    </div>
                  </div>
                )}

              {!isClub && isSelfRating && editableOefbData && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-green-700">
                        Spielerattribute
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-neutral-950">
                        Wie schätzt du deine Fähigkeiten ein?
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep("edit-oefb")}
                      className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Zurück
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {[
                      ["tempo", "Tempo (Schnelligkeit)"],
                      ["shooting", "Schießen (Torquote)"],
                      ["passing", "Passen (Präzision)"],
                      ["dribbling", "Dribbling (Ballkontrolle)"],
                      ["defending", "Verteidigung (Zweikampf)"],
                      ["physical", "Physis (Ausdauer/Kraft)"],
                    ].map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                          {label}
                        </span>
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <div className="mb-2 flex items-end justify-between">
                            <span className="text-sm font-bold text-neutral-700">
                              Bewertung
                            </span>
                            <span className="text-xl font-black text-green-600">
                              {
                                selfRatingAttributes[
                                  key as keyof SelfRatingAttributes
                                ]
                              }
                              /99
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="99"
                            value={
                              selfRatingAttributes[
                                key as keyof SelfRatingAttributes
                              ]
                            }
                            onChange={(event) =>
                              setSelfRatingAttributes((current) => ({
                                ...current,
                                [key]: Number(event.target.value),
                              }))
                            }
                            className="w-full accent-green-500"
                          />
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all"
                              style={{
                                width: `${selfRatingAttributes[key as keyof SelfRatingAttributes]}%`,
                              }}
                            />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-green-700">
                      Gesamtwertung
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-700">
                        Durchschnitt aus allen 6 Attributen
                      </p>
                      <p className="text-3xl font-black text-green-700">
                        {overallSelfRating}/99
                      </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-green-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${overallSelfRating}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-4">
                    {[
                      ["Spiele", editableOefbData.games],
                      ["Tore", editableOefbData.goals],
                      ["Gelbe Karten", editableOefbData.yellowCards],
                      ["Rote Karten", editableOefbData.redCards],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-neutral-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                          {label}
                        </p>
                        <p className="mt-2 text-3xl font-black text-green-600">
                          {value || "0"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900">
                    Diese Werte kommen direkt aus dem ÖFB-Profil und werden beim
                    Speichern in der Vereinsstation übernommen.
                  </p>

                  <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Bisherige Vereinsstationen
                      </p>
                      <button
                        type="button"
                        onClick={addClubHistoryEntry}
                        className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white transition hover:bg-neutral-800"
                      >
                        Club hinzufügen
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {editableOefbData.clubHistory.length === 0 && (
                        <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-500">
                          Noch keine Vereinsstationen hinterlegt.
                        </p>
                      )}

                      {editableOefbData.clubHistory.map((entry, index) => (
                        <div
                          key={index}
                          className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:grid-cols-4"
                        >
                          <label>
                            <span className="mb-1 block text-xs font-bold text-neutral-500">
                              Club
                            </span>
                            <input
                              type="text"
                              value={entry.club}
                              onChange={(event) =>
                                updateClubHistoryEntry(
                                  index,
                                  "club",
                                  event.target.value,
                                )
                              }
                              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                              placeholder="Vereinsname"
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-xs font-bold text-neutral-500">
                              Mannschaft
                            </span>
                            <select
                              value={entry.teamCategory || ""}
                              onChange={(event) =>
                                updateClubHistoryEntry(
                                  index,
                                  "teamCategory",
                                  normalizeTeamCategory(event.target.value),
                                )
                              }
                              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                            >
                              <option value="">Nicht angegeben</option>
                              {TEAM_CATEGORY_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span className="mb-1 block text-xs font-bold text-neutral-500">
                              Von
                            </span>
                            <input
                              type="date"
                              value={entry.from}
                              onChange={(event) =>
                                updateClubHistoryEntry(
                                  index,
                                  "from",
                                  event.target.value,
                                )
                              }
                              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-xs font-bold text-neutral-500">
                              Bis
                            </span>
                            <input
                              type="date"
                              value={entry.to}
                              onChange={(event) =>
                                updateClubHistoryEntry(
                                  index,
                                  "to",
                                  event.target.value,
                                )
                              }
                              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                            />
                          </label>
                          {[
                            ["games", "Spiele"],
                            ["goals", "Tore"],
                            ["yellowCards", "Gelbe Karten"],
                            ["redCards", "Rote Karten"],
                          ].map(([field, label]) => (
                            <label key={field}>
                              <span className="mb-1 block text-xs font-bold text-neutral-500">
                                {label}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={entry[field as keyof ClubHistoryEntry]}
                                onChange={(event) =>
                                  updateClubHistoryEntry(
                                    index,
                                    field as keyof ClubHistoryEntry,
                                    event.target.value,
                                  )
                                }
                                className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                              />
                            </label>
                          ))}
                          <button
                            type="button"
                            onClick={() => removeClubHistoryEntry(index)}
                            className="h-11 self-end rounded-xl border border-neutral-200 px-3 text-xs font-black text-neutral-600 transition hover:bg-neutral-100 sm:col-span-4"
                          >
                            Entfernen
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!isClub && isProfilePicture && editableOefbData && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-green-700">
                        Profilbild
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-neutral-950">
                        Dein Profilbild hochladen
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep("self-rating")}
                      className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Zurück
                    </button>
                  </div>

                  {profileImagePreview && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-neutral-200">
                      <img
                        src={profileImagePreview}
                        alt="Profil-Vorschau"
                        className="w-full max-h-64 object-cover"
                      />
                    </div>
                  )}

                  {editableOefbData.profileImageUrl && !profileImageFile && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-green-200 bg-green-50">
                      <img
                        src={editableOefbData.profileImageUrl}
                        alt="ÖFB-Profilbild"
                        className="w-full max-h-64 object-cover"
                      />
                      <p className="px-4 py-2 text-sm font-semibold text-green-700">
                        ✓ Bild vom ÖFB-Profil importiert
                      </p>
                    </div>
                  )}

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black text-neutral-800">
                      Anderes Bild hochladen
                    </span>
                    <div className="relative rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center transition hover:border-green-400 hover:bg-green-50/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProfileImageFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setProfileImagePreview(
                                event.target?.result as string,
                              );
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="pointer-events-none">
                        <p className="text-4xl mb-2">📸</p>
                        <p className="text-sm font-semibold text-neutral-700">
                          Klicke zum Hochladen oder ziehe ein Bild hierher
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          PNG, JPG, GIF bis 5MB
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {isClubProfileStep && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-green-700">
                        Clubprofil
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-neutral-950">
                        Vereinsdaten und Suchprofil
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep("account")}
                      className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Zurück
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Clubname <RequiredMark />
                      </span>
                      <input
                        type="text"
                        value={clubProfileData.clubName}
                        onChange={(event) =>
                          setClubProfileData((current) => ({
                            ...current,
                            clubName: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                        placeholder="FC Beispielstadt"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Verband <RequiredMark />
                      </span>
                      <select
                        value={clubProfileData.verband}
                        onChange={(event) =>
                          setClubProfileData((current) => ({
                            ...current,
                            verband: event.target.value,
                            wettbewerb: "",
                            league: "",
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                      >
                        <option value="">Verband auswählen</option>
                        {clubCompetitionOptions.map((option) => (
                          <option key={option.verband} value={option.verband}>
                            {option.verband}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Wettbewerb <RequiredMark />
                      </span>
                      <select
                        value={clubProfileData.wettbewerb}
                        onChange={(event) =>
                          setClubProfileData((current) => ({
                            ...current,
                            wettbewerb: event.target.value,
                            league: "",
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                      >
                        <option value="">Wettbewerb auswählen</option>
                        {wettbewerbOptions.map((option) => (
                          <option key={option.name} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Liga <RequiredMark />
                      </span>
                      <select
                        value={clubProfileData.league}
                        onChange={(event) =>
                          setClubProfileData((current) => ({
                            ...current,
                            league: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                      >
                        <option value="">Liga auswählen</option>
                        {leagueOptions.map((league) => (
                          <option key={league} value={league}>
                            {league}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        ÖFB-Vereinsprofil (optional)
                      </span>
                      <input
                        type="url"
                        value={clubProfileData.oefbClubProfileUrl}
                        onChange={(event) =>
                          setClubProfileData((current) => ({
                            ...current,
                            oefbClubProfileUrl: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                        placeholder="https://vereine.oefb.at/RbOJessas/News/"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Telefonnummer
                      </span>
                      <input
                        type="tel"
                        value={clubProfileData.phone}
                        onChange={(event) =>
                          setClubProfileData((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                        placeholder="z.B. +43 660 1234567"
                      />
                    </label>

                    <div className="sm:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                        Sportplatzdaten
                      </p>
                      <p className="mt-2 text-sm font-semibold text-neutral-600">
                        Bei ÖFB-Link werden Sportplatz, Adresse, PLZ und Stadt
                        automatisch übernommen. Ohne Link bitte manuell
                        ausfüllen.
                      </p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                            Sportplatz {!clubProfileData.oefbClubProfileUrl.trim() && <RequiredMark />}
                          </span>
                          <input
                            type="text"
                            value={clubProfileData.sportsGroundName}
                            onChange={(event) =>
                              setClubProfileData((current) => ({
                                ...current,
                                sportsGroundName: event.target.value,
                              }))
                            }
                            className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                            placeholder="z. B. NAC"
                          />
                        </label>

                        <label className="block sm:col-span-2">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                            Adresse {!clubProfileData.oefbClubProfileUrl.trim() && <RequiredMark />}
                          </span>
                          <input
                            type="text"
                            value={clubProfileData.sportsGroundAddress}
                            onChange={(event) =>
                              setClubProfileData((current) => ({
                                ...current,
                                sportsGroundAddress: event.target.value,
                              }))
                            }
                            className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                            placeholder="z. B. Grinzinger Straße 111"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                            PLZ {!clubProfileData.oefbClubProfileUrl.trim() && <RequiredMark />}
                          </span>
                          <input
                            type="text"
                            value={clubProfileData.sportsGroundZipCode}
                            onChange={(event) =>
                              setClubProfileData((current) => ({
                                ...current,
                                sportsGroundZipCode: event.target.value,
                              }))
                            }
                            className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                            placeholder="1190"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                            Stadt {!clubProfileData.oefbClubProfileUrl.trim() && <RequiredMark />}
                          </span>
                          <input
                            type="text"
                            value={clubProfileData.sportsGroundCity}
                            onChange={(event) =>
                              setClubProfileData((current) => ({
                                ...current,
                                sportsGroundCity: event.target.value,
                              }))
                            }
                            className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                            placeholder="Wien"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="mb-3 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                      Gesuchte Positionen <RequiredMark />
                    </p>
                    <div className="grid gap-3">
                      {positionGroups.map((group) => (
                        <div
                          key={`club-position-${group.label}`}
                          className="grid gap-2 sm:grid-cols-[70px_1fr] sm:items-center"
                        >
                          <p className="text-xs font-black tracking-[0.16em] text-neutral-500">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.positions.map((position) => {
                              const selected =
                                clubRequirementData.positions.includes(
                                  position,
                                );
                              const disabled =
                                !selected &&
                                clubRequirementData.positions.length >= 3;

                              return (
                                <button
                                  key={`club-pos-${position}`}
                                  type="button"
                                  onClick={() => toggleClubPosition(position)}
                                  disabled={disabled}
                                  className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                                    selected
                                      ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-500/20"
                                      : disabled
                                        ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                                        : "border-neutral-200 bg-white text-neutral-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                                  }`}
                                >
                                  {position}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs font-semibold text-neutral-500">
                      Maximal 3 auswählbar · Ausgewählt:{" "}
                      {clubRequirementData.positions.length > 0
                        ? clubRequirementData.positions.join(", ")
                        : "Keine"}
                    </p>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                      Beschreibung (optional)
                    </span>
                    <textarea
                      value={clubProfileData.description}
                      onChange={(event) =>
                        setClubProfileData((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                      placeholder="Kurzbeschreibung eures Vereins und eurer sportlichen Ziele..."
                    />
                  </label>
                </div>
              )}

              {isClubRequirementsStep && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-green-700">
                        Positionsanforderungen
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-neutral-950">
                        Anforderungen pro Position
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep("club-profile")}
                      className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Zurück
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2">
                    {clubRequirementData.positions.map((position) => {
                      const isActive = activeClubRequirementPosition === position;
                      const requirement =
                        clubRequirementData.byPosition[position] ??
                        createDefaultClubPositionRequirement();
                      const hasSkills = requirement.requiredSkills.length > 0;

                      return (
                        <button
                          key={`requirement-tab-${position}`}
                          type="button"
                          onClick={() => setActiveClubRequirementPosition(position)}
                          className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
                            isActive
                              ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-500/20"
                              : hasSkills
                                ? "border-green-200 bg-white text-green-700 hover:bg-green-50"
                                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
                          }`}
                        >
                          {position}
                        </button>
                      );
                    })}
                  </div>

                  {activeClubRequirementPosition ? (
                    <>
                      <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                              Aktive Position
                            </p>
                            <p className="mt-1 text-3xl font-black text-neutral-950">
                              {activeClubRequirementPosition}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-neutral-500">
                            Werte gelten nur für diese Position.
                          </p>
                        </div>
                      </div>

                      {!isActiveClubGoalkeeperRequirement && (
                        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="mb-3 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                            Attribute-Priorität
                          </p>
                          <div className="grid gap-3">
                            {clubAttributeLabels.map(({ key, label }) => {
                              const currentPriority =
                                activeClubRequirement.attributePriority[key];

                              return (
                                <div
                                  key={`priority-${activeClubRequirementPosition}-${key}`}
                                  className="rounded-xl border border-neutral-200 bg-white p-3"
                                >
                                  <p className="text-sm font-black text-neutral-900">
                                    {label}
                                  </p>
                                  <div className="mt-2 grid grid-cols-3 gap-2">
                                    {(
                                      [
                                        [1, "Niedrig"],
                                        [2, "Mittel"],
                                        [3, "Hoch"],
                                      ] as const
                                    ).map(([priority, priorityLabel]) => (
                                      <button
                                        key={`${key}-${priority}`}
                                        type="button"
                                        onClick={() =>
                                          updateClubAttributePriority(
                                            key,
                                            priority,
                                          )
                                        }
                                        className={`rounded-lg border px-2 py-2 text-xs font-black transition ${
                                          currentPriority === priority
                                            ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-500/20"
                                            : "border-neutral-200 bg-white text-neutral-700 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                                        }`}
                                      >
                                        {priorityLabel}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="mb-3 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                          Gesuchte Hauptfähigkeiten <RequiredMark />
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {visibleClubSkillOptions.map((skill) => {
                            const selected =
                              activeClubRequirement.requiredSkills.includes(skill);
                            const highlighted =
                              activeClubRequirement.highlightedSkills.includes(
                                skill,
                              );

                            return (
                              <div
                                key={`club-skill-${activeClubRequirementPosition}-${skill}`}
                                className="flex overflow-hidden rounded-full border border-neutral-200 bg-white"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleClubRequirementSkill(
                                      "requiredSkills",
                                      skill,
                                    )
                                  }
                                  className={`px-4 py-2 text-sm font-black transition ${
                                    selected
                                      ? "bg-green-500 text-white"
                                      : "text-neutral-700 hover:bg-green-50 hover:text-green-700"
                                  }`}
                                >
                                  {skill}
                                </button>
                                {selected && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleClubRequirementSkill(
                                        "highlightedSkills",
                                        skill,
                                      )
                                    }
                                    className={`border-l px-3 py-2 text-sm font-black transition ${
                                      highlighted
                                        ? "border-green-400 bg-neutral-950 text-white"
                                        : "border-green-400 bg-green-100 text-green-800 hover:bg-green-200"
                                    }`}
                                    title="Besonders wichtig markieren"
                                  >
                                    ★
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-3 text-xs font-semibold text-neutral-500">
                          {isActiveClubGoalkeeperRequirement
                            ? "Für GK zählt das Matching nur über diese Tormann-Fähigkeiten. Der Stern markiert Wunschstärken."
                            : "Der Stern markiert Wunschstärken. GK-Skills sind nur bei GK sichtbar."}
                        </p>
                      </div>

                      {!isActiveClubGoalkeeperRequirement && (
                        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="mb-3 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                            Mindestattribute
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {clubAttributeLabels.map(({ key, label }) => (
                              <label
                                key={`min-${activeClubRequirementPosition}-${key}`}
                                className="block"
                              >
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                                  {label}
                                </span>
                                <div className="rounded-xl bg-white p-3">
                                  <div className="mb-2 flex items-end justify-between">
                                    <span className="text-sm font-bold text-neutral-700">
                                      Minimum
                                    </span>
                                    <span className="text-xl font-black text-green-600">
                                      {activeClubRequirement.minValues[key]}/99
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="99"
                                    value={activeClubRequirement.minValues[key]}
                                    onChange={(event) =>
                                      updateClubMinAttribute(
                                        key,
                                        Number(event.target.value),
                                      )
                                    }
                                    className="w-full accent-green-500"
                                  />
                                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
                                    <div
                                      className="h-full rounded-full bg-green-500 transition-all"
                                      style={{
                                        width: `${activeClubRequirement.minValues[key]}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-500">
                      Bitte zuerst im vorherigen Schritt Positionen auswählen.
                    </p>
                  )}
                </div>
              )}

              {isClubLogoStep && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-green-700">
                        Vereinslogo
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-neutral-950">
                        Logo hochladen
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep("club-profile")}
                      className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Zurück
                    </button>
                  </div>

                  {clubLogoPreview && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
                      {!clubLogoFile && clubOefbPreview?.logoUrl && (
                        <p className="bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
                          Automatisch vom ÖFB-Profil übernommen ✓ – du kannst auch ein eigenes hochladen.
                        </p>
                      )}
                      <img
                        src={mediaUrl(clubLogoPreview) || clubLogoPreview}
                        alt="Logo-Vorschau"
                        className="h-56 w-full object-contain bg-white"
                      />
                    </div>
                  )}

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black text-neutral-800">
                      Vereinslogo auswählen <RequiredMark />
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        setClubLogoFile(file);
                        const reader = new FileReader();
                        reader.onload = (readerEvent) => {
                          setClubLogoPreview(
                            readerEvent.target?.result as string,
                          );
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="block w-full cursor-pointer rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 file:mr-4 file:rounded-lg file:border-0 file:bg-green-500 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-green-600"
                    />
                  </label>
                </div>
              )}

              <div className="grid gap-5">
                {!isClub && !oefbPreview && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-neutral-800">
                        Vollständiger Name <RequiredMark />
                      </span>
                    <input
                      type="text"
                      name="playerName"
                      value={activeName}
                      onChange={handleChange}
                      required
                      className="h-14 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-base font-medium outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                      placeholder="Max Mustermann"
                    />
                  </label>
                )}

                {oefbPreview && !isClub && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-green-700 mb-2">
                      Importierter Name
                    </p>
                    <p className="text-lg font-black text-neutral-950">
                      {editableOefbData?.firstName} {editableOefbData?.lastName}
                    </p>
                  </div>
                )}

                {((isClub && registrationStep === "account") ||
                  (!isClub &&
                    (registrationStep === "account" ||
                      registrationStep === "edit-oefb"))) && (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-neutral-800">
                        E-Mail-Adresse <RequiredMark />
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="h-14 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-base font-medium outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                        placeholder="name@email.com"
                      />
                    </label>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-neutral-800">
                          Passwort <RequiredMark />
                        </span>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={8}
                          className="h-14 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-base font-medium outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                          placeholder="Mind. 8 Zeichen"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-neutral-800">
                          Bestätigen <RequiredMark />
                        </span>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          minLength={8}
                          className="h-14 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-base font-medium outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                          placeholder="Erneut eingeben"
                        />
                      </label>
                    </div>
                  </>
                )}

                {!isClub &&
                  (registrationStep === "self-rating" ||
                    registrationStep === "profile-picture") && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-green-700">
                        Accountdaten gespeichert
                      </p>
                      <p className="text-sm font-semibold text-neutral-700">
                        {formData.email}
                      </p>
                    </div>
                  )}
              </div>

              {((isClub && registrationStep === "account") ||
                (!isClub &&
                  (registrationStep === "account" ||
                    registrationStep === "edit-oefb"))) && (
                <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                    Passwort-Anforderungen
                  </p>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-black ${
                          passwordReady
                            ? "bg-green-500 text-white"
                            : "bg-neutral-200 text-neutral-400"
                        }`}
                      >
                        {passwordReady ? "✓" : "○"}
                      </span>
                      <span
                        className={
                          passwordReady
                            ? "font-semibold text-green-700"
                            : "text-neutral-600"
                        }
                      >
                        Mindestens 8 Zeichen
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-black ${
                          passwordsMatch
                            ? "bg-green-500 text-white"
                            : "bg-neutral-200 text-neutral-400"
                        }`}
                      >
                        {passwordsMatch ? "✓" : "○"}
                      </span>
                      <span
                        className={
                          passwordsMatch
                            ? "font-semibold text-green-700"
                            : "text-neutral-600"
                        }
                      >
                        Passwörter stimmen überein
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-7 h-14 w-full rounded-2xl bg-green-500 text-base font-black text-white shadow-lg shadow-green-500/25 transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
              >
                {loading
                  ? "Wird verarbeitet..."
                  : isClub
                    ? registrationStep === "account"
                      ? "Weiter zu Club-Profil"
                      : registrationStep === "club-profile"
                        ? "Weiter zu Anforderungen"
                        : registrationStep === "club-requirements"
                        ? "Weiter zu Logo-Upload"
                        : "Club-Account erstellen"
                    : registrationStep === "account"
                      ? "Weiter zu Profilbearbeitung"
                      : registrationStep === "edit-oefb"
                        ? "Weiter zu Spielerattributen"
                        : registrationStep === "self-rating"
                          ? "Weiter zum Profilbild"
                          : "Account fertigstellen"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-medium text-neutral-600">
              Bereits registriert?{" "}
              <Link
                href="/login"
                className="font-black text-green-700 hover:text-green-800"
              >
                Hier anmelden
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
