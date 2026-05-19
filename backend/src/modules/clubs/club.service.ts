import prisma from "../../lib/prisma";
import type {
  CreateClubProfileBody,
  UpdateClubContactBody,
} from "./club.types";
import { searchPlayers } from "../players/player.service";
import {
  CLUB_COMPETITION_DATA,
  findCompetitionSelectionByLeague,
  getCompetitionOptionsByVerband,
  isValidClubCompetitionSelection,
} from "./clubCompetitionData";

type LeagueTableData = {
  headers: string[];
  rows: string[][];
  sourceUrl: string;
  tableUrl: string;
  crawledAt: string;
  leagueName?: string;
};

type ClubSportsGroundData = {
  sportsGroundName: string | undefined;
  sportsGroundAddress: string | undefined;
  sportsGroundZipCode: string | undefined;
  sportsGroundCity: string | undefined;
};

type ClubContactData = {
  obmannEmail: string | undefined;
  obmannPhone: string | undefined;
};

const absolutizeUrl = (value: string | undefined, baseUrl: string) => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
};

type OefbTableEntry = {
  rang?: number;
  mannschaftBezeichnung?: string;
  spiele?: number;
  siege?: number;
  unentschieden?: number;
  niederlagen?: number;
  toreErzielt?: number;
  toreErhalten?: number;
  tordifferenz?: number;
  punkte?: number;
};

type OefbTableBlock = {
  bewerbName?: string;
  bewerbKuerzel?: string;
  eintraege?: OefbTableEntry[];
};

type OefbTabellenPayload = Record<string, OefbTableBlock>;

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const extractCells = (rowHtml: string, tag: "td" | "th") => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const cells: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rowHtml)) !== null) {
    const text = stripHtml(match[1] ?? "");
    if (text) {
      cells.push(text);
    }
  }
  return cells;
};

const extractJsonObjectAt = (text: string, startIndex: number) => {
  if (startIndex < 0 || text[startIndex] !== "{") {
    return null;
  }

  let depth = 0;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return null;
};

const extractJsonArrayAt = (text: string, startIndex: number) => {
  if (startIndex < 0 || text[startIndex] !== "[") {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return null;
};

const extractClubDetailTextValues = (html: string, detailName: string) => {
  const detailMarker = `"${detailName}":{"bezeichnung":"${detailName}"`;
  const detailIndex = html.indexOf(detailMarker);

  if (detailIndex === -1) {
    return null;
  }

  const textIndex = html.indexOf('"TEXT":[', detailIndex);
  if (textIndex === -1) {
    return null;
  }

  const arrayStart = html.indexOf("[", textIndex);
  const arrayText = extractJsonArrayAt(html, arrayStart);
  if (!arrayText) {
    return null;
  }

  try {
    const values = JSON.parse(arrayText) as unknown;
    if (!Array.isArray(values)) {
      return null;
    }

    return values
      .map((value) => String(value ?? "").trim())
      .filter((value) => value.length > 0);
  } catch {
    return null;
  }
};

const splitZipAndCity = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  const match = normalized.match(/^(\d{4,5})\s+(.+)$/);

  if (!match) {
    return {
      zipCode: "",
      city: normalized,
    };
  }

  return {
    zipCode: match[1] ?? "",
    city: match[2] ?? "",
  };
};

const parseSportsGroundDataFromNewsPage = (
  html: string,
): ClubSportsGroundData | null => {
  const sportplatz = extractClubDetailTextValues(html, "Sportplatz") ?? [];
  const adresse = extractClubDetailTextValues(html, "Adresse") ?? [];

  const sportsGroundName = sportplatz[0] ?? "";
  const sportsGroundAddress = sportplatz[1] ?? adresse[0] ?? "";
  const cityLine = sportplatz[2] ?? adresse[1] ?? "";

  if (!sportsGroundName && !sportsGroundAddress && !cityLine) {
    return null;
  }

  const { zipCode, city } = splitZipAndCity(cityLine);

  return {
    sportsGroundName: sportsGroundName || undefined,
    sportsGroundAddress: sportsGroundAddress || undefined,
    sportsGroundZipCode: zipCode || undefined,
    sportsGroundCity: city || undefined,
  };
};

