export interface CreateRatingBody {
  playerId: number;
  clubId: number;

  ratingType: string;

  score: number;

  comment?: string;
}
