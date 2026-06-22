"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { TypingWord, AzikSegment, createTypingWord, buildValidKeys, AZIK_DICTIONARY } from "@/data/azikRules";
import { loadStage } from "@/data/stages";
import { GameSettings, TimeAttackBest } from "@/types/game";
import FairyScreenLayout from "@/components/FairyScreenLayout";
import GameButton from "@/components/GameButton";
import KanaSegmentDisplay from "@/components/KanaSegmentDisplay";
import { buildTimeAttackTweetUrl } from "@/utils/tweetUtils";
import XIcon from "@/components/XIcon";
import { useTypingInput } from "@/hooks/useTypingInput";
import { useCustomDictionary } from "@/hooks/useCustomDictionary";
import { useAzikSound } from "@/hooks/useAzikSound";

const TIME_LIMIT = 60;
const WORDS_BUFFER = 60;

interface TimeAttackGameProps {
  settings: GameSettings;
  onFinish: (result: { wpm: number; accuracy: number }) => void;
  onBack: () => void;
  prevBest: TimeAttackBest | null;
}

export default function TimeAttackGame({ settings, onFinish, onBack, prevBest }: TimeAttackGameProps) {
  const [words, setWords] = useState<TypingWord[]>([]);
  const [completedWordCount, setCompletedWordCount] = useState(0);
  const [remaining, setRemaining] = useState(TIME_LIMIT);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalKeysRef = useRef(0);
  const missCountRef = useRef(0);
  const completedCharsRef = useRef(0);

  const customDictionary = useCustomDictionary(settings);
  const { playCorrect, playMiss, playWordComplete } = useAzikSound(settings.soundEnabled ? settings.soundTheme : "off");

  const loadWords = useCallback(async (): Promise<TypingWord[]> => {
    const stage = await loadStage("practice-words-1");
    const shuffled = [...stage.words].sort(() => Math.random() - 0.5).slice(0, WORDS_BUFFER);
    return shuffled.map(w => createTypingWord(w.kanji, w.kana, customDictionary));
  }, [customDictionary]);

  const finish = useCallback((keys: number, misses: number, elapsed: number) => {
    const wpm = Math.round((keys / Math.max(elapsed, 1)) * 60);
    const accuracy = keys + misses > 0 ? Math.round((keys / (keys + misses)) * 100) : 100;
    const r = { wpm, accuracy };
    setResult(r);
    setIsFinished(true);
    onFinish(r);
  }, [onFinish]);

  const getAllowedPatterns = useCallback((seg: AzikSegment) =>
    buildValidKeys(seg.kana, AZIK_DICTIONARY, (_sub, keys) => keys), []);

  const onFirstKey = useCallback(() => {
    setIsStarting(true);
    setTimeout(() => setIsStarting(false), 400);
  }, []);

  const onSegmentComplete = useCallback(() => {
    playCorrect();
  }, [playCorrect]);

  const onCorrectKey = useCallback(() => {
    totalKeysRef.current += 1;
  }, []);

  const onMissKey = useCallback(() => {
    missCountRef.current += 1;
    playMiss();
  }, [playMiss]);

  // words を ref で持つことで onWordComplete クロージャが常に最新を参照できる
  const wordsStateRef = useRef(words);
  wordsStateRef.current = words;

  const onWordComplete = useCallback((completedWordIdx: number) => {
    const ws = wordsStateRef.current;
    const completedWord = ws[completedWordIdx];
    completedCharsRef.current += completedWord?.segments.length ?? 0;
    setCompletedWordCount(prev => prev + 1);
    playWordComplete();
    if (completedWordIdx + 1 >= ws.length) {
      loadWords().then(extra => setWords(prev => [...prev, ...extra]));
    }
  }, [loadWords, playWordComplete]);

  const {
    wordIndex,
    segmentIndex,
    inputBuffer,
    totalCorrectKeys,
    totalMissKeys,
    isWiggling,
    startedAt,
    reset: hookReset,
  } = useTypingInput({
    words,
    getAllowedPatterns,
    disabled: isFinished,
    wiggleOnMiss: true,
    onFirstKey,
    onSegmentComplete,
    onCorrectKey,
    onMissKey,
    onWordComplete,
  });

  const resetGame = useCallback(() => {
    hookReset();
    setIsFinished(false);
    setResult(null);
    setRemaining(TIME_LIMIT);
    setCompletedWordCount(0);
    totalKeysRef.current = 0;
    missCountRef.current = 0;
    completedCharsRef.current = 0;
    loadWords().then(setWords);
  }, [hookReset, loadWords]);

  useEffect(() => {
    loadWords().then(setWords);
  }, [loadWords]);

  useEffect(() => {
    if (!startedAt || isFinished) return;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rem = Math.max(0, TIME_LIMIT - elapsed);
      setRemaining(rem);
      if (rem <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish(totalKeysRef.current, missCountRef.current, TIME_LIMIT);
      }
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startedAt, isFinished, finish]);

  const progressPct = startedAt ? Math.min(100, ((TIME_LIMIT - remaining) / TIME_LIMIT) * 100) : 0;
  const isNewBest = result && (!prevBest || result.wpm > prevBest.wpm);

  if (words.length === 0) {
    return <div className="text-green-400 font-pixel text-xl text-center">LOADING...</div>;
  }

  if (isFinished && result) {
    const shareUrl = buildTimeAttackTweetUrl(result.wpm, result.accuracy, typeof window !== "undefined" ? window.location.origin : "https://azik-fairy.solunita.net");

    return (
      <FairyScreenLayout fairy={{ message: isNewBest ? "新記録おめでとう！マジで最強タイパーじゃん！🏆💎" : "お疲れ様！次はもっと速くなれるよ！💪✨", emotion: isNewBest ? "perfect" : "happy" }}>
        <div className="flex-1 flex flex-col items-center gap-6">
          <h2 className="font-pixel text-2xl text-center border-b-2 border-green-500 pb-2 w-full tracking-widest">= TIME ATTACK =</h2>

          {isNewBest && (
            <div className="font-pixel text-yellow-300 text-lg font-bold tracking-widest animate-pulse">
              ✦ NEW RECORD! ✦
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col items-center p-4 bg-zinc-800 border-2 border-yellow-600 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-pixel text-zinc-400">WPM</span>
              <span className="text-4xl font-bold font-pixel text-yellow-300 mt-1">{result.wpm}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-zinc-800 border-2 border-green-600 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-pixel text-zinc-400">ACC</span>
              <span className="text-4xl font-bold font-pixel text-green-300 mt-1">{result.accuracy}%</span>
            </div>
          </div>

          {prevBest && (
            <p className="text-sm font-pixel text-zinc-400">
              自己ベスト: <span className="text-yellow-400 font-bold">{isNewBest ? result.wpm : prevBest.wpm} WPM</span>
              {isNewBest && <span className="text-green-400 ml-2">(+{result.wpm - prevBest.wpm})</span>}
            </p>
          )}

          <div className="flex flex-col gap-3 w-full">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 font-pixel font-bold tracking-wider bg-sky-950 text-sky-300 border-2 border-sky-500 hover:bg-sky-500 hover:text-white px-4 py-3 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-colors duration-150"
            >
              <XIcon />
              <span className="text-sm">シェアする</span>
            </a>
            <GameButton variant="primary" size="md" onClick={resetGame} className="w-full">
              RETRY
            </GameButton>
            <GameButton variant="danger" size="sm" onClick={onBack} className="w-full">BACK TO TITLE</GameButton>
          </div>
        </div>
      </FairyScreenLayout>
    );
  }

  const currentWord = words[wordIndex];
  const currentSeg: AzikSegment | undefined = currentWord?.segments[segmentIndex];

  return (
    <FairyScreenLayout wide fairy={{ message: startedAt ? "全力で打ちまくれ！AZIKで爆速タイパーになれ！🔥" : "キーを押してスタート！1分間でどれだけ打てる！？⚡", emotion: startedAt ? "excited" : "idle" }}>
      <div className={`flex-1 flex flex-col gap-4 ${isWiggling ? "animate-[wiggle_0.08s_ease-in-out_3]" : isStarting ? "animate-[start-bounce_0.4s_ease-out]" : ""}`}>

        {/* タイマー表示 */}
        <div className="text-center">
          <span className={`font-pixel text-5xl font-bold ${remaining <= 10 ? "text-red-400 animate-pulse" : remaining <= 30 ? "text-yellow-300" : "text-green-300"}`}>
            {Math.ceil(remaining)}
          </span>
          <span className="text-zinc-400 text-sm font-pixel ml-2">s</span>
        </div>

        {/* タイマーバー */}
        <div className="w-full h-3 bg-zinc-800 rounded overflow-hidden border border-zinc-700">
          <div
            className={`h-full transition-all duration-100 ${remaining <= 10 ? "bg-red-500" : remaining <= 30 ? "bg-yellow-500" : "bg-green-500"}`}
            style={{ width: `${100 - progressPct}%` }}
          />
        </div>

        {/* スコア表示 */}
        <div className="flex justify-around text-xs font-pixel text-zinc-400 border border-zinc-800 rounded px-3 py-2">
          <span>KEYS: <span className="text-white font-bold">{totalCorrectKeys}</span></span>
          <span>MISS: <span className={`font-bold ${totalMissKeys > 0 ? "text-red-400" : "text-white"}`}>{totalMissKeys}</span></span>
          <span>WORDS: <span className="text-white font-bold">{completedWordCount}</span></span>
          {prevBest && <span>BEST: <span className="text-yellow-400 font-bold">{prevBest.wpm}</span> WPM</span>}
        </div>

        {/* タイピングボード */}
        <div className="w-full flex flex-col items-center p-6 bg-zinc-950 border-2 border-green-500 rounded-md min-h-[140px] justify-center shadow-[inset_4px_4px_10px_rgba(0,0,0,0.8)]">
          {!startedAt ? (
            /* スタート前: お題を隠す */
            <div className="flex flex-col items-center gap-3">
              <div className="text-zinc-700 font-pixel text-2xl tracking-widest">? ? ? ? ?</div>
              <p className="text-green-500 font-pixel text-sm animate-pulse">── PRESS ANY KEY TO START ──</p>
            </div>
          ) : (
            <>
              <div className="text-3xl md:text-4xl font-extrabold tracking-widest text-zinc-100 font-sans mb-4">
                {currentWord?.kanji ?? ""}
              </div>
              {currentWord && (
                <KanaSegmentDisplay
                  segments={currentWord.segments}
                  currentIndex={segmentIndex}
                />
              )}

              {/* 入力中バッファ表示 */}
              <div className="mt-3 h-8 flex items-center justify-center">
                {inputBuffer && (
                  <div className="bg-zinc-800 px-4 py-1 border border-green-700 rounded font-pixel text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-green-300 font-bold uppercase tracking-widest">{inputBuffer}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 次の単語プレビュー */}
        {startedAt && words[wordIndex + 1] && (
          <div className="text-center text-zinc-600 text-sm font-sans">
            次: {words[wordIndex + 1]?.kanji}
          </div>
        )}

        <GameButton variant="danger" size="sm" onClick={onBack}>QUIT</GameButton>
      </div>

    </FairyScreenLayout>
  );
}
