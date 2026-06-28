"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { loadSkkStage } from "@/data/stages";
import type { SkkStageData, SkkTypingWord, SkkKey } from "@/data/skkRules";
import { flattenSentences } from "@/data/skkRules";
import type { AzikMapping } from "@/data/azikRules";
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
  effectiveDict?: Record<string, AzikMapping>;
  onFinish: (stats: GameStats) => void;
  onBackToStageSelect: () => void;
  onUpdateSettings: (s: GameSettings) => void;
}

// ---------- 小コンポーネント ----------

function KeyChip({ skkKey, active, done }: { skkKey: SkkKey; active: boolean; done: boolean }) {
  const label = skkKey.shift ? `Shift+${skkKey.key.toUpperCase()}` : skkKey.key.toUpperCase();
  const base = "inline-flex items-center px-2 py-1 rounded text-sm font-mono font-bold border transition-all";
  const color = done
    ? "border-green-600 bg-green-900/40 text-green-400"
    : active
    ? "border-yellow-400 bg-yellow-900/60 text-yellow-200 shadow-md shadow-yellow-500/30 scale-110"
    : "border-slate-600 bg-slate-800/40 text-slate-400";
  return <span className={`${base} ${color}`}>{label}</span>;
}

/** 文全体を表示し、現在のセグメント(target)をハイライト */
function SentenceDisplay({ sentence, target, completed }: { sentence: string; target: string; completed?: boolean }) {
  const idx = sentence.indexOf(target);
  if (idx === -1) return <span className="text-slate-300 text-xl md:text-2xl">{sentence}</span>;
  return (
    <span className="text-xl md:text-2xl">
      <span className={completed ? "text-green-400" : "text-slate-400"}>{sentence.slice(0, idx)}</span>
      <span className="text-white font-bold underline decoration-yellow-400 decoration-2 underline-offset-4">
        {target}
      </span>
      <span className="text-slate-500">{sentence.slice(idx + target.length)}</span>
    </span>
  );
}

/** セグメント種別をSkkTypingWordのフィールドから推定 */
function getSegmentType(word: SkkTypingWord): "hiragana" | "kanji" | "okurigana" {
  if (word.okurigana !== "") return "okurigana";
  if (word.reading !== "") return "kanji";
  return "hiragana";
}

function SegmentDetail({ word, keyIndex }: { word: SkkTypingWord; keyIndex: number }) {
  const type = getSegmentType(word);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* 単語表示 */}
      <div className="text-3xl md:text-4xl font-bold mt-1">
        {type === "hiragana" ? (
          <span className="text-slate-200">{word.display}</span>
        ) : type === "kanji" ? (
          <ruby>
            <span className="text-white">{word.display}</span>
            <rt className="text-xs text-green-300 tracking-normal select-none">{word.reading}</rt>
          </ruby>
        ) : (
          /* okurigana */
          <>
            <ruby>
              <span className="text-white">{word.display.replace(word.okurigana, "")}</span>
              <rt className="text-xs text-green-300 tracking-normal select-none">{word.reading}</rt>
            </ruby>
            <span className="text-green-200">{word.okurigana}</span>
          </>
        )}
      </div>

      {/* okurigana のみ reading/okuri ラベルを表示 */}
      {type === "okurigana" && (
        <div className="flex gap-4 text-xs text-slate-400">
          <span>読み: <span className="text-cyan-300">{word.reading}</span></span>
          <span>送り: <span className="text-yellow-300">{word.okurigana}</span></span>
          <span className="text-slate-500">
            {word.inputType === "azik-okuri" ? "AZIK <okuri>" : "標準SKK"}
          </span>
        </div>
      )}

      {/* キーチップ */}
      <div className="flex gap-2 items-center flex-wrap justify-center">
        {word.keys.map((k, i) => (
          <KeyChip key={i} skkKey={k} active={i === keyIndex} done={i < keyIndex} />
        ))}
      </div>

      {/* ヒント */}
      <div className="text-xs text-slate-500">{word.hint}</div>
    </div>
  );
}

// ---------- メインコンポーネント ----------

