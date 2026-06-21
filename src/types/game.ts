import { SoundThemeName } from "@/hooks/useAzikSound";

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
  keyHeatmap: Record<string, { miss: number; attempt: number }>;
}

export interface GameSettings {
  isTraining: boolean;
  isFullTraining: boolean;
  showGuide: boolean;
  showTable: boolean;
  customRules: Record<string, string[]>;
  keyboardLayout: "US" | "JIS";
  soundEnabled: boolean;
  soundTheme: SoundThemeName;
  wordsPerSession: number;
  enableSpecial: boolean;
  enableForeign: boolean;
  nAlternative: "off" | "left" | "all";
  smallKanaPrefix: "l" | "xx" | "both";
  ghostRaceEnabled: boolean;
}

export interface StageProgress {
  stars: number;
  bestWpm: number;
  bestAccuracy: number;
  bestTime: number;
}

export interface WeaknessStat {
  missCount: number;
  attemptCount: number;
  missType: {
    strict: number;
    typo: number;
    slow: number;
  };
  lastMissDate: string;
}

export interface DailySession {
  date: string;
  bestWpm: number;
  avgAccuracy: number;
  avgAzikRatio: number;
}

export interface TimeAttackBest {
  wpm: number;
  accuracy: number;
  date: string;
}

export interface UserProgress {
  stageProgress: Record<string, StageProgress>;
  totalKeysTyped: number;
  lastPlayDate: string;
  streak: number;
  seenStageIntros: string[];
  weaknessStats: Record<string, WeaknessStat>;
  sessionHistory: DailySession[];
  timeAttackBest: TimeAttackBest | null;
}

export type GameState =
  | "TITLE"
  | "MODE_SELECT"
  | "STAGE_SELECT"
  | "STAGE_INTRO"
  | "PLAYING"
  | "RESULT"
  | "SETTINGS"
  | "HELP"
  | "STATS"
  | "TIME_ATTACK";
