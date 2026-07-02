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
import KeyboardDiagram from "./KeyboardDiagram";
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
  const base = "inline-flex items-center px-2 py-1 rounded text-sm font-pixel font-bold border transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
  const color = done
    ? "border-green-600 bg-green-900/40 text-green-400"
    : active
    ? "border-yellow-400 bg-yellow-900/60 text-yellow-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-110"
    : "border-zinc-600 bg-zinc-800/40 text-zinc-400";
  return <span className={`${base} ${color}`}>{label}</span>;
}

/** 文全体を表示し、現在のセグメント(target)をハイライト */
function SentenceDisplay({ sentence, target, completed }: { sentence: string; target: string; completed?: boolean }) {
  const idx = sentence.indexOf(target);
  if (idx === -1) return <span className="text-zinc-300 text-xl md:text-2xl">{sentence}</span>;
  return (
    <span className="text-xl md:text-2xl">
      <span className={completed ? "text-green-400" : "text-zinc-400"}>{sentence.slice(0, idx)}</span>
      <span className="text-white font-bold underline decoration-yellow-400 decoration-2 underline-offset-4">
        {target}
      </span>
      <span className="text-zinc-500">{sentence.slice(idx + target.length)}</span>
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
      {/* 単語表示（常に ruby で包んで rt の有無による高さ変化を防ぐ）*/}
      <div className="text-3xl md:text-4xl font-bold mt-1">
        <ruby>
          {type === "hiragana" ? (
            <span className="text-slate-200">{word.display}</span>
          ) : type === "kanji" ? (
            <span className="text-white">{word.display}</span>
          ) : (
            <span className="text-white">{word.display.replace(word.okurigana, "")}</span>
          )}
          <rt className="text-xs text-green-300 tracking-normal select-none">
            {word.reading || " "}
          </rt>
        </ruby>
        {type === "okurigana" && (
          <span className="text-green-200">{word.okurigana}</span>
        )}
      </div>

      {/* 常に領域確保。okurigana のみ reading/okuri を表示 */}
      <div className="h-4 flex gap-4 text-xs text-zinc-400 items-center">
        {type === "okurigana" && (
          <>
            <span>読み: <span className="text-green-300">{word.reading}</span></span>
            <span>送り: <span className="text-yellow-300">{word.okurigana}</span></span>
          </>
        )}
      </div>

      {/* キーチップ */}
      <div className="flex gap-2 items-center flex-wrap justify-center">
        {word.keys.map((k, i) => (
          <KeyChip key={i} skkKey={k} active={i === keyIndex} done={i < keyIndex} />
        ))}
      </div>

      {/* ヒント */}
      <div className="text-xs text-zinc-500">{word.hint}</div>
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

  // wordsPerSession を文数として扱い、ランダム選択
  const selectedSentences = useMemo(() => {
    if (!stage) return [];
    const limit = settings.wordsPerSession;
    const all = stage.sentences;
    if (limit <= 0 || all.length <= limit) return all;
    return [...all].sort(() => Math.random() - 0.5).slice(0, limit);
  }, [stage, settings.wordsPerSession]);

  // selectedSentences → 平坦化した SkkTypingWord[]（hookに渡す）
  const words: SkkTypingWord[] = useMemo(
    () => flattenSentences(selectedSentences, effectiveDict),
    [selectedSentences, effectiveDict],
  );

  // 各文の開始インデックスを記録
  const sentenceBoundaries = useMemo(() => {
    let idx = 0;
    return selectedSentences.map(s => {
      const start = idx;
      idx += s.segments.length;
      return { start, end: idx - 1, text: s.text };
    });
  }, [selectedSentences]);

  const { currentWordIndex, currentKeyIndex, isMiss, isCompleted, stats, handleKeyDown } =
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

  if (!stage) {
    return (
      <FairyScreenLayout fairy={{ message: "ステージを読み込み中…", emotion: "idle" }}>
        <div className="text-slate-400 text-center py-20">Loading...</div>
      </FairyScreenLayout>
    );
  }

  const currentWord = words[currentWordIndex];
  const totalSentences = selectedSentences.length;
  const progressPct = totalSentences > 0
    ? Math.round((currentSentenceIdx / totalSentences) * 100)
    : 0;
  const wpm = elapsedTime > 0 ? Math.round((stats.totalKeys / elapsedTime) * 60) : 0;
  const acc = (stats.totalKeys + stats.missCount) > 0
    ? Math.round((stats.totalKeys / (stats.totalKeys + stats.missCount)) * 100)
    : 100;

  return (
    <FairyScreenLayout
      wide
      fairy={fairy}
      fairyHeaderSlot={stage ? (
        <div className="h-7 flex items-center justify-center text-[10px] font-sans text-green-400 border border-green-800 bg-zinc-950 px-2 rounded leading-none whitespace-nowrap overflow-hidden">
          {stage.name}
        </div>
      ) : undefined}
      fairySlot={
        <div className="hidden lg:flex flex-col gap-1.5 text-xs font-pixel border-t border-green-900 pt-3 text-green-300">
          <div>TIME <span className="font-bold text-green-200">{elapsedTime}s</span></div>
          <div>WPM  <span className="font-bold text-yellow-300">{wpm}</span></div>
          <div>ACC  <span className="font-bold text-green-300">{acc}%</span></div>
          <div>MISS <span className="font-bold text-red-400">{stats.missCount}</span></div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col gap-5 w-full">
        {/* 進捗バー（文単位） */}
        <div className="bg-zinc-800 border-2 border-green-500 h-7 flex items-center relative rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div
            className="bg-green-500 h-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference font-pixel">
            {Math.min(currentSentenceIdx + 1, totalSentences)} / {totalSentences} SENTENCES
          </span>
        </div>

        {/* 文表示 */}
        <div className="px-4 py-3 bg-zinc-800/80 rounded-lg border border-zinc-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-h-[56px] flex items-center justify-center text-center">
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
        <div className="min-h-[120px] flex items-center justify-center">
          {currentWord ? (
            <SegmentDetail word={currentWord} keyIndex={currentKeyIndex} />
          ) : (
            <div className="text-center space-y-3">
              <div className="text-3xl font-pixel text-green-400 animate-pulse">COMPLETE!</div>
              <div className="text-sm text-zinc-400">全文クリア！結果を集計中…</div>
            </div>
          )}
        </div>

        {/* キーガイド / 未スタートガイド（キーボードを常にDOMに残してinvisibleで高さ確保）*/}
        <div className="relative flex flex-col items-center w-full">
          <div className={!(started && settings.showGuide && currentWord) ? "invisible" : ""}>
            <KeyboardDiagram
              activeKeys={
                started && currentWord && currentKeyIndex < currentWord.keys.length
                  ? [currentWord.keys[currentKeyIndex].key]
                  : []
              }
              typedKeys={
                started && currentWord
                  ? currentWord.keys.slice(0, currentKeyIndex).map(k => k.key)
                  : []
              }
              layout={settings.keyboardLayout}
            />
          </div>
          {!started && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs text-zinc-500 text-center space-y-1.5 border border-zinc-700 rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-full">
                <p><span className="text-yellow-400">Shift+最初のキー</span> = 変換開始（ひらがなはそのまま）</p>
                <p><span className="text-green-400">Shift+最後のキー</span> = 送りがなトリガー（AZIK）</p>
                <p className="text-zinc-600 mt-1">キーを押すとスタート</p>
              </div>
            </div>
          )}
        </div>

        {/* 底部：MODE SELECT / 音量 */}
        <div className="flex items-center justify-between mt-auto">
          <GameButton variant="ghost" size="sm" onClick={onBackToStageSelect}>
            MODE SELECT
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