const parseClubPreloadPayload = (html: string) => {
  const matches = html.matchAll(
    /SG\.container\.appPreloads\['[^']+'\]=(\[.*?\]);/gs,
  );

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1] ?? "[]") as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const clubPayload = items.find((item) => {
        return (
          typeof item === "object" &&
          item !== null &&
          ("funktionaere" in item || "details" in item || "vereinsname" in item)
        );
      });

      if (clubPayload && typeof clubPayload === "object") {
        return clubPayload as Record<string, any>;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const firstText = (value: unknown) => {
  return Array.isArray(value) && typeof value[0] === "string"
    ? value[0].trim()
    : undefined;
};

const parseObmannContactDataFromNewsPage = (html: string): ClubContactData => {
  const payload = parseClubPreloadPayload(html);
  const funktionaere = Array.isArray(payload?.funktionaere)
    ? payload.funktionaere
    : [];
  const obmann = funktionaere.find((entry) => {
    const textValues = Array.isArray(entry?.infos?.TEXT)
      ? entry.infos.TEXT.map((value: unknown) => String(value).toLowerCase())
      : [];

    return textValues.some((value: string) => value.includes("obmann"));
  });
  const detailsKontakt = payload?.details?.Kontakt?.infos;

  return {
    obmannEmail:
      firstText(obmann?.infos?.EMAIL) || firstText(detailsKontakt?.EMAIL),
    obmannPhone:
      firstText(obmann?.infos?.MOBIL) ||
      firstText(obmann?.infos?.TELEFON) ||
      firstText(detailsKontakt?.TELEFON) ||
      firstText(detailsKontakt?.MOBIL),
  };
};

const parseClubLogoUrlFromNewsPage = (html: string, sourceUrl: string) => {
  const payload = parseClubPreloadPayload(html);
  const payloadLogo =
    firstText(payload?.logo) ||
    firstText(payload?.vereinsLogo) ||
    firstText(payload?.vereinLogo) ||
    (typeof payload?.logo === "string" ? payload.logo.trim() : undefined) ||
    (typeof payload?.vereinsLogo === "string"
      ? payload.vereinsLogo.trim()
      : undefined) ||
    (typeof payload?.vereinLogo === "string"
      ? payload.vereinLogo.trim()
      : undefined);

  const metaLogo =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i,
    )?.[1] ||
    html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i,
    )?.[1];

  const imageMatch =
    html.match(/<img[^>]+class=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)/i)
      ?.[1] ||
    html.match(/<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*logo/i)
      ?.[1];

  return absolutizeUrl(payloadLogo || metaLogo || imageMatch, sourceUrl);
};

const parseEmbeddedOefbTable = (
  html: string,
  sourceUrl: string,
  tableUrl: string,
): LeagueTableData | null => {
  const marker = '"tabellen":';
  const markerIndex = html.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const objectStart = html.indexOf("{", markerIndex + marker.length);
  const objectText = extractJsonObjectAt(html, objectStart);

  if (!objectText) {
    return null;
  }

  let payload: OefbTabellenPayload;

  try {
    payload = JSON.parse(objectText) as OefbTabellenPayload;
  } catch {
    return null;
  }

  const preferredBlocks = [
    "NORMAL",
    "GESAMT",
    "HEIM",
    "AUSWAERTS",
    "HERBST",
    "FRUEHJAHR",
  ];
  const selectedBlock = preferredBlocks
    .map((key) => payload[key])
    .find(
      (block) => Array.isArray(block?.eintraege) && block.eintraege.length > 0,
    );

  if (!selectedBlock?.eintraege || selectedBlock.eintraege.length === 0) {
    return null;
  }

  const headers = [
    "#",
    "Mannschaft",
    "Sp.",
    "S",
    "U",
    "N",
    "Torverh.",
    "+/-",
    "Pkt.",
  ];
  const rows = selectedBlock.eintraege.map((entry) => {
    const goalsFor = entry.toreErzielt ?? 0;
    const goalsAgainst = entry.toreErhalten ?? 0;
    const goalDifference = entry.tordifferenz ?? goalsFor - goalsAgainst;

    return [
      String(entry.rang ?? ""),
      String(entry.mannschaftBezeichnung ?? ""),
      String(entry.spiele ?? 0),
      String(entry.siege ?? 0),
      String(entry.unentschieden ?? 0),
      String(entry.niederlagen ?? 0),
      `${goalsFor}:${goalsAgainst}`,
      String(goalDifference),
      String(entry.punkte ?? 0),
    ];
  });

  return {
    headers,
    rows,
    sourceUrl,
    tableUrl,
    crawledAt: new Date().toISOString(),
    leagueName: selectedBlock.bewerbName || parseLeagueNameFromTablePage(html),
  };
};

