export interface Club {
  id: number;
  clubName: string;
  verband: string;
  wettbewerb: string;
  league: string;
  location: string;
  description?: string | null;
  logoPath?: string | null;
}
