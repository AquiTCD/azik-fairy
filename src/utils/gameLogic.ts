import { STAGES } from "../data/stages";
import { RankType } from "../types/game";

export function calcStars(accuracy: number, wpm: number): 1 | 2 | 3 {
  if (accuracy >= 98 && wpm >= 100) return 3;
  if (accuracy >= 90) return 2;
  return 1;
}

export function calcStreak(
  lastPlayDate: string,
  todayStr: string,
  currentStreak: number
): number {
  if (lastPlayDate === todayStr) return currentStreak;
  if (!lastPlayDate) return 1;
  const diffDays = Math.round(
    (new Date(todayStr).getTime() - new Date(lastPlayDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays === 1) return currentStreak + 1;
  return 1;
}

export function getRank(accuracy: number, wpm: number, azikRatio: number): RankType {
  if (accuracy === 100 && wpm >= 250 && azikRatio >= 90) return "PERFECT";
  if (accuracy >= 93  && wpm >= 180 && azikRatio >= 75) return "A";
  if (accuracy >= 80  && wpm >= 120 && azikRatio >= 60) return "B";
  return "C";
}

export function getNextStageId(currentId: string): string | null {
  const idx = STAGES.findIndex((s) => s.id === currentId);
  if (idx < 0 || idx >= STAGES.length - 1) return null;
  return STAGES[idx + 1].id;
}
