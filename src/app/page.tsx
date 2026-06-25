"use client";

import React, { useState, useEffect } from "react";
import { getRandomAds } from "@/data/adData";
import { calcStars, calcStreak, getWeaknessRanking, mergeWeaknessStats, mergeSessionHistory } from "@/utils/gameLogic";
import { STAGES } from "@/data/stages";
import { loadStage } from "@/data/stages";
import { createTypingWord, TypingWord } from "@/data/azikRules";
import StageSelector from "@/components/StageSelector";
import Settings from "@/components/Settings";
import TypingGame from "@/components/TypingGame";
import HelpFAQ from "@/components/HelpFAQ";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";
import AdBanner from "@/components/AdBanner";
import KeyNavGroup from "@/components/KeyNavGroup";
import AzikKeyVisualizer from "@/components/AzikKeyVisualizer";
import StatsScreen from "@/components/StatsScreen";
import TimeAttackGame from "@/components/TimeAttackGame";
import ModeButton from "@/components/ModeButton";
import ResultScreen from "@/components/ResultScreen";
import { GameStats, GameSettings, UserProgress, GameState, TimeAttackBest } from "@/types/game";
import { WEAKNESS_STAGE_ID, SETTINGS_STORAGE_KEY } from "@/constants/game";
import { useProgressStorage } from "@/hooks/useProgressStorage";
import { migrateSettings } from "@/utils/settingsMigration";
import { useUserDictConfig } from "@/hooks/useUserDictConfig";

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

