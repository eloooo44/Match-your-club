import type { FootballSkill, PlayerPosition } from "@prisma/client";

export interface CreatePlayerProfileBody {
  name: string;
  birthdate: string;
  position: PlayerPosition[] | string;
  location: string;
  description?: string;
  openToPlay?: boolean;
  profileImageUrl?: string;
  oefbProfileUrl?: string;
  skills?: FootballSkill[] | string[] | string;
  highlightedSkills?: FootballSkill[] | string[] | string;
  preferredFoot?: string;
  weakFootRating?: number;
  heightCm?: number;
}

export interface UpdatePlayerProfileBody {
  name?: string;
  birthdate?: string;
  position?: PlayerPosition[] | string;
  location?: string;
  description?: string;
  openToPlay?: boolean;
  oefbProfileUrl?: string;
  skills?: FootballSkill[] | string[] | string;
  highlightedSkills?: FootballSkill[] | string[] | string;
  preferredFoot?: string;
  weakFootRating?: number;
  heightCm?: number;
}

export interface SearchPlayersFilters {
  position?: string;
  location?: string;
  tempo?: string;
  shooting?: string;
  passing?: string;
  dribbling?: string;
  defending?: string;
  physical?: string;
  verified?: string;
  openToPlay?: string;
  availableImmediately?: string;
  hasExternalRating?: string;
  hasVideo?: string;
  minAge?: string;
  maxAge?: string;
  minScore?: string;
  sortBy?: string;
}