const parseLeagueNameFromTablePage = (html: string) => {
  const normalizedHtml = html
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ");
  const knownLeagues = Object.values(CLUB_COMPETITION_DATA)
    .flatMap((verbandData) =>
      Object.values(verbandData.wettbewerbe).flatMap((ligen) => [...ligen]),
    )
    .sort((a, b) => b.length - a.length);

  return (
    knownLeagues.find((league) =>
      normalizedHtml.toLowerCase().includes(league.toLowerCase()),
    ) ?? undefined
  );
};

const parseLeagueTable = (
  html: string,
  sourceUrl: string,
  tableUrl: string,
): LeagueTableData => {
  const embeddedTable = parseEmbeddedOefbTable(html, sourceUrl, tableUrl);
  if (embeddedTable) {
    return embeddedTable;
  }

  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/i);
  if (!tableMatch) {
    throw new Error("Keine Tabelle auf der ÖFB-Seite gefunden.");
  }

  const tableHtml = tableMatch[0];
  const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  if (rowMatches.length === 0) {
    throw new Error("Die ÖFB-Tabelle enthält keine Zeilen.");
  }

  let headers: string[] = [];
  const rows: string[][] = [];

  for (const rowHtml of rowMatches) {
    const thCells = extractCells(rowHtml, "th");
    const tdCells = extractCells(rowHtml, "td");

    if (thCells.length > 0 && headers.length === 0) {
      headers = thCells;
      continue;
    }

    if (tdCells.length > 0) {
      const hasTemplateToken = tdCells.some(
        (cell) => cell.includes("{{") || cell.includes("}}"),
      );
      if (hasTemplateToken) {
        continue;
      }
      rows.push(tdCells);
    }
  }

  if (rows.length === 0) {
    throw new Error("Die ÖFB-Tabelle enthält keine auslesbaren Daten.");
  }

  if (headers.length === 0) {
    const firstRow = rows[0] ?? [];
    headers = firstRow.map((_, index) => `Spalte ${index + 1}`);
  }

  return {
    headers,
    rows,
    sourceUrl,
    tableUrl,
    crawledAt: new Date().toISOString(),
    leagueName: parseLeagueNameFromTablePage(html),
  };
};

const buildOefbTableUrl = (oefbClubProfileUrl: string) => {
  const trimmed = oefbClubProfileUrl.trim();
  const parsed = new URL(trimmed);

  if (parsed.hostname !== "vereine.oefb.at") {
    throw new Error(
      "Ungültiger ÖFB-Link. Erlaubt sind nur URLs von vereine.oefb.at",
    );
  }

  if (!/\/news\/?$/i.test(parsed.pathname)) {
    throw new Error("ÖFB-Link muss auf /News/ enden.");
  }

  return trimmed.replace(
    /\/news\/?$/i,
    "/Mannschaften/Saison-2025-26/KM/Tabellen",
  );
};

const normalizeAndValidateOefbNewsUrl = (oefbClubProfileUrl: string) => {
  const trimmed = oefbClubProfileUrl.trim();
  const parsed = new URL(trimmed);

  if (parsed.hostname !== "vereine.oefb.at") {
    throw new Error(
      "Ungültiger ÖFB-Link. Erlaubt sind nur URLs von vereine.oefb.at",
    );
  }

  const [, clubSlug] = parsed.pathname.split("/");

  if (!clubSlug) {
    throw new Error("ÖFB-Link muss auf eine Vereinsseite zeigen.");
  }

  parsed.protocol = "https:";
  parsed.pathname = `/${clubSlug}/News/`;
  parsed.search = "";
  parsed.hash = "";

  return parsed.toString();
};

