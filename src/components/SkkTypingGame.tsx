"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { loadSkkStage } from "@/data/stages";
import type { SkkStageData, SkkTypingWord, SkkKey } from "@/data/skkRules";
import { useSkkTypingInput } from "@/hooks/useSkkTypingInput";
import type { GameSettings, GameStats } from "@/types/game";
import FairyScreenLayout from "./FairyScreenLayout";
import type { FairyEmotion } from "./FairyHelper";
import GameButton from "./GameButton";
import { useAzikSound } from "@/hooks/useAzikSound";
import VolumeControl from "@/components/VolumeControl";
import { getRank } from "@/utils/gameLogic";
import { COMMENT_IDS_BY_RANK } from "@/data/resultComments";

interface SkkTypingGameProps {
  stageId: string;
  settings: GameSettings;
  onFinish: (stats: GameStats) => void;
  onBackToStageSelect: () => void;
  onUpdateSettings: (s: GameSettings) => void;
}

function KeyChip({ skkKey, active, done }: { skkKey: SkkKey; active: boolean; done: boolean }) {
  const label = skkKey.shift
    ? `Shift+${skkKey.key.toUpperCase()}`
    : skkKey.key.toUpperCase();

  const base = "inline-flex items-center px-2 py-1 rounded text-sm font-mono font-bold border transition-all";
  const color = done
    ? "border-green-600 bg-green-900/40 text-green-400"
    : active
    ? "border-yellow-400 bg-yellow-900/60 text-yellow-200 shadow-md shadow-yellow-500/30 scale-110"
    : "border-slate-600 bg-slate-800/40 text-slate-400";

  return <span className={`${base} ${color}`}>{label}</span>;
}

function WordDisplay({ word, keyIndex }: { word: SkkTypingWord; keyIndex: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-4xl font-bold text-white">
        <ruby>
          <span className="text-white">{word.display.replace(word.okurigana, "")}</span>
          <rt className="text-xs text-green-300 tracking-normal select-none">
            {word.reading}
          </rt>
        </ruby>
        <span className="text-green-200">{word.okurigana}</span>
      </div>

      <div className="flex gap-4 text-xs text-slate-400">
        <span>読み: <span className="text-cyan-300">{word.reading}</span></span>
        <span>送り: <span className="text-yellow-300">{word.okurigana}</span></span>
        <span className="text-slate-500">
          {word.inputType === "azik-okuri" ? "AZIK <okuri>" : "標準SKK"}
        </span>
      </div>

      <div className="flex gap-2 items-center flex-wrap justify-center">
        {word.keys.map((k, i) => (
          <KeyChip key={i} skkKey={k} active={i === keyIndex} done={i < keyIndex} />
        ))}
      </div>

      <div className="text-xs text-slate-500 mt-1">{word.hint}</div>
    </div>
  );
}

