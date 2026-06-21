"use client";

import React, { useState, useEffect } from "react";
import { SoundThemeName } from "@/hooks/useAzikSound";
import { getRandomAds } from "@/data/adData";
import { calcStars, calcStreak, getNextStageId } from "@/utils/gameLogic";
import { STAGES } from "@/data/stages";
import StageSelector from "@/components/StageSelector";
import Settings from "@/components/Settings";
import TypingGame from "@/components/TypingGame";
import HelpFAQ from "@/components/HelpFAQ";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";
import AdBanner from "@/components/AdBanner";
import KeyNavGroup from "@/components/KeyNavGroup";
import AzikKeyVisualizer from "@/components/AzikKeyVisualizer";
import { GameStats } from "@/types/game";
import resultComments from "../../public/data/result_comments.json";

export interface GameSettings {
  isTraining: boolean;
  isFullTraining: boolean;
  showGuide: boolean;
  showTable: boolean;
  customRules: Record<string, string[]>; // { "ん": ["q"], "っ": [";", ":"], ... }
  keyboardLayout: "US" | "JIS";
  soundEnabled: boolean;
  soundTheme: SoundThemeName;
  wordsPerSession: number; // 0 = unlimited
  enableSpecial: boolean;   // 特殊拡張 (こと/もの/する/です/ます)
  enableForeign: boolean;   // 外来語拡張 (tgi/dci/tgu/dcu = てぃ/でぃ/とぅ/どぅ)
  nAlternative: "off" | "left" | "all"; // 撥音ZショートカットへのN代替: off=Zのみ / left=左手子音のみ / all=全子音
}

export interface StageProgress {
  stars: number; // 0, 1, 2, 3
  bestWpm: number;
  bestAccuracy: number;
  bestTime: number;
}

export interface UserProgress {
  stageProgress: Record<string, StageProgress>; // stageId -> StageProgress
  totalKeysTyped: number;
  lastPlayDate: string; // YYYY-MM-DD
  streak: number;
  seenStageIntros: string[]; // stageIds where intro has been shown
}

export type GameState = "TITLE" | "STAGE_SELECT" | "STAGE_INTRO" | "PLAYING" | "RESULT" | "SETTINGS" | "HELP";

const STORAGE_KEY = "azik-fairy-settings";
const PROGRESS_STORAGE_KEY = "azik-fairy-progress";

const DEFAULT_SETTINGS: GameSettings = {
  isTraining: true,
  isFullTraining: false,
  showGuide: true,
  showTable: true,
  customRules: {},
  keyboardLayout: "JIS",
  soundEnabled: false,
  soundTheme: "soft" as SoundThemeName,
  wordsPerSession: 30,
  enableSpecial: true,
  enableForeign: true,
  nAlternative: "left",
};