const mergeSportsGroundData = (
  primary: ClubSportsGroundData | null,
  fallback: ClubSportsGroundData,
): ClubSportsGroundData => {
  return {
    sportsGroundName: primary?.sportsGroundName || fallback.sportsGroundName,
    sportsGroundAddress:
      primary?.sportsGroundAddress || fallback.sportsGroundAddress,
    sportsGroundZipCode:
      primary?.sportsGroundZipCode || fallback.sportsGroundZipCode,
    sportsGroundCity: primary?.sportsGroundCity || fallback.sportsGroundCity,
  };
};

const refreshClubLeagueTableFromOefb = async (club: {
  id: number;
  oefbClubProfileUrl: string | null;
}) => {
  if (!club.oefbClubProfileUrl) {
    return;
  }

  try {
    const normalizedOefbUrl = normalizeAndValidateOefbNewsUrl(
      club.oefbClubProfileUrl,
    );
    const tableUrl = buildOefbTableUrl(normalizedOefbUrl);
    const tableResponse = await fetch(tableUrl);

    if (!tableResponse.ok) {
      throw new Error(
        `ÖFB-Tabelle konnte nicht geladen werden (${tableResponse.status}).`,
      );
    }

    const tableHtml = await tableResponse.text();
    const leagueTableData = parseLeagueTable(
      tableHtml,
      normalizedOefbUrl,
      tableUrl,
    );

    await prisma.clubProfile.update({
      where: {
        id: club.id,
      },
      data: {
        oefbClubProfileUrl: normalizedOefbUrl,
        leagueTableData,
      },
    });
  } catch (error) {
    console.warn(
      `ÖFB-Tabellen-Aktualisierung für Verein ${club.id} fehlgeschlagen. Gespeicherte Tabelle wird verwendet.`,
      error,
    );
  }
};

const refreshClubLeagueTableByUserIdFromOefb = async (userId: number) => {
  const club = await prisma.clubProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      oefbClubProfileUrl: true,
    },
  });

  if (club) {
    await refreshClubLeagueTableFromOefb(club);
  }
};

const refreshAllClubLeagueTablesFromOefb = async () => {
  const clubs = await prisma.clubProfile.findMany({
    where: {
      oefbClubProfileUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      oefbClubProfileUrl: true,
    },
  });

  await Promise.all(clubs.map((club) => refreshClubLeagueTableFromOefb(club)));
};