const DEFAULT_SETTINGS: GameSettings = {
  isTraining: true,
  isFullTraining: false,
  showGuide: true,
  showTable: true,
  keyboardLayout: "JIS",
  soundTheme: "soft",
  soundVolume: 0,
  wordsPerSession: 30,
  ghostRaceEnabled: true,
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("TITLE");
  const [flowMode, setFlowMode] = useState<"training" | "challenge">("training");
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const { progress, saveProgress, clearProgress, load: loadProgress } = useProgressStorage();
  const { effectiveDict, config: userDictConfig, importTable, setKanaKeys, reset: resetUserDict, isCustomized } = useUserDictConfig();
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);

  const [titleAds] = useState(() => getRandomAds(2));
  const [resultAds] = useState(() => getRandomAds(2));

  // 弱点練習用の単語（非同期ロード）
  const [weaknessWords, setWeaknessWords] = useState<TypingWord[] | null>(null);


  // 1. マウント時に LocalStorage から設定と進捗を復元
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(migrateSettings(parsed, DEFAULT_SETTINGS));
      } catch (e) {
        console.error("Failed to load settings from localStorage:", e);
      }
    }
    loadProgress();
  }, [loadProgress]);

  // 弱点単語のロード（弱点練習ステージ選択時）
  useEffect(() => {
    if (selectedStageId !== WEAKNESS_STAGE_ID) return;
    setWeaknessWords(null);
    const weaknessKeys = getWeaknessRanking(progress.weaknessStats);
    loadStage("practice-words-1").then(stage => {
      const filtered = stage.words
        .filter(w => {
          const word = createTypingWord(w.kanji, w.kana, effectiveDict);
          return word.segments.some(seg =>
            seg.azik.some(pattern =>
              weaknessKeys.some(wk => pattern.includes(wk))
            )
          );
        })
        .slice(0, 30);
      const words = filtered.map(w => createTypingWord(w.kanji, w.kana, effectiveDict));
      setWeaknessWords(words.length > 0 ? words : null);
    });
  }, [selectedStageId]);

  // 2. 設定変更時に LocalStorage に自動保存
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
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
    setSelectedStageId(WEAKNESS_STAGE_ID);
    setGameState("PLAYING");
  };

  const handleStartFromIntro = (markAsSeen: boolean) => {
    if (!selectedStageId) return;
    if (markAsSeen) {
      saveProgress({ ...progress, seenStageIntros: [...progress.seenStageIntros, selectedStageId] });
    }
    setGameState("PLAYING");
  };

  const handleClearProgress = () => {
    if (confirm("すべてのスコアと進捗を削除しますか？この操作は元に戻せません。")) {
      clearProgress();
    }
  };

  const handleResetStageIntros = () => {
    saveProgress({ ...progress, seenStageIntros: [] });
  };

  const handleFinishGame = (gameStats: GameStats) => {
    setStats(gameStats);
    setGameState("RESULT");

    if (!selectedStageId) return;

    const todayStr = new Date().toLocaleDateString("sv-SE");
    const newStreak = calcStreak(progress.lastPlayDate, todayStr, progress.streak);

    // 弱点ステージはstageProgressに記録しない
    const isWeaknessStage = selectedStageId === WEAKNESS_STAGE_ID;
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

    saveProgress(newProgress);
  };

  // ⑤ タイムアタック終了ハンドラ
  const handleTimeAttackFinish = (result: { wpm: number; accuracy: number }) => {
    const todayStr = new Date().toLocaleDateString("sv-SE");
    const newBest: TimeAttackBest = progress.timeAttackBest
      ? (result.wpm > progress.timeAttackBest.wpm
          ? { wpm: result.wpm, accuracy: result.accuracy, date: todayStr }
          : progress.timeAttackBest)
      : { wpm: result.wpm, accuracy: result.accuracy, date: todayStr };

    saveProgress({ ...progress, timeAttackBest: newBest });
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
              <p>© 2026 AquiTCD / azik-fairy &nbsp;|&nbsp; v1.10.1 &nbsp;|&nbsp; <a href="/privacy" className="hover:opacity-100 hover:underline">PRIVACY POLICY</a></p>
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
              <ModeButton color="green" title="TRAINING" subtitle="AZIKの練習・レッスン"
                onClick={() => { setFlowMode("training"); handleUpdateSettings({ ...settings, isTraining: true }); setGameState("STAGE_SELECT"); }} />
              <ModeButton color="yellow" title="CHALLENGE" subtitle="スコア計測・STATS記録"
                onClick={() => { setFlowMode("challenge"); handleUpdateSettings({ ...settings, isTraining: false }); setGameState("STAGE_SELECT"); }} />
              <ModeButton color="sky" title="TIME ATTACK" subtitle="1分間AZIK速度測定"
                onClick={() => setGameState("TIME_ATTACK")} />
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
            soundVolume={settings.soundVolume}
            soundTheme={settings.soundTheme}
            onVolumeChange={v => handleUpdateSettings({ ...settings, soundVolume: v })}
            layout={settings.keyboardLayout}
            effectiveDict={effectiveDict}
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
          effectiveDict={effectiveDict}
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
            selectedStageId !== WEAKNESS_STAGE_ID
              ? progress.stageProgress[selectedStageId]?.bestWpm
              : undefined
          }
          weaknessOverrideWords={
            selectedStageId === WEAKNESS_STAGE_ID
              ? (weaknessWords ?? undefined)
              : undefined
          }
          effectiveDict={effectiveDict}
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
          onImportTable={importTable}
          onSetKanaKeys={setKanaKeys}
          onResetUserDict={resetUserDict}
          isCustomized={isCustomized}
          userDictConfig={userDictConfig}
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
          effectiveDict={effectiveDict}
        />
      )}

      {/* リザルト画面 */}
      {gameState === "RESULT" && stats && (
        <ResultScreen
          stats={stats}
          selectedStageId={selectedStageId}
          settings={settings}
          resultAds={resultAds}
          onStartStage={startStage}
          onStartWeaknessPractice={handleStartWeaknessPractice}
          onGoToStageSelect={() => setGameState("STAGE_SELECT")}
          onGoToTitle={() => setGameState("TITLE")}
        />
      )}
    </main>
  );
}
