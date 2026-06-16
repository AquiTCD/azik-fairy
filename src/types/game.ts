export type RankType = "PERFECT" | "A" | "B" | "C";

export interface GameStats {
  time: number;
  wpm: number;
  accuracy: number;
  totalKeys: number;
  missCount: number;
  azikRatio: number;
  rank: RankType;
  comment: string;
  savedKeys: number;
}