export const createClubProfile = async (
  userId: number,
  data: CreateClubProfileBody,
) => {
  if (!data.verband || !data.wettbewerb || !data.league) {
    throw new Error("Verband, Wettbewerb und Liga sind erforderlich");
  }

  if (
    !isValidClubCompetitionSelection(data.verband, data.wettbewerb, data.league)
  ) {
    throw new Error("Ungültige Kombination aus Verband, Wettbewerb und Liga");
  }

  const existingPlayer = await prisma.playerProfile.findUnique({
    where: {
      userId,
    },
  });

  if (existingPlayer) {
    throw new Error("User already has a player profile");
  }

  const existingProfile = await prisma.clubProfile.findUnique({
    where: {
      userId,
    },
  });

  if (existingProfile) {
    throw new Error("Club profile already exists");
  }

  const manualSportsGroundData: ClubSportsGroundData = {
    sportsGroundName: data.sportsGroundName?.trim() || undefined,
    sportsGroundAddress: data.sportsGroundAddress?.trim() || undefined,
    sportsGroundZipCode: data.sportsGroundZipCode?.trim() || undefined,
    sportsGroundCity: data.sportsGroundCity?.trim() || undefined,
  };

  let normalizedOefbUrl: string | undefined;
  let leagueTableData: LeagueTableData | undefined;
  let crawledSportsGroundData: ClubSportsGroundData | null = null;
  let crawledContactData: ClubContactData = {
    obmannEmail: undefined,
    obmannPhone: undefined,
  };
  let crawledLogoUrl: string | undefined;

  if (data.oefbClubProfileUrl?.trim()) {
    normalizedOefbUrl = normalizeAndValidateOefbNewsUrl(
      data.oefbClubProfileUrl,
    );

    const [tableResponse, newsResponse] = await Promise.all([
      fetch(buildOefbTableUrl(normalizedOefbUrl)),
      fetch(normalizedOefbUrl),
    ]);

    if (!tableResponse.ok) {
      throw new Error("ÖFB-Tabelle konnte nicht geladen werden.");
    }

    if (!newsResponse.ok) {
      throw new Error("ÖFB-News-Seite konnte nicht geladen werden.");
    }

    const [tableHtml, newsHtml] = await Promise.all([
      tableResponse.text(),
      newsResponse.text(),
    ]);

    leagueTableData = parseLeagueTable(
      tableHtml,
      normalizedOefbUrl,
      buildOefbTableUrl(normalizedOefbUrl),
    );
    crawledSportsGroundData = parseSportsGroundDataFromNewsPage(newsHtml);
    crawledContactData = parseObmannContactDataFromNewsPage(newsHtml);
    crawledLogoUrl = parseClubLogoUrlFromNewsPage(newsHtml, normalizedOefbUrl);
  }

  const mergedSportsGroundData = mergeSportsGroundData(
    crawledSportsGroundData,
    manualSportsGroundData,
  );

  if (
    !mergedSportsGroundData.sportsGroundName ||
    !mergedSportsGroundData.sportsGroundAddress ||
    !mergedSportsGroundData.sportsGroundZipCode ||
    !mergedSportsGroundData.sportsGroundCity
  ) {
    throw new Error(
      "Sportplatz, Adresse, PLZ und Stadt sind erforderlich. Ohne ÖFB-Link bitte manuell ausfüllen.",
    );
  }

  const location = mergedSportsGroundData.sportsGroundCity || "";

  if (!location) {
    throw new Error("Standort konnte nicht ermittelt werden.");
  }

  const profile = await prisma.clubProfile.create({
    data: {
      userId,
      clubName: data.clubName,
      verband: data.verband,
      wettbewerb: data.wettbewerb,
      league: data.league,
      location,
      phone: crawledContactData.obmannPhone || data.phone,
      obmannEmail: crawledContactData.obmannEmail || data.obmannEmail,
      oefbClubProfileUrl: normalizedOefbUrl,
      leagueTableData,
      sportsGroundName: mergedSportsGroundData.sportsGroundName,
      sportsGroundAddress: mergedSportsGroundData.sportsGroundAddress,
      sportsGroundZipCode: mergedSportsGroundData.sportsGroundZipCode,
      sportsGroundCity: mergedSportsGroundData.sportsGroundCity,
      logoPath: data.logoPath || crawledLogoUrl,
      description: data.description,
    },
  });

  return profile;
};

export const getMyClubProfile = async (userId: number) => {
  await refreshClubLeagueTableByUserIdFromOefb(userId);

  return prisma.clubProfile.findUnique({
    where: {
      userId,
    },
  });
};

export const getAllClubs = async () => {
  await refreshAllClubLeagueTablesFromOefb();

  return prisma.clubProfile.findMany({
    include: {
      user: {
        select: { email: true },
      },
      requirements: true,
    },
  });
};

export const getClubRatings = async (clubId: number) => {
  const club = await prisma.clubProfile.findUnique({
    where: {
      id: clubId,
    },
    select: {
      userId: true,
    },
  });

  if (!club) {
    throw new Error("Club profile not found");
  }

  return prisma.rating.findMany({
    where: {
      fromUserId: club.userId,
      ratingType: "TRIAL",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          position: true,
          profileImagePath: true,
          profileImageUrl: true,
        },
      },
      trialTraining: {
        select: {
          id: true,
          scheduledAt: true,
          feedback: true,
        },
      },
    },
  });
};

export const getClubCompetitionOptions = async () => {
  return Object.keys(CLUB_COMPETITION_DATA).map((verband) => ({
    verband,
    wettbewerbe: getCompetitionOptionsByVerband(verband),
  }));
};

export const uploadClubLogo = async (clubId: number, logoPath: string) => {
  return prisma.clubProfile.update({
    where: {
      id: clubId,
    },
    data: {
      logoPath,
    },
  });
};

const parseClubNameFromNewsPage = (html: string) => {
  const title =
    html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,
    )?.[1] ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const decodedTitle = stripHtml(title ?? "");
  const nameMatch = decodedTitle.match(
    /^(?:News\s*\|\s*)?(.+?)\s+Vereinshomepage/i,
  );

  return (nameMatch?.[1] ?? decodedTitle.replace(/^News\s*\|\s*/i, "")).trim();
};

