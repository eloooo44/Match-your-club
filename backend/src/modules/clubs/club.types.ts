export interface CreateClubProfileBody {
  clubName: string;
  verband: string;
  wettbewerb: string;
  league: string;
  location?: string;
  phone?: string;
  obmannEmail?: string;
  oefbClubProfileUrl?: string;
  sportsGroundName?: string;
  sportsGroundAddress?: string;
  sportsGroundZipCode?: string;
  sportsGroundCity?: string;
  logoPath?: string;
  description?: string;
}

export interface UpdateOefbClubProfileBody {
  oefbClubProfileUrl: string;
}

export interface UpdateClubContactBody {
  email: string;
  phone?: string;
  sportsGroundName?: string;
  sportsGroundAddress?: string;
  sportsGroundZipCode?: string;
  sportsGroundCity?: string;
}
