import { STAGES } from "../data/stages";
import { RankType, WeaknessStat, DailySession } from "../types/game";
import type { TypingWord } from "../data/azikRules";

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

export function calcOptimalProgress(
  words: TypingWord[],
  wordIndex: number,
  segmentIndex: number,
): { optimalNormal: number; optimalAzik: number } {
  let optimalNormal = 0;
  let optimalAzik = 0;
  for (let i = 0; i < wordIndex; i++) {
    words[i].segments.forEach(seg => {
      optimalNormal += Math.min(...seg.normal.map(p => p.length));
      optimalAzik += Math.min(...seg.azik.map(p => p.length));
    });
  }
  if (wordIndex < words.length) {
    const currentWord = words[wordIndex];
    for (let j = 0; j < segmentIndex; j++) {
      const seg = currentWord.segments[j];
      optimalNormal += Math.min(...seg.normal.map(p => p.length));
      optimalAzik += Math.min(...seg.azik.map(p => p.length));
    }
  }
  return { optimalNormal, optimalAzik };
}

export function getWeaknessRanking(
  weaknessStats: Record<string, WeaknessStat>,
  topN = 5
): string[] {
  return Object.entries(weaknessStats)
    .filter(([, stat]) => stat.attemptCount >= 5 && stat.missCount / stat.attemptCount >= 0.3)
    .sort(([, a], [, b]) => (b.missCount / b.attemptCount) - (a.missCount / a.attemptCount))
    .slice(0, topN)
    .map(([key]) => key);
}

export function mergeWeaknessStats(
  current: Record<string, WeaknessStat>,
  sessionHeatmap: Record<string, { miss: number; attempt: number }>,
  missTypeMode: "typo" | "strict",
  todayStr: string
): Record<string, WeaknessStat> {
  const merged = { ...current };
  for (const [key, { miss, attempt }] of Object.entries(sessionHeatmap)) {
    const existing = merged[key] ?? {
      missCount: 0, attemptCount: 0,
      missType: { strict: 0, typo: 0, slow: 0 },
      lastMissDate: "",
    };
    merged[key] = {
      missCount: existing.missCount + miss,
      attemptCount: existing.attemptCount + attempt,
      missType: {
        strict: existing.missType.strict + (missTypeMode === "strict" ? miss : 0),
        typo: existing.missType.typo + (missTypeMode === "typo" ? miss : 0),
        slow: existing.missType.slow,
      },
      lastMissDate: miss > 0 ? todayStr : existing.lastMissDate,
    };
  }
  return merged;
}

export function mergeSessionHistory(
  history: DailySession[],
  todayStr: string,
  newWpm: number,
  newAccuracy: number,
  newAzikRatio: number,
): DailySession[] {
  const existing = history.find(s => s.date === todayStr);
  let updated: DailySession[];

  if (existing) {
    updated = history.map(s =>
      s.date === todayStr
        ? {
            date: todayStr,
            bestWpm: Math.max(s.bestWpm, newWpm),
            avgAccuracy: Math.round((s.avgAccuracy + newAccuracy) / 2),
            avgAzikRatio: Math.round((s.avgAzikRatio + newAzikRatio) / 2),
          }
        : s
    );
  } else {
    updated = [...history, {
      date: todayStr,
      bestWpm: newWpm,
      avgAccuracy: newAccuracy,
      avgAzikRatio: newAzikRatio,
    }];
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toLocaleDateString("sv-SE");
  return updated.filter(s => s.date >= cutoffStr);
}