export const previewOefbClubProfile = async (oefbClubProfileUrl: string) => {
  const normalizedOefbUrl = normalizeAndValidateOefbNewsUrl(oefbClubProfileUrl);
  const tableUrl = buildOefbTableUrl(normalizedOefbUrl);
  const [newsResponse, tableResponse] = await Promise.all([
    fetch(normalizedOefbUrl),
    fetch(tableUrl).catch(() => null),
  ]);

  if (!newsResponse.ok) {
    throw new Error("ÖFB-Vereinsseite konnte nicht geladen werden.");
  }

  const newsHtml = await newsResponse.text();
  const sportsGroundData = parseSportsGroundDataFromNewsPage(newsHtml);
  const contactData = parseObmannContactDataFromNewsPage(newsHtml);
  const logoUrl = parseClubLogoUrlFromNewsPage(newsHtml, normalizedOefbUrl);
  let leagueTableData: LeagueTableData | undefined;

  if (tableResponse?.ok) {
    const tableHtml = await tableResponse.text();
    leagueTableData = parseLeagueTable(tableHtml, normalizedOefbUrl, tableUrl);
  }

  return {
    source: {
      url: normalizedOefbUrl,
      tableUrl,
      fetchedAt: new Date().toISOString(),
    },
    clubName: parseClubNameFromNewsPage(newsHtml),
    sportsGroundName: sportsGroundData?.sportsGroundName,
    sportsGroundAddress: sportsGroundData?.sportsGroundAddress,
    sportsGroundZipCode: sportsGroundData?.sportsGroundZipCode,
    sportsGroundCity: sportsGroundData?.sportsGroundCity,
    obmannEmail: contactData.obmannEmail,
    obmannPhone: contactData.obmannPhone,
    logoUrl,
    location: sportsGroundData?.sportsGroundCity,
    leagueTable: leagueTableData
      ? {
          headers: leagueTableData.headers,
          rows: leagueTableData.rows.slice(0, 5),
          totalRows: leagueTableData.rows.length,
          leagueName: leagueTableData.leagueName,
        }
      : undefined,
    competitionSelection: leagueTableData?.leagueName
      ? findCompetitionSelectionByLeague(leagueTableData.leagueName)
      : null,
  };
};

export const updateOefbClubProfile = async (
  userId: number,
  oefbClubProfileUrl: string,
) => {
  const club = await prisma.clubProfile.findUnique({
    where: { userId },
  });

  if (!club) {
    throw new Error("Club profile not found");
  }

  const normalizedOefbUrl = normalizeAndValidateOefbNewsUrl(oefbClubProfileUrl);
  const tableUrl = buildOefbTableUrl(normalizedOefbUrl);
  const [tableResponse, newsResponse] = await Promise.all([
    fetch(tableUrl),
    fetch(normalizedOefbUrl),
  ]);

  if (!tableResponse.ok) {
    throw new Error("ÖFB-Tabelle konnte nicht geladen werden.");
  }

  if (!newsResponse.ok) {
    throw new Error("ÖFB-News-Seite konnte nicht geladen werden.");
  }

  const [tableHtml, newsHtml] = await Promise.all([
    tableResponse.text(),
    newsResponse.text(),
  ]);
  const leagueTableData = parseLeagueTable(
    tableHtml,
    normalizedOefbUrl,
    tableUrl,
  );
  const sportsGroundData = parseSportsGroundDataFromNewsPage(newsHtml);
  const contactData = parseObmannContactDataFromNewsPage(newsHtml);
  const logoUrl = parseClubLogoUrlFromNewsPage(newsHtml, normalizedOefbUrl);

  return prisma.clubProfile.update({
    where: { id: club.id },
    data: {
      oefbClubProfileUrl: normalizedOefbUrl,
      leagueTableData,
      sportsGroundName: sportsGroundData?.sportsGroundName,
      sportsGroundAddress: sportsGroundData?.sportsGroundAddress,
      sportsGroundZipCode: sportsGroundData?.sportsGroundZipCode,
      sportsGroundCity: sportsGroundData?.sportsGroundCity,
      phone: contactData.obmannPhone || club.phone,
      obmannEmail: contactData.obmannEmail || club.obmannEmail,
      logoPath: logoUrl || club.logoPath,
      location: sportsGroundData?.sportsGroundCity || club.location,
    },
  });
};

