export interface OefbClubHistoryEntry {
  club: string;
  clubId?: string | undefined;
  position?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  games?: number | undefined;
  goals?: number | undefined;
  yellowCards?: number | undefined;
  redCards?: number | undefined;
  logo?: string | undefined;
  url?: string | undefined;
  countryCode?: string | undefined;
}

export interface OefbCompetition {
  name: string;
  link?: string | undefined;
}

export interface OefbMatchSummary {
  label?: string | undefined;
  teams?: string | undefined;
  date?: string | undefined;
  result?: string | undefined;
  shortResult?: string | undefined;
  url?: string | undefined;
}

export interface OefbStatistic {
  category?: string | undefined;
  label?: string | undefined;
  games?: number | undefined;
  tournamentAppearances?: number | undefined;
  wins?: number | undefined;
  draws?: number | undefined;
  losses?: number | undefined;
  goals?: number | undefined;
  goalsPerGame?: string | undefined;
  minutes?: number | undefined;
  minutesPerGame?: number | undefined;
  substitutionsIn?: number | undefined;
  substitutionsOut?: number | undefined;
  yellowCards?: number | undefined;
  yellowRedCards?: number | undefined;
  redCards?: number | undefined;
  competitionGames?: number | undefined;
  competitionGoals?: number | undefined;
  competitionMinutes?: number | undefined;
  friendlyGames?: number | undefined;
  friendlyGoals?: number | undefined;
  friendlyMinutes?: number | undefined;
}

export interface OefbPlayerProfile {
  source: {
    url: string;
    fetchedAt: string;
    playerId?: string | undefined;
  };
  identity: {
    firstName?: string | undefined;
    lastName?: string | undefined;
    fullName: string;
    position?: string | undefined;
    birthDate?: string | undefined;
    heightCm?: number | undefined;
    weightKg?: number | undefined;
    profileImageUrl?: string | undefined;
  };
  currentClub: {
    name?: string | undefined;
    id?: string | undefined;
    logo?: string | undefined;
    url?: string | undefined;
    association?: string | undefined;
    since?: string | undefined;
  };
  flags: {
    youth?: boolean | undefined;
    blueCards?: boolean | undefined;
    hiddenDetails?: boolean | undefined;
  };
  history: OefbClubHistoryEntry[];
  statistics: OefbStatistic[];
  competitions: OefbCompetition[];
  firstMatch?: OefbMatchSummary | undefined;
  lastMatch?: OefbMatchSummary | undefined;
  displayFields: Array<{
    label: string;
    value: string | number | boolean;
  }>;
  raw: Record<string, unknown>;
}
