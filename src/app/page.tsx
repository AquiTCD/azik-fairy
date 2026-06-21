"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getRandomAds } from "@/data/adData";
import { calcStars, calcStreak, getNextStageId, getWeaknessRanking, mergeWeaknessStats, mergeSessionHistory } from "@/utils/gameLogic";
import { STAGES } from "@/data/stages";
import { loadStage } from "@/data/stages";
import { mergeCustomAzikRules, createTypingWord, TypingWord } from "@/data/azikRules";
import StageSelector from "@/components/StageSelector";
import Settings from "@/components/Settings";
import TypingGame from "@/components/TypingGame";
import HelpFAQ from "@/components/HelpFAQ";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";
import AdBanner from "@/components/AdBanner";
import KeyNavGroup from "@/components/KeyNavGroup";
import AzikKeyVisualizer from "@/components/AzikKeyVisualizer";
import KeyboardDiagram from "@/components/KeyboardDiagram";
import StatsScreen from "@/components/StatsScreen";
import TimeAttackGame from "@/components/TimeAttackGame";
import { GameStats, GameSettings, StageProgress, UserProgress, GameState, TimeAttackBest } from "@/types/game";
import { buildTweetUrl } from "@/utils/tweetUtils";
import resultComments from "../../public/data/result_comments.json";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function getTitleFairyMessage(totalKeysTyped: number, streak: number): string {
  if (totalKeysTyped === 0) {
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
  if (streak > 1) {
    const streakMsgs = [
      `連続${streak}日目とかマジでリスペクトなんだけど！🔥`,
      `${streak}日連続練習！その継続力、天才みが深いわ！💅`,
      `連続${streak}日！AZIKへの本気度えぐすぎ！🏆`,
    ];
    lines.push(streakMsgs[Math.floor(Math.random() * streakMsgs.length)]);
  }
  if (totalKeysTyped >= 10000) {
    const bigMsgs = [
      `累計${totalKeysTyped.toLocaleString()}打鍵突破！もうAZIK中毒系でしょ！⭐👑`,
      `打鍵数${totalKeysTyped.toLocaleString()}回！指の筋肉が別格になってるよ！💎🔥`,
    ];
    lines.push(bigMsgs[Math.floor(Math.random() * bigMsgs.length)]);
  } else if (totalKeysTyped >= 1000) {
    const midMsgs = [
      `累計${totalKeysTyped.toLocaleString()}打鍵突破！いい感じに指が馴染んできたね！💎`,
      `${totalKeysTyped.toLocaleString()}打鍵！着実に上手くなってるの感じてる！✨`,
    ];
    lines.push(midMsgs[Math.floor(Math.random() * midMsgs.length)]);
  }
  return lines.join("\n");
}

const LEV_CATS = new Set(["Lev1", "Lev2a", "Lev2b", "Lev3a", "Lev3b", "Lev4"]);
const LEV_STAGES = STAGES.filter(s => LEV_CATS.has(s.category));
const LEV_TOTAL = LEV_STAGES.length;

function TitleProgressBar({ stageProgress, totalKeysTyped, streak }: {
  stageProgress: UserProgress["stageProgress"];
  totalKeysTyped: number;
  streak: number;
}) {
  const levCleared = LEV_STAGES.filter(s => (stageProgress[s.id]?.stars ?? 0) >= 2).length;
  const pct = Math.round((levCleared / LEV_TOTAL) * 100);
  return (
    <div className="text-[10px] md:text-xs font-pixel text-green-300 border border-green-800 bg-zinc-950/80 px-4 py-2 rounded w-full flex flex-col gap-2 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]">
      {totalKeysTyped > 0 && (
        <div className="flex justify-around">
          <div>TOTAL KEYS: <span className="font-bold text-yellow-400">{totalKeysTyped.toLocaleString()}</span></div>
          <div>STREAK: <span className="font-bold text-yellow-400">{streak} DAYS</span></div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700">
          <div
            className="h-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="whitespace-nowrap shrink-0">
          <span className="font-bold text-yellow-400">{levCleared}</span> / {LEV_TOTAL} STAGES
        </span>
      </div>
    </div>
  );
}

const SHARE_BTN_CLASS = "w-full font-pixel font-bold tracking-wider rounded transition-all duration-150 bg-sky-950 text-sky-300 border-2 border-sky-500 hover:bg-sky-500 hover:text-white focus:bg-sky-500 focus:text-white focus:outline-none px-6 py-4 flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

const STORAGE_KEY = "azik-fairy-settings";
const PROGRESS_STORAGE_KEY = "azik-fairy-progress";
const WEAKNESS_PRACTICE_STAGE_ID = "__weakness__";

const DEFAULT_SETTINGS: GameSettings = {
  isTraining: true,
  isFullTraining: false,
  showGuide: true,
  showTable: true,
  customRules: {},
  keyboardLayout: "JIS",
  soundEnabled: false,
  soundTheme: "soft",
  wordsPerSession: 30,
  enableSpecial: true,
  enableForeign: true,
  nAlternative: "left",
  ghostRaceEnabled: true,
};

const DEFAULT_PROGRESS: UserProgress = {
  stageProgress: {},
  totalKeysTyped: 0,
  lastPlayDate: "",
  streak: 0,
  seenStageIntros: [],
  weaknessStats: {},
  sessionHistory: [],
  timeAttackBest: null,
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("TITLE");
  const [flowMode, setFlowMode] = useState<"training" | "challenge">("training");
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);

  const [titleAds] = useState(() => getRandomAds(2));
  const [resultAds] = useState(() => getRandomAds(2));

  // 弱点練習用の単語（非同期ロード）
  const [weaknessWords, setWeaknessWords] = useState<TypingWord[] | null>(null);

  // カスタム辞書（page.tsx 内で弱点単語フィルタに使用）
  const customDictionary = useMemo(() => mergeCustomAzikRules(settings.customRules, {
    enableSpecial: settings.enableSpecial,
    enableForeign: settings.enableForeign,
    nAlternative: settings.nAlternative,
  }), [settings.customRules, settings.enableSpecial, settings.enableForeign, settings.nAlternative]);

  // 1. マウント時に LocalStorage から設定と進捗を復元
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.customRules) {
          const migrated: Record<string, string[]> = {};
          for (const [k, v] of Object.entries(parsed.customRules)) {
            if (typeof v === "string") migrated[k] = [v];
            else if (Array.isArray(v)) migrated[k] = v as string[];
          }
          parsed.customRules = migrated;
        }
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
        setProgress({ ...DEFAULT_PROGRESS, ...parsed });
      } catch (e) {
        console.error("Failed to load progress from localStorage:", e);
      }
    }
  }, []);

  // 弱点単語のロード（弱点練習ステージ選択時）
  useEffect(() => {
    if (selectedStageId !== WEAKNESS_PRACTICE_STAGE_ID) return;
    setWeaknessWords(null);
    const weaknessKeys = getWeaknessRanking(progress.weaknessStats);
    loadStage("practice-words-1").then(stage => {
      const filtered = stage.words
        .filter(w => {
          const word = createTypingWord(w.kanji, w.kana, customDictionary);
          return word.segments.some(seg =>
            seg.azik.some(pattern =>
              weaknessKeys.some(wk => pattern.includes(wk))
            )
          );
        })
        .slice(0, 30);
      const words = filtered.map(w => createTypingWord(w.kanji, w.kana, customDictionary));
      setWeaknessWords(words.length > 0 ? words : null);
    });
  }, [selectedStageId]);

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

  const handleStartWeaknessPractice = () => {
    setSelectedStageId(WEAKNESS_PRACTICE_STAGE_ID);
    setGameState("PLAYING");
  };

  const handleStartFromIntro = (markAsSeen: boolean) => {
    if (!selectedStageId) return;
    if (markAsSeen) {
      const newSeen = [...progress.seenStageIntros, selectedStageId];
      const newProgress = { ...progress, seenStageIntros: newSeen };
      setProgress(newProgress);
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
    }
    setGameState("PLAYING");
  };

  const handleClearProgress = () => {
    if (confirm("すべてのスコアと進捗を削除しますか？この操作は元に戻せません。")) {
      setProgress(DEFAULT_PROGRESS);
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    }
  };

  const handleResetStageIntros = () => {
    const newProgress = { ...progress, seenStageIntros: [] };
    setProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  };

  const handleFinishGame = (gameStats: GameStats) => {
    setStats(gameStats);
    setGameState("RESULT");

    if (!selectedStageId) return;

    const todayStr = new Date().toLocaleDateString("sv-SE");
    const newStreak = calcStreak(progress.lastPlayDate, todayStr, progress.streak);

    // 弱点ステージはstageProgressに記録しない
    const isWeaknessStage = selectedStageId === WEAKNESS_PRACTICE_STAGE_ID;
    const stage = isWeaknessStage ? null : STAGES.find(s => s.id === selectedStageId);

    const updatedStageProgress = isWeaknessStage
      ? progress.stageProgress
      : (() => {
          const stars = calcStars(gameStats.accuracy, gameStats.wpm);
          const current = progress.stageProgress[selectedStageId] || { stars: 0, bestWpm: 0, bestAccuracy: 0, bestTime: Infinity };
          return {
            ...progress.stageProgress,
            [selectedStageId]: {
              stars: Math.max(current.stars, stars),
              bestWpm: Math.max(current.bestWpm, gameStats.wpm),
              bestAccuracy: Math.max(current.bestAccuracy, gameStats.accuracy),
              bestTime: Math.min(current.bestTime, gameStats.time),
            },
          };
        })();

    // ① 弱点統計の更新（Practice + 弱点練習）
    let updatedWeaknessStats = progress.weaknessStats;
    if ((stage?.category === "Practice" || isWeaknessStage) && gameStats.keyHeatmap && Object.keys(gameStats.keyHeatmap).length > 0) {
      updatedWeaknessStats = mergeWeaknessStats(
        progress.weaknessStats,
        gameStats.keyHeatmap,
        settings.isTraining ? "strict" : "typo",
        todayStr
      );
    }

    // ④ sessionHistory の更新（チャレンジモード × Practice / Challenge のみ）
    let updatedSessionHistory = progress.sessionHistory;
    if (!settings.isTraining && (stage?.category === "Practice" || stage?.category === "Challenge")) {
      updatedSessionHistory = mergeSessionHistory(
        progress.sessionHistory,
        todayStr,
        gameStats.wpm,
        gameStats.accuracy,
        gameStats.azikRatio,
      );
    }

    const newProgress: UserProgress = {
      ...progress,
      stageProgress: updatedStageProgress,
      totalKeysTyped: progress.totalKeysTyped + gameStats.totalKeys,
      lastPlayDate: todayStr,
      streak: newStreak,
      weaknessStats: updatedWeaknessStats,
      sessionHistory: updatedSessionHistory,
    };

    setProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  };

  // ⑤ タイムアタック終了ハンドラ
  const handleTimeAttackFinish = (result: { wpm: number; accuracy: number }) => {
    const todayStr = new Date().toLocaleDateString("sv-SE");
    const newBest: TimeAttackBest = progress.timeAttackBest
      ? (result.wpm > progress.timeAttackBest.wpm
          ? { wpm: result.wpm, accuracy: result.accuracy, date: todayStr }
          : progress.timeAttackBest)
      : { wpm: result.wpm, accuracy: result.accuracy, date: todayStr };

    const newProgress = { ...progress, timeAttackBest: newBest };
    setProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  };

  if (!isMounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 font-pixel text-green-500">
        LOADING ENGINE...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-zinc-950 font-sans">

      {/* タイトル画面 */}
      {gameState === "TITLE" && (
        <FairyScreenLayout fairy={{ emotion: "idle", message: getTitleFairyMessage(progress.totalKeysTyped, progress.streak) }}>
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

            <TitleProgressBar
              stageProgress={progress.stageProgress}
              totalKeysTyped={progress.totalKeysTyped}
              streak={progress.streak}
            />

            <KeyNavGroup className="flex flex-col gap-4 w-full max-w-xs">
              <GameButton variant="primary" size="lg" onClick={() => setGameState("MODE_SELECT")} className="w-full">
                GAME START
              </GameButton>
              <GameButton variant="secondary" size="md" onClick={() => setGameState("SETTINGS")} className="w-full">
                OPTIONS
              </GameButton>
              <div className="flex gap-2 w-full">
                <GameButton variant="ghost" size="sm" onClick={() => setGameState("STATS")} className="flex-1 py-2">
                  STATS
                </GameButton>
                <GameButton variant="ghost" size="sm" onClick={() => setGameState("HELP")} className="flex-1 py-2">
                  HOW TO PLAY
                </GameButton>
              </div>
            </KeyNavGroup>

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
              <p>© 2026 AquiTCD / azik-fairy &nbsp;|&nbsp; v1.8.0 &nbsp;|&nbsp; <a href="/privacy" className="hover:opacity-100 hover:underline">PRIVACY POLICY</a></p>
            </div>
          </div>
        </FairyScreenLayout>
      )}

      {/* モード選択 */}
      {gameState === "MODE_SELECT" && (
        <FairyScreenLayout fairy={{ emotion: "idle", message: "どのモードで遊ぶ？TRAININGはAZIKを練習するモード、CHALLENGEはスコアを記録するモードだよ！⚡" }}>
          <div className="flex-1 flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold tracking-widest border-b-2 border-green-500 pb-2 w-full font-pixel text-center">
              = SELECT MODE =
            </h2>
            <KeyNavGroup className="flex flex-col gap-4 w-full">
              <button
                onClick={() => { setFlowMode("training"); handleUpdateSettings({ ...settings, isTraining: true }); setGameState("STAGE_SELECT"); }}
                className="w-full flex flex-col items-center gap-1 font-pixel font-bold tracking-wider bg-zinc-900 text-green-300 border-4 border-green-500 hover:bg-green-950 focus:bg-green-950 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-zinc-900 px-6 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 cursor-pointer"
              >
                <span className="text-xl">TRAINING</span>
                <span className="text-[10px] text-green-500 font-sans font-normal">AZIKの練習・レッスン</span>
              </button>
              <button
                onClick={() => { setFlowMode("challenge"); handleUpdateSettings({ ...settings, isTraining: false }); setGameState("STAGE_SELECT"); }}
                className="w-full flex flex-col items-center gap-1 font-pixel font-bold tracking-wider bg-zinc-900 text-yellow-300 border-4 border-yellow-500 hover:bg-yellow-950 focus:bg-yellow-950 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-zinc-900 px-6 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 cursor-pointer"
              >
                <span className="text-xl">CHALLENGE</span>
                <span className="text-[10px] text-yellow-500 font-sans font-normal">スコア計測・STATS記録</span>
              </button>
              <button
                onClick={() => setGameState("TIME_ATTACK")}
                className="w-full flex flex-col items-center gap-1 font-pixel font-bold tracking-wider bg-zinc-900 text-sky-300 border-4 border-sky-500 hover:bg-sky-950 focus:bg-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-zinc-900 px-6 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 cursor-pointer"
              >
                <span className="text-xl">TIME ATTACK</span>
                <span className="text-[10px] text-sky-500 font-sans font-normal">1分間AZIK速度測定</span>
              </button>
              <GameButton variant="danger" size="sm" onClick={() => setGameState("TITLE")} className="w-full">
                BACK TO TITLE
              </GameButton>
            </KeyNavGroup>
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
            onBackToStageSelect={() => setGameState("STAGE_SELECT")}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
            layout={settings.keyboardLayout}
          />
        );
      })()}

      {/* ステージ選択 */}
      {gameState === "STAGE_SELECT" && (
        <StageSelector
          onSelectStage={startStage}
          onBackToTitle={() => setGameState("MODE_SELECT")}
          flowMode={flowMode}
          progress={progress.stageProgress}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          weaknessStats={progress.weaknessStats}
          onStartWeaknessPractice={handleStartWeaknessPractice}
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
          ghostBestWpm={
            selectedStageId !== WEAKNESS_PRACTICE_STAGE_ID
              ? progress.stageProgress[selectedStageId]?.bestWpm
              : undefined
          }
          weaknessOverrideWords={
            selectedStageId === WEAKNESS_PRACTICE_STAGE_ID
              ? (weaknessWords ?? undefined)
              : undefined
          }
        />
      )}

      {/* 設定画面 */}
      {gameState === "SETTINGS" && (
        <Settings
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBackToTitle={() => setGameState("TITLE")}
          onClearProgress={handleClearProgress}
          onResetStageIntros={handleResetStageIntros}
        />
      )}

      {/* ヘルプFAQ画面 */}
      {gameState === "HELP" && (
        <HelpFAQ onBackToTitle={() => setGameState("TITLE")} />
      )}

      {/* ④ 成長グラフ */}
      {gameState === "STATS" && (
        <StatsScreen
          sessionHistory={progress.sessionHistory}
          onBackToTitle={() => setGameState("TITLE")}
        />
      )}

      {/* ⑤ タイムアタック */}
      {gameState === "TIME_ATTACK" && (
        <TimeAttackGame
          settings={settings}
          onFinish={handleTimeAttackFinish}
          onBack={() => setGameState("TITLE")}
          prevBest={progress.timeAttackBest}
        />
      )}

      {/* リザルト画面 */}
      {gameState === "RESULT" && stats && (
        <FairyScreenLayout
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fairy={{ message: (resultComments as any)[stats.comment] || stats.comment, emotion: stats.rank === "PERFECT" ? "perfect" : stats.rank === "A" ? "proud" : "happy" }}
          fairyColClassName="animate-in fade-in zoom-in-95 duration-500 flex flex-col gap-4"
          fairySlot={
            <>
              {/* ③ キーヒートマップ（フェアリーの下） */}
              {stats.keyHeatmap && (() => {
                const hasHeat = Object.values(stats.keyHeatmap).some(e => e.attempt >= 3 && e.miss / e.attempt >= 0.2);
                return hasHeat ? (
                  <div className="w-full">
                    <p className="text-[10px] font-pixel text-zinc-400 mb-1 text-center">= KEY HEATMAP =</p>
                    <KeyboardDiagram
                      activeKeys={[]}
                      layout={settings.keyboardLayout}
                      showLegend={true}
                      heatmap={stats.keyHeatmap}
                      compact={true}
                    />
                  </div>
                ) : null;
              })()}
              <AdBanner ads={resultAds} layout="vertical" />
            </>
          }
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
              const isWeaknessResult = selectedStageId === WEAKNESS_PRACTICE_STAGE_ID;
              const stageMeta = selectedStageId && !isWeaknessResult ? STAGES.find(s => s.id === selectedStageId) : null;
              const stageTitle = stageMeta?.name ?? (isWeaknessResult ? "弱点練習" : selectedStageId ?? "");
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              const isPracticeOrChallengeStage = stageMeta?.category === "Practice" || stageMeta?.category === "Challenge";
              const isTrainingShare = !isPracticeOrChallengeStage || settings.isTraining;
              const tweetUrl = buildTweetUrl(stats, stageTitle, isTrainingShare, origin);

              return (
                <KeyNavGroup className="flex flex-col gap-3 w-full">
                  <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className={SHARE_BTN_CLASS}>
                    <XIcon />
                    <span className="text-sm">{isTrainingShare ? "POST TRAINING" : "POST RESULT"}</span>
                  </a>
                  {!isWeaknessResult && selectedStageId && getNextStageId(selectedStageId) && (
                    <GameButton variant="primary" size="md" onClick={() => startStage(getNextStageId(selectedStageId)!)} className="w-full">
                      NEXT STAGE &gt;
                    </GameButton>
                  )}
                  {selectedStageId && (
                    <GameButton variant="secondary" size="md" onClick={() => {
                      if (isWeaknessResult) {
                        handleStartWeaknessPractice();
                      } else {
                        startStage(selectedStageId);
                      }
                    }} className="w-full">
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