export const updateMyClubContact = async (
  userId: number,
  data: UpdateClubContactBody,
) => {
  const email = data.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("E-Mail ist erforderlich.");
  }

  const club = await prisma.clubProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!club) {
    throw new Error("Club profile not found");
  }

  const phone = data.phone?.trim() || null;
  const sportsGroundName = data.sportsGroundName?.trim() || null;
  const sportsGroundAddress = data.sportsGroundAddress?.trim() || null;
  const sportsGroundZipCode = data.sportsGroundZipCode?.trim() || null;
  const sportsGroundCity = data.sportsGroundCity?.trim() || null;

  let crawledSportsGroundData: ClubSportsGroundData | null = null;
  let crawledContactData: ClubContactData = {
    obmannEmail: undefined,
    obmannPhone: undefined,
  };

  if (club.oefbClubProfileUrl) {
    try {
      const normalizedOefbUrl = normalizeAndValidateOefbNewsUrl(
        club.oefbClubProfileUrl,
      );
      const newsResponse = await fetch(normalizedOefbUrl);

      if (newsResponse.ok) {
        const newsHtml = await newsResponse.text();
        crawledSportsGroundData = parseSportsGroundDataFromNewsPage(newsHtml);
        crawledContactData = parseObmannContactDataFromNewsPage(newsHtml);
      }
    } catch {
      // Keep manual or existing values when crawling fails.
    }
  }

  const finalPhone = phone || crawledContactData.obmannPhone || club.phone;
  const finalSportsGroundName =
    sportsGroundName || crawledSportsGroundData?.sportsGroundName || club.sportsGroundName;
  const finalSportsGroundAddress =
    sportsGroundAddress ||
    crawledSportsGroundData?.sportsGroundAddress ||
    club.sportsGroundAddress;
  const finalSportsGroundZipCode =
    sportsGroundZipCode ||
    crawledSportsGroundData?.sportsGroundZipCode ||
    club.sportsGroundZipCode;
  const finalSportsGroundCity =
    sportsGroundCity || crawledSportsGroundData?.sportsGroundCity || club.sportsGroundCity;

  try {
    const [, updatedClub] = await prisma.$transaction([
      prisma.user.update({
        where: { id: club.user.id },
        data: { email },
      }),
      prisma.clubProfile.update({
        where: { id: club.id },
        data: {
          phone: finalPhone,
          sportsGroundName: finalSportsGroundName,
          sportsGroundAddress: finalSportsGroundAddress,
          sportsGroundZipCode: finalSportsGroundZipCode,
          sportsGroundCity: finalSportsGroundCity,
          location: finalSportsGroundCity || club.location,
        },
      }),
    ]);

    return {
      ...updatedClub,
      email,
    };
  } catch (error) {
    const prismaError = error as { code?: string };

    if (prismaError.code === "P2002") {
      throw new Error("Diese E-Mail wird bereits verwendet.");
    }

    throw error;
  }
};

export const getClubDashboard = async (userId: number) => {
  await refreshClubLeagueTableByUserIdFromOefb(userId);

  const club = await prisma.clubProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!club) {
    throw new Error("Club profile not found");
  }

  const [players, applicationsCount, trialTrainingsCount, requirementsCount] =
    await Promise.all([
      searchPlayers({}, userId),
      prisma.application.count({
        where: {
          clubId: club.id,
        },
      }),
      prisma.trialTraining.count({
        where: {
          clubId: club.id,
        },
      }),
      prisma.clubRequirement.count({
        where: {
          clubId: club.id,
        },
      }),
    ]);

  const playersWithFit = players.filter(
    (player) => typeof player.clubFitPercent === "number",
  );

  const topMatches = [...playersWithFit]
    .sort((a, b) => (b.clubFitPercent ?? 0) - (a.clubFitPercent ?? 0))
    .slice(0, 8);

  return {
    club,
    counts: {
      matchingPlayers: playersWithFit.length,
      highFitPlayers: playersWithFit.filter(
        (player) => (player.clubFitPercent ?? 0) >= 70,
      ).length,
      verifiedPlayers: players.filter((player) => player.verified).length,
      openToPlayPlayers: players.filter((player) => player.openToPlay).length,
      applications: applicationsCount,
      trialTrainings: trialTrainingsCount,
      requirements: requirementsCount,
    },
    topMatches,
  };
};
