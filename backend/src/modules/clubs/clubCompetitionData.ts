export const CLUB_COMPETITION_DATA = {
  "Burgenländischer Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Regionalliga Ost"],
      Landesligen: [
        "Burgenlandliga",
        "2. Liga Nord",
        "2. Liga Mitte",
        "2. Liga Süd",
      ],
    },
  },
  "Wiener Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Regionalliga Ost"],
      Landesligen: [
        "Wiener Stadtliga",
        "2. Landesliga",
        "Oberliga A",
        "Oberliga B",
        "1. Klasse A",
        "1. Klasse B",
        "2. Klasse A",
        "2. Klasse B",
      ],
      "DSG Liga": [
        "DSG Liga",
        "DSG Oberliga A",
        "DSG Oberliga B",
        "DSG Unterliga A",
        "DSG Unterliga B",
        "DSG 1. Klasse A",
        "DSG 1. Klasse B",
        "DSG 2. Klasse A",
        "DSG 2. Klasse B",
      ],
    },
  },
  "Niederösterreichischer Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Regionalliga Ost"],
      Landesligen: [
        "1. NÖ Landesliga",
        "2. Landesliga Ost",
        "2. Landesliga West",
        "Gebietsliga Nord/Nordwest",
        "Gebietsliga Nordwest/Waldviertel",
        "Gebietsliga Weinviertel",
        "Gebietsliga West",
        "Gebietsliga Mostviertel",
        "Gebietsliga Süd/Südost",
      ],
    },
  },
  "Oberösterreichischer Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Regionalliga Mitte"],
      Landesligen: [
        "OÖ Liga",
        "Landesliga Ost",
        "Landesliga West",
        "Bezirksliga Nord",
        "Bezirksliga Ost",
        "Bezirksliga Süd",
        "Bezirksliga West",
      ],
    },
  },
  "Steirischer Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Regionalliga Mitte"],
      Landesligen: [
        "Landesliga Steiermark",
        "Oberliga Nord",
        "Oberliga Mitte West",
        "Oberliga Süd Ost",
      ],
    },
  },
  "Kärntner Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Regionalliga Mitte"],
      Landesligen: ["Kärntner Liga", "Unterliga Ost", "Unterliga West"],
    },
  },
  "Salzburger Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Regionalliga West"],
      Landesligen: [
        "Salzburger Liga",
        "1. Landesliga",
        "2. Landesliga Nord",
        "2. Landesliga Süd",
      ],
    },
  },
  "Tiroler Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Regionalliga Tirol"],
      Landesligen: ["Tirol Liga", "Landesliga Ost", "Landesliga West"],
    },
  },
  "Vorarlberger Fußballverband": {
    wettbewerbe: {
      Regionalliga: ["Eliteliga Vorarlberg"],
      Landesligen: [
        "Vorarlbergliga",
        "Landesliga",
        "1. Landesklasse",
        "2. Landesklasse",
      ],
    },
  },
} as const;

export type VerbandName = keyof typeof CLUB_COMPETITION_DATA;

export const getCompetitionOptionsByVerband = (verband: string) => {
  const verbandData =
    CLUB_COMPETITION_DATA[verband as keyof typeof CLUB_COMPETITION_DATA];

  if (!verbandData) {
    return [];
  }

  return Object.entries(verbandData.wettbewerbe).map(([name, ligen]) => ({
    name,
    ligen: [...ligen],
  }));
};

export const isValidClubCompetitionSelection = (
  verband: string,
  wettbewerb: string,
  league: string,
) => {
  const verbandData =
    CLUB_COMPETITION_DATA[verband as keyof typeof CLUB_COMPETITION_DATA];

  if (!verbandData) {
    return false;
  }

  const ligen =
    verbandData.wettbewerbe[wettbewerb as keyof typeof verbandData.wettbewerbe];

  if (!ligen) {
    return false;
  }

  return ligen.includes(league);
};

const normalizeCompetitionText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const findCompetitionSelectionByLeague = (leagueName: string) => {
  const normalizedLeagueName = normalizeCompetitionText(leagueName);

  if (!normalizedLeagueName) {
    return null;
  }

  const matches = Object.entries(CLUB_COMPETITION_DATA).flatMap(
    ([verband, verbandData]) =>
      Object.entries(verbandData.wettbewerbe).flatMap(([wettbewerb, ligen]) =>
        ligen
          .filter((league) =>
            normalizedLeagueName.includes(normalizeCompetitionText(league)),
          )
          .map((league) => ({
            verband,
            wettbewerb,
            league,
          })),
      ),
  );

  return (
    matches.sort((a, b) => b.league.length - a.league.length)[0] ?? null
  );
};