export default function SkkTypingGame({
  stageId,
  settings,
  effectiveDict,
  onFinish,
  onBackToStageSelect,
  onUpdateSettings,
}: SkkTypingGameProps) {
  const [stage, setStage] = useState<SkkStageData | null>(null);
  const [started, setStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fairy, setFairy] = useState<{ message: string; emotion: FairyEmotion }>({
    message: "文章全体をSKK + AZIKで入力しよう！Shiftのタイミングが肝心✨",
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

  // sentences → 平坦化した SkkTypingWord[]（hookに渡す）
  const words: SkkTypingWord[] = useMemo(
    () => (stage ? flattenSentences(stage.sentences, effectiveDict) : []),
    [stage, effectiveDict],
  );

  // 各文の開始インデックスを記録
  const sentenceBoundaries = useMemo(() => {
    if (!stage) return [];
    let idx = 0;
    return stage.sentences.map(s => {
      const start = idx;
      idx += s.segments.length;
      return { start, end: idx - 1, text: s.text };
    });
  }, [stage]);

  const { currentWordIndex, currentKeyIndex, isMiss, isCompleted, stats, handleKeyDown, reset } =
    useSkkTypingInput(words);

  // 現在の文
  const currentSentenceMeta = sentenceBoundaries.find(
    b => currentWordIndex >= b.start && currentWordIndex <= b.end,
  );
  const currentSentenceIdx = sentenceBoundaries.findIndex(
    b => currentWordIndex >= b.start && currentWordIndex <= b.end,
  );

  // ゲーム完了
  useEffect(() => {
    if (!isCompleted || !started) return;
    if (timerRef.current) clearInterval(timerRef.current);
    playStageClear();
    setFairy({ message: "全文コンプリート！SKK + AZIKの文章入力、マスターしてきたね！💎", emotion: "perfect" });

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
    timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
  }, []);

  // キーイベント
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

  // 正誤フィードバック
  useEffect(() => {
    if (isMiss) {
      playMiss();
      setFairy({ message: "Shiftのタイミングを確認！変換開始と送りがなで違うよ💦", emotion: "warning" });
    } else if (started) {
      // 文境界を超えたら文完了SE
      const prev = sentenceBoundaries.find(b => currentWordIndex - 1 >= b.start && currentWordIndex - 1 <= b.end);
      const curr = sentenceBoundaries.find(b => currentWordIndex >= b.start && currentWordIndex <= b.end);
      if (prev && curr && prev !== curr) {
        playWordComplete();
        setFairy({ message: "文クリア！次の文へ行こう🌟", emotion: "happy" });
      } else {
        playCorrect();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMiss, currentWordIndex, currentKeyIndex]);

  const handleReset = () => {
    reset();
    setStarted(false);
    setElapsedTime(0);
    startTimeRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setFairy({ message: "文章全体をSKK + AZIKで入力しよう！Shiftのタイミングが肝心✨", emotion: "idle" });
  };

  if (!stage) {
    return (
      <FairyScreenLayout fairy={{ message: "ステージを読み込み中…", emotion: "idle" }}>
        <div className="text-slate-400 text-center py-20">Loading...</div>
      </FairyScreenLayout>
    );
  }

  const currentWord = words[currentWordIndex];
  const totalSentences = stage.sentences.length;
  const progressPct = totalSentences > 0
    ? Math.round((currentSentenceIdx / totalSentences) * 100)
    : 0;

  return (
    <FairyScreenLayout fairy={fairy}>
      <div className="flex flex-col gap-5 w-full">
        {/* ヘッダー：進捗・タイマー・ミス */}
        <div className="flex justify-end items-center gap-4 text-sm text-slate-400">
          <span>文 {Math.min(currentSentenceIdx + 1, totalSentences)} / {totalSentences}</span>
          <span>
            {String(Math.floor(elapsedTime / 60)).padStart(2, "0")}:{String(elapsedTime % 60).padStart(2, "0")}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${isMiss ? "bg-red-900 text-red-300" : "text-slate-500"}`}>
            ミス: {stats.missCount}
          </span>
        </div>

        {/* プログレスバー（文単位） */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 文表示 */}
        <div className="px-4 py-3 bg-slate-900/60 rounded-lg border border-slate-700 min-h-[56px] flex items-center justify-center text-center">
          {currentSentenceMeta && currentWord ? (
            <SentenceDisplay
              sentence={currentSentenceMeta.text}
              target={currentWord.display}
            />
          ) : (
            <span className="text-green-400 font-pixel">COMPLETE!</span>
          )}
        </div>

        {/* セグメント詳細 */}
        <div className="min-h-[160px] flex items-center justify-center">
          {currentWord ? (
            <SegmentDetail word={currentWord} keyIndex={currentKeyIndex} />
          ) : (
            <div className="text-slate-400 text-center">完了！</div>
          )}
        </div>

        {/* 未スタート時のガイド */}
        {!started && (
          <div className="text-xs text-slate-500 text-center space-y-1 border border-slate-800 rounded-lg p-3">
            <p><span className="text-yellow-400">Shift+最初のキー</span> = 変換開始（ひらがなはそのまま）</p>
            <p><span className="text-cyan-400">Shift+最後のキー</span> = 送りがなトリガー（AZIK）</p>
            <p className="text-slate-600 mt-2">キーを押すとスタート</p>
          </div>
        )}

        {/* 底部：MODE SELECT / RESET / 音量（TypingGame 同パターン）*/}
        <div className="flex items-center justify-between mt-1">
          <GameButton variant="ghost" size="sm" onClick={onBackToStageSelect}>
            MODE SELECT
          </GameButton>
          <GameButton variant="ghost" size="sm" onClick={handleReset}>
            RESET
          </GameButton>
          <VolumeControl
            volume={settings.soundVolume}
            theme={settings.soundTheme}
            onVolumeChange={vol => onUpdateSettings({ ...settings, soundVolume: vol })}
          />
        </div>
      </div>
    </FairyScreenLayout>
  );
}
