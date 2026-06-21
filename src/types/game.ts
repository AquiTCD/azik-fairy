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
}

export interface StageProgress {
  stars: number;
  bestWpm: number;
  bestAccuracy: number;
  bestTime: number;
}

export interface UserProgress {
  stageProgress: Record<string, StageProgress>;
  totalKeysTyped: number;
  lastPlayDate: string;
  streak: number;
  seenStageIntros: string[];
}

export type GameState = "TITLE" | "STAGE_SELECT" | "STAGE_INTRO" | "PLAYING" | "RESULT" | "SETTINGS" | "HELP";