const DEFAULT_PROGRESS: UserProgress = {
  stageProgress: {},
  totalKeysTyped: 0,
  lastPlayDate: "",
  streak: 0,
  seenStageIntros: [],
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("TITLE");
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  
  // 設定ステート (初期値はデフォルト)
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  // 進捗・統計ステート
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);

  // マウント状態管理 (ハイドレーション不一致エラーの対策)
  const [isMounted, setIsMounted] = useState(false);

  const [stats, setStats] = useState<GameStats | null>(null);

  const [titleAds] = useState(() => getRandomAds(2));
  const [resultAds] = useState(() => getRandomAds(2));

  // 1. マウント時に LocalStorage から設定と進捗を復元
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate customRules: old format was Record<string, string>, new is Record<string, string[]>
        if (parsed.customRules) {
          const migrated: Record<string, string[]> = {};
          for (const [k, v] of Object.entries(parsed.customRules)) {
            if (typeof v === "string") migrated[k] = [v];
            else if (Array.isArray(v)) migrated[k] = v as string[];
          }
          parsed.customRules = migrated;
        }
        // Migrate old soundTheme:"off"/"default" → soundEnabled + soundTheme split
        if (parsed.soundTheme === "off") {
          parsed.soundEnabled = false;
          parsed.soundTheme = "soft";
        } else if (parsed.soundTheme === "default") {
          parsed.soundEnabled = true;
          parsed.soundTheme = "soft";
        }
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to load settings from localStorage:", e);
      }
    }

    const storedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress);
        setProgress({
          ...DEFAULT_PROGRESS,
          ...parsed,
        });
      } catch (e) {
        console.error("Failed to load progress from localStorage:", e);
      }
    }
  }, []);

  // 2. 設定変更時に LocalStorage に自動保存
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const startStage = (stageId: string) => {
    setSelectedStageId(stageId);
    const stage = STAGES.find(s => s.id === stageId);
    const isLevStage = stage && !["Practice", "Challenge"].includes(stage.category);
    const hasSeen = progress.seenStageIntros.includes(stageId);
    if (isLevStage && !hasSeen) {
      setGameState("STAGE_INTRO");
    } else {
      setGameState("PLAYING");
    }
  };

  const handleStartFromIntro = () => {
    if (!selectedStageId) return;
    const newSeen = [...progress.seenStageIntros, selectedStageId];
    const newProgress = { ...progress, seenStageIntros: newSeen };
    setProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
    setGameState("PLAYING");
  };

  const handleClearProgress = () => {
    if (confirm("すべてのスコアと進捗を削除しますか？この操作は元に戻せません。")) {
      setProgress(DEFAULT_PROGRESS);
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    }
  };

  const handleFinishGame = (gameStats: GameStats) => {
    setStats(gameStats);
    setGameState("RESULT");

    if (!selectedStageId) return;

    const stars = calcStars(gameStats.accuracy, gameStats.wpm);

    const currentStageProgress = progress.stageProgress[selectedStageId] || {
      stars: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      bestTime: Infinity,
    };

    // 自己ベストの更新
    const newStars = Math.max(currentStageProgress.stars, stars);
    const newWpm = Math.max(currentStageProgress.bestWpm, gameStats.wpm);
    const newAccuracy = Math.max(currentStageProgress.bestAccuracy, gameStats.accuracy);
    const newTime = Math.min(currentStageProgress.bestTime, gameStats.time);

    const updatedStageProgress = {
      ...progress.stageProgress,
      [selectedStageId]: {
         stars: newStars,
         bestWpm: newWpm,
         bestAccuracy: newAccuracy,
         bestTime: newTime,
      },
    };

    const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD 形式
    const newStreak = calcStreak(progress.lastPlayDate, todayStr, progress.streak);

    const newProgress: UserProgress = {
      ...progress,
      stageProgress: updatedStageProgress,
      totalKeysTyped: progress.totalKeysTyped + gameStats.totalKeys,
      lastPlayDate: todayStr,
      streak: newStreak,
    };

    setProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  };

  // マウントされるまではハイドレーション崩れを防ぐためにローディングまたは空表示にする
  if (!isMounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 font-pixel text-green-500">
        LOADING ENGINE...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-zinc-950 font-sans">
      
      {/* タイトル画面 - 横長レイアウト */}
      {gameState === "TITLE" && (
        <FairyScreenLayout fairy={{ emotion: "idle", message: (() => {
                if (progress.totalKeysTyped === 0) {
                  const firstMsgs = [
                    "準備おっけー？アタシと一緒にAZIKタイピング、爆速でマスターしちゃお！💅💎✨",
                    "はじめまして～！アタシがAZIKの習得を全力サポートするよ！一緒にやろ！✨💎",
                    "AZIKって知ってる！？指が爆速になる魔法の入力方法！アタシが教えてあげるね！🔥💅",
                  ];
                  return firstMsgs[Math.floor(Math.random() * firstMsgs.length)];
                }
                const welcomeMsgs = [
                  "おかえりー！今日もアタシとAZIKの練習しよ！💅💖",
                  "きたきたー！待ってたよ！一緒にAZIK極めちゃお！✨🔥",
                  "おっ！また来てくれたじゃん！アタシ地味に嬉しいんだけど！💗",
                  "お帰り～！指の準備はオッケー？今日も爆走しよ！💎⚡",
                  "今日も練習に来るとか偉すぎじゃん！アタシ感動してる！🌟💖",
                ];
                const lines = [welcomeMsgs[Math.floor(Math.random() * welcomeMsgs.length)]];
                if (progress.streak > 1) {
                  const streakMsgs = [
                    `連続${progress.streak}日目とかマジでリスペクトなんだけど！🔥`,
                    `${progress.streak}日連続練習！その継続力、天才みが深いわ！💅`,
                    `連続${progress.streak}日！AZIKへの本気度えぐすぎ！🏆`,
                  ];
                  lines.push(streakMsgs[Math.floor(Math.random() * streakMsgs.length)]);
                }
                if (progress.totalKeysTyped >= 10000) {
                  const bigMsgs = [
                    `累計${progress.totalKeysTyped.toLocaleString()}打鍵突破！もうAZIK中毒系でしょ！⭐👑`,
                    `打鍵数${progress.totalKeysTyped.toLocaleString()}回！指の筋肉が別格になってるよ！💎🔥`,
                  ];
                  lines.push(bigMsgs[Math.floor(Math.random() * bigMsgs.length)]);
                } else if (progress.totalKeysTyped >= 1000) {
                  const midMsgs = [
                    `累計${progress.totalKeysTyped.toLocaleString()}打鍵突破！いい感じに指が馴染んできたね！💎`,
                    `${progress.totalKeysTyped.toLocaleString()}打鍵！着実に上手くなってるの感じてる！✨`,
                  ];
                  lines.push(midMsgs[Math.floor(Math.random() * midMsgs.length)]);
                }
                return lines.join("\n");
              })() }}>
          <div className="flex-1 flex flex-col items-center gap-4 text-center">
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-widest font-pixel"
              style={{ animation: 'glow-yellow 2.4s ease-in-out infinite' }}
            >
              AZIK-FAIRY
            </h1>
            <p className="text-base md:text-xl font-bold tracking-widest text-green-400 border-b border-green-950 pb-3 w-full">
              AZIKタイピング養成妖精
            </p>

            {/* 統計ステータス */}
            {(() => {
              const LEV_CATS = new Set(["Lev1", "Lev2a", "Lev2b", "Lev3a", "Lev3b", "Lev4"]);
              const levStages = STAGES.filter(s => LEV_CATS.has(s.category));
              const levTotal = levStages.length;
              const levCleared = levStages.filter(s => (progress.stageProgress[s.id]?.stars ?? 0) >= 2).length;
              const pct = Math.round((levCleared / levTotal) * 100);
              return (
                <div className="text-[10px] md:text-xs font-pixel text-green-300 border border-green-800 bg-zinc-950/80 px-4 py-2 rounded w-full flex flex-col gap-2 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]">
                  {progress.totalKeysTyped > 0 && (
                    <div className="flex justify-around">
                      <div>TOTAL KEYS: <span className="font-bold text-yellow-400">{progress.totalKeysTyped.toLocaleString()}</span></div>
                      <div>STREAK: <span className="font-bold text-yellow-400">{progress.streak} DAYS</span></div>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span>PROGRESS</span>
                      <span><span className="font-bold text-yellow-400">{levCleared}</span> / {levTotal} STAGES CLEARED</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            <KeyNavGroup className="flex flex-col gap-4 w-full max-w-xs">
              <GameButton variant="primary" size="lg" onClick={() => setGameState("STAGE_SELECT")} className="w-full">
                GAME START
              </GameButton>
              <GameButton variant="secondary" size="md" onClick={() => setGameState("SETTINGS")} className="w-full">
                OPTIONS
              </GameButton>
              <GameButton variant="ghost" size="sm" onClick={() => setGameState("HELP")} className="w-full py-2">
                HOW TO PLAY / FAQ
              </GameButton>
            </KeyNavGroup>

            {/* AMAZON ASSOC AD BANNERS */}
            <AdBanner ads={titleAds} />

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeX8QOLxetOJ9GgAiByaZGesA_EExHvHs07xmdX1gttuHsvVQ/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center text-xs font-pixel border border-green-800 px-4 py-2 text-green-600 hover:text-green-300 hover:border-green-500 hover:bg-green-950 rounded transition-colors"
            >
              SEND FEEDBACK
            </a>

            <div className="text-[9px] opacity-60 space-y-1">
              <p>※本サイトはAmazonアソシエイト・プログラムの参加者です。アフィリエイト広告を掲載しています。</p>
              <p>© 2026 AquiTCD / azik-fairy &nbsp;|&nbsp; v1.5.0 &nbsp;|&nbsp; <a href="/privacy" className="hover:opacity-100 hover:underline">PRIVACY POLICY</a></p>
            </div>
          </div>
        </FairyScreenLayout>
      )}

      {/* ステージイントロ */}
      {gameState === "STAGE_INTRO" && selectedStageId && (() => {
        const stageMeta = STAGES.find(s => s.id === selectedStageId);
        if (!stageMeta) return null;
        return (
          <AzikKeyVisualizer
            stage={stageMeta}
            onStart={handleStartFromIntro}
            layout={settings.keyboardLayout}
          />
        );
      })()}

      {/* ステージ選択 */}
      {gameState === "STAGE_SELECT" && (
        <StageSelector
          onSelectStage={startStage}
          onBackToTitle={() => setGameState("TITLE")}
          progress={progress.stageProgress}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* プレイ中 */}
      {gameState === "PLAYING" && selectedStageId && (
        <TypingGame
          stageId={selectedStageId}
          settings={settings}
          onFinish={handleFinishGame}
          onBackToStageSelect={() => setGameState("STAGE_SELECT")}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* 設定画面 */}
      {gameState === "SETTINGS" && (
        <Settings
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBackToTitle={() => setGameState("TITLE")}
          onClearProgress={handleClearProgress}
        />
      )}

      {/* ヘルプFAQ画面 */}
      {gameState === "HELP" && (
        <HelpFAQ onBackToTitle={() => setGameState("TITLE")} />
      )}

      {/* リザルト画面 - 横長レイアウト */}
      {gameState === "RESULT" && stats && (
        <FairyScreenLayout
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fairy={{ message: (resultComments as any)[stats.comment] || stats.comment, emotion: stats.rank === "PERFECT" ? "perfect" : stats.rank === "A" ? "proud" : "happy" }}
          fairyColClassName="animate-in fade-in zoom-in-95 duration-500 flex flex-col gap-4"
          fairySlot={<AdBanner ads={resultAds} layout="vertical" />}
        >
          {/* 左カラム: スコアとボタン */}
          <div className="flex-1 flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl font-bold tracking-widest border-b-2 border-green-500 pb-2 w-full font-pixel text-center">
              = RESULT =
            </h2>

            <div className="flex flex-col gap-3 w-full bg-zinc-950 border-2 border-green-500 p-5 rounded text-base shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] font-pixel">
              <div className="flex justify-between">
                <span>TIME ELAPSED:</span>
                <span className="font-bold text-green-300">{stats.time.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span>KEYS TYPED:</span>
                <span className="font-bold text-green-300">{stats.totalKeys}</span>
              </div>
              <div className="flex justify-between">
                <span>SPEED (WPM):</span>
                <span className="font-bold text-yellow-300">{stats.wpm}</span>
              </div>
              <div className="flex justify-between">
                <span>ACCURACY:</span>
                <span className="font-bold text-yellow-300">{stats.accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span>MISS COUNT:</span>
                <span className="font-bold text-red-400">{stats.missCount}</span>
              </div>
              <div className="flex justify-between border-t border-green-800 pt-2 mt-1">
                <span>AZIK RATIO:</span>
                <span className="font-bold text-cyan-300">{stats.azikRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span>SAVED KEYS:</span>
                <span className="font-bold text-cyan-300">{stats.savedKeys}</span>
              </div>
            </div>

            {/* ボタン群 */}
            {(() => {
              const stageMeta = selectedStageId ? STAGES.find(s => s.id === selectedStageId) : null;
              const stageTitle = stageMeta?.name ?? selectedStageId ?? "";
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              // Lev1-4 は常に training シェア。Practice/Challenge は settings.isTraining で決まる。
              const isPracticeOrChallengeStage = stageMeta?.category === "Practice" || stageMeta?.category === "Challenge";
              const isTrainingShare = !isPracticeOrChallengeStage || settings.isTraining;

              const shareClass = "w-full font-pixel font-bold tracking-wider rounded transition-all duration-150 bg-sky-950 text-sky-300 border-2 border-sky-500 hover:bg-sky-500 hover:text-white focus:bg-sky-500 focus:text-white focus:outline-none px-6 py-4 flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
              const XIcon = () => (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              );

              const tweetUrl = (() => {
                const rank = stats.rank;
                const rankLabel = rank === "PERFECT" ? "✦PERFECT✦" : `${rank}ランク`;
                if (isTrainingShare) {
                  const shareParams = new URLSearchParams({ theme: "af", title: stageTitle, rank, training: "true" });
                  const tweetText = `AZIKタイピング養成妖精 #AZIK_Fairy でトレーニング中！\nステージ: 「${stageTitle}」\n【 ${rankLabel} 】`;
                  return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(`${origin}/share?${shareParams}`)}`;
                }
                const shareParams = new URLSearchParams({
                  theme: "af", wpm: String(stats.wpm), acc: String(stats.accuracy),
                  azik: String(stats.azikRatio), title: stageTitle, rank, comment: stats.comment,
                });
                const tweetText = `AZIKタイピング養成妖精 #AZIK_Fairy でスコアアタック！\nステージ: 「${stageTitle}」\n【 ${rankLabel} 】\nスピード: ${stats.wpm} WPM | 正確率: ${stats.accuracy}% | AZIK率: ${stats.azikRatio}%`;
                return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(`${origin}/share?${shareParams}`)}`;
              })();

              return (
                <KeyNavGroup className="flex flex-col gap-3 w-full">
                  <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className={shareClass}>
                    <XIcon />
                    <span className="text-sm">{isTrainingShare ? "POST TRAINING" : "POST RESULT"}</span>
                  </a>
                  {selectedStageId && getNextStageId(selectedStageId) && (
                    <GameButton variant="primary" size="md" onClick={() => startStage(getNextStageId(selectedStageId)!)} className="w-full">
                      NEXT STAGE &gt;
                    </GameButton>
                  )}
                  {selectedStageId && (
                    <GameButton variant="secondary" size="md" onClick={() => startStage(selectedStageId)} className="w-full">
                      RETRY STAGE
                    </GameButton>
                  )}
                  <GameButton variant="ghost" size="sm" onClick={() => setGameState("STAGE_SELECT")} className="w-full">
                    STAGE SELECT
                  </GameButton>
                  <GameButton variant="danger" size="sm" onClick={() => setGameState("TITLE")} className="w-full">
                    BACK TO TITLE
                  </GameButton>
                </KeyNavGroup>
              );
            })()}

          </div>
        </FairyScreenLayout>
      )}
    </main>
  );
}