export default function SkkTypingGame({
  stageId,
  settings,
  onFinish,
  onBackToStageSelect,
  onUpdateSettings,
}: SkkTypingGameProps) {
  const [stage, setStage] = useState<SkkStageData | null>(null);
  const [started, setStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fairy, setFairy] = useState<{ message: string; emotion: FairyEmotion }>({
    message: "Shiftの位置を意識してSKK送りがなを練習しよう！✨",
    emotion: "idle",
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const { playCorrect, playMiss, playWordComplete, playStageClear } = useAzikSound(
    settings.soundTheme,
    settings.soundVolume,
  );

  useEffect(() => {
    loadSkkStage(stageId).then(setStage);
  }, [stageId]);

  const words: SkkTypingWord[] = stage?.words ?? [];

  const { currentWordIndex, currentKeyIndex, isMiss, isCompleted, stats, handleKeyDown, reset } =
    useSkkTypingInput(words);

  useEffect(() => {
    if (!isCompleted || !started) return;
    if (timerRef.current) clearInterval(timerRef.current);
    playStageClear();
    setFairy({ message: "コンプリート！送りがなShiftの位置、バッチリ覚えてきたね！💎", emotion: "perfect" });

    const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : elapsedTime;
    const totalAttempts = stats.totalKeys + stats.missCount;
    const wpm = elapsed > 0 ? Math.round((stats.totalKeys / elapsed) * 60) : 0;
    const accuracy = totalAttempts > 0 ? Math.round((stats.totalKeys / totalAttempts) * 100) : 100;
    const standardTotal = words.reduce((s, w) => s + w.standardKeyCount, 0);
    const azikRatio = standardTotal > 0
      ? Math.max(0, Math.round(((standardTotal - stats.totalKeys) / standardTotal) * 100))
      : 0;
    const savedKeys = Math.max(0, standardTotal - stats.totalKeys);

    const rank = getRank(accuracy, wpm, azikRatio);
    const commentPool = COMMENT_IDS_BY_RANK[rank];
    const comment = commentPool[Math.floor(Math.random() * commentPool.length)];

    const gameStats: GameStats = {
      time: Math.round(elapsed),
      wpm,
      accuracy,
      totalKeys: stats.totalKeys,
      missCount: stats.missCount,
      azikRatio,
      rank,
      comment,
      savedKeys,
      keyHeatmap: {},
    };

    setTimeout(() => onFinish(gameStats), 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    if (!stage) return;

    const onKey = (e: KeyboardEvent) => {
      if (isCompleted) return;
      if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab", "Escape"].includes(e.key)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (!started) {
        setStarted(true);
        startTimer();
        setFairy(prev => ({ ...prev, emotion: "excited" }));
      }

      handleKeyDown(e);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, started, isCompleted, handleKeyDown, startTimer]);

  useEffect(() => {
    if (isMiss) {
      playMiss();
      setFairy({ message: "Shiftの位置に注目！変換開始と送りがなトリガーをShiftで区別するよ💦", emotion: "warning" });
    } else if (currentKeyIndex === 0 && currentWordIndex > 0) {
      playWordComplete();
      setFairy({ message: "いい感じ！Shift位置バッチリ！💎", emotion: "happy" });
    } else if (started) {
      playCorrect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMiss, currentWordIndex, currentKeyIndex]);

  const handleReset = () => {
    reset();
    setStarted(false);
    setElapsedTime(0);
    startTimeRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setFairy({ message: "Shiftの位置を意識してSKK送りがなを練習しよう！✨", emotion: "idle" });
  };

  if (!stage) {
    return (
      <FairyScreenLayout fairy={{ message: "ステージを読み込み中…", emotion: "idle" }}>
        <div className="text-slate-400 text-center py-20">Loading...</div>
      </FairyScreenLayout>
    );
  }

  const currentWord = words[currentWordIndex];
  const progressPct = words.length > 0 ? Math.round((currentWordIndex / words.length) * 100) : 0;

  return (
    <FairyScreenLayout fairy={fairy} fairySlot={
      <VolumeControl
        volume={settings.soundVolume}
        theme={settings.soundTheme}
        onVolumeChange={(vol) => onUpdateSettings({ ...settings, soundVolume: vol })}
      />
    }>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex justify-between items-center">
          <button
            onClick={onBackToStageSelect}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← 戻る
          </button>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>{currentWordIndex} / {words.length}</span>
            <span>
              {String(Math.floor(elapsedTime / 60)).padStart(2, "0")}:{String(elapsedTime % 60).padStart(2, "0")}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${isMiss ? "bg-red-900 text-red-300" : "text-slate-500"}`}>
              ミス: {stats.missCount}
            </span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="min-h-[200px] flex items-center justify-center">
          {currentWord ? (
            <WordDisplay word={currentWord} keyIndex={currentKeyIndex} />
          ) : (
            <div className="text-slate-400 text-center">完了！</div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <GameButton onClick={handleReset} variant="secondary" size="sm">
            リセット
          </GameButton>
        </div>

        {!started && (
          <div className="text-xs text-slate-500 text-center space-y-1 border border-slate-800 rounded-lg p-3">
            <p><span className="text-yellow-400">Shift+最初のキー</span> = 変換開始</p>
            <p><span className="text-cyan-400">Shift+最後のキー</span> = 送りがなトリガー</p>
            <p className="text-slate-600 mt-2">キーを押すとスタート</p>
          </div>
        )}
      </div>
    </FairyScreenLayout>
  );
}
