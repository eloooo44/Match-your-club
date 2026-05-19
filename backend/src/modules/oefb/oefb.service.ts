import { OefbPlayerProfile } from "./oefb.types";

const OEFB_HOSTS = new Set(["www.oefb.at", "oefb.at"]);

const decodeHtml = (value?: string) => {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
};

const dateFromTimestamp = (value: unknown) => {
  if (typeof value !== "number" || value <= 0) {
    return undefined;
  }

  return new Date(value).toISOString().slice(0, 10);
};

const numberOrUndefined = (value: unknown) => {
  if (typeof value !== "number" || value <= 0) {
    return undefined;
  }

  return value;
};

const stringOrUndefined = (value: unknown) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
};

const getMetaContent = (html: string, selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `<meta\\s+(?:name|property|itemprop)=["']${escapedSelector}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );

  return decodeHtml(html.match(regex)?.[1]);
};

const normalizeOefbUrl = (input: string) => {
  const url = new URL(input);

  if (!OEFB_HOSTS.has(url.hostname) || !url.pathname.startsWith("/Profile/Spieler/")) {
    throw new Error("Bitte eine gültige ÖFB-Spielerprofil-URL verwenden.");
  }

  url.protocol = "https:";
  url.hostname = "www.oefb.at";

  return url.toString();
};

const extractPlayerId = (url: string) => {
  return new URL(url).pathname.match(/\/Profile\/Spieler\/(\d+)/)?.[1];
};

const extractPreloadArrays = (html: string) => {
  const matches = html.matchAll(/SG\.container\.appPreloads\['[^']+'\]=(\[.*?\]);/gs);
  const preloads: unknown[] = [];

  for (const match of matches) {
    try {
      preloads.push(JSON.parse(match[1] ?? "[]"));
    } catch {
      continue;
    }
  }

  return preloads.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const findPlayerPayload = (items: unknown[]) => {
  return items.find((item) => {
    if (!isRecord(item)) {
      return false;
    }

    return Boolean(item.vorname && item.nachname && item.statistiken);
  }) as Record<string, unknown> | undefined;
};

const mapMatch = (match: unknown) => {
  if (!isRecord(match)) {
    return undefined;
  }

  return {
    label: stringOrUndefined(match.bezeichnung),
    teams: stringOrUndefined(match.mannschaften),
    date: dateFromTimestamp(match.datum),
    result: stringOrUndefined(match.ergebnis),
    shortResult: stringOrUndefined(match.ergebnisKurz),
    url: stringOrUndefined(match.url),
  };
};

const toDisplayLabel = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .replace("Vorname", "Vorname")
    .replace("Nachname", "Nachname")
    .replace("Geburtsdatum", "Geburtsdatum")
    .replace("Groesse", "Größe");
};

const toDisplayValue = (key: string, value: unknown) => {
  if (typeof value === "number" && key.toLowerCase().includes("datum")) {
    return dateFromTimestamp(value);
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return undefined;
};

const buildDisplayFields = (player: Record<string, unknown>) => {
  const excludedKeys = new Set([
    "geburtsdatum",
    "rueckennummer",
    "nationalitaet",
    "einsatzminuten",
    "einsatzminutenBewerb",
    "einsatzminutenFreundschaft",
    "minutenProSpiel",
    "minutenProSpielBewerb",
    "minutenProSpielFreundschaft",
  ]);

  return Object.entries(player)
    .filter(([key]) => !excludedKeys.has(key))
    .map(([key, value]) => ({
      label: toDisplayLabel(key),
      value: toDisplayValue(key, value),
    }))
    .filter((entry): entry is { label: string; value: string | number | boolean } => {
      return entry.value !== undefined && entry.value !== "" && entry.value !== 0;
    });
};

export const fetchOefbPlayerProfile = async (inputUrl: string): Promise<OefbPlayerProfile> => {
  const url = normalizeOefbUrl(inputUrl);
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "user-agent": "MatchYourClub/1.0 (+https://localhost)",
    },
  });

  if (!response.ok) {
    throw new Error(`ÖFB-Profil konnte nicht geladen werden (${response.status}).`);
  }

  const html = await response.text();
  const preloads = extractPreloadArrays(html);
  const player = findPlayerPayload(preloads);

  if (!player) {
    throw new Error("Auf der ÖFB-Seite wurden keine Spieler-Livedaten gefunden.");
  }

  const firstName = stringOrUndefined(player.vorname);
  const lastName = stringOrUndefined(player.nachname);
  const title = stringOrUndefined(player.titel);
  const suffixTitle = stringOrUndefined(player.titelNachgestellt);
  const fullName = [title, firstName, lastName, suffixTitle].filter(Boolean).join(" ");
  const metaImage = getMetaContent(html, "og:image") ?? getMetaContent(html, "twitter:image");
  const clubHistory = Array.isArray(player.vereine) ? player.vereine : [];
  const statistics = Array.isArray(player.statistiken) ? player.statistiken : [];
  const competitions = Array.isArray(player.bewerbe) ? player.bewerbe : [];

  return {
    source: {
      url,
      fetchedAt: new Date().toISOString(),
      playerId: extractPlayerId(url),
    },
    identity: {
      firstName,
      lastName,
      fullName,
      position: stringOrUndefined(player.position),
      birthDate: undefined,
      heightCm: numberOrUndefined(player.groesse),
      weightKg: numberOrUndefined(player.gewicht),
      profileImageUrl: metaImage,
    },
    currentClub: {
      name: stringOrUndefined(player.verein),
      id: stringOrUndefined(player.vereinId),
      logo: stringOrUndefined(player.vereinLogo),
      url: stringOrUndefined(player.vereinUrl),
      association: stringOrUndefined(player.verbandsKuerzel),
      since: dateFromTimestamp(player.beimVereinSeit),
    },
    flags: {
      youth: Boolean(player.nachwuchs),
      blueCards: Boolean(player.blueCards),
      hiddenDetails: Boolean(player.alleDetailsAusblenden),
    },
    history: clubHistory.filter(isRecord).map((entry) => ({
      club: stringOrUndefined(entry.verein) ?? "Unbekannter Verein",
      clubId: stringOrUndefined(entry.vereinId),
      position: stringOrUndefined(entry.position),
      from: dateFromTimestamp(entry.ab),
      to: dateFromTimestamp(entry.bis),
      games: numberOrUndefined(entry.spiele),
      goals: numberOrUndefined(entry.tore),
      yellowCards: numberOrUndefined(entry.gelbe),
      redCards: numberOrUndefined(
        (Number(entry.rote) || 0) + (Number(entry.gelbrote) || 0),
      ),
      logo: stringOrUndefined(entry.logo),
      url: stringOrUndefined(entry.url),
      countryCode: stringOrUndefined(entry.landCode),
    })),
    statistics: statistics.filter(isRecord).map((entry) => ({
      category: stringOrUndefined(entry.kategorie),
      label: stringOrUndefined(entry.bezeichnung),
      games: numberOrUndefined(entry.spiele),
      tournamentAppearances: numberOrUndefined(entry.turnierEinsaetze),
      wins: numberOrUndefined(entry.siege),
      draws: numberOrUndefined(entry.unentschieden),
      losses: numberOrUndefined(entry.niederlagen),
      goals: numberOrUndefined(entry.tore),
      goalsPerGame: stringOrUndefined(entry.toreProSpiel),
      minutes: undefined,
      minutesPerGame: undefined,
      substitutionsIn: numberOrUndefined(entry.einwechslungen),
      substitutionsOut: numberOrUndefined(entry.auswechslungen),
      yellowCards: numberOrUndefined(entry.gelbe),
      yellowRedCards: numberOrUndefined(entry.gelbrote),
      redCards:
        numberOrUndefined((Number(entry.rote) || 0) + (Number(entry.gelbrote) || 0)),
      competitionGames: numberOrUndefined(entry.spieleBewerb),
      competitionGoals: numberOrUndefined(entry.toreBewerb),
      competitionMinutes: undefined,
      friendlyGames: numberOrUndefined(entry.spieleFreundschaft),
      friendlyGoals: numberOrUndefined(entry.toreFreundschaft),
      friendlyMinutes: undefined,
    })),
    competitions: competitions.filter(isRecord).map((entry) => ({
      name: stringOrUndefined(entry.name) ?? "Unbekannter Bewerb",
      link: stringOrUndefined(entry.link),
    })),
    firstMatch: mapMatch(player.erstesSpiel),
    lastMatch: mapMatch(player.letztesSpiel),
    displayFields: buildDisplayFields(player),
    raw: player,
  };
};
