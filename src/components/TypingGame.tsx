"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { TypingWord, createTypingWord, AzikSegment, StageData, calculateOptimalKeyCounts, AZIK_DICTIONARY, AzikMapping } from "@/data/azikRules";
import { getAllowedPatterns as getPatterns } from "@/utils/allowedPatterns";
import { loadStage, STAGES } from "@/data/stages";
import SkkTypingGame from "./SkkTypingGame";
import { isWordBlockedForStage } from "@/data/stages/wordValidator";
import { useTypingInput, TypingKeyState } from "@/hooks/useTypingInput";
import { GameSettings } from "@/types/game";
import { FairyEmotion } from "./FairyHelper";
import FairyScreenLayout from "./FairyScreenLayout";
import { GameStats } from "@/types/game";
import { getRank, calcOptimalProgress } from "@/utils/gameLogic";
import KeyboardDiagram from "./KeyboardDiagram";
import KanaSegmentDisplay from "./KanaSegmentDisplay";
import KeyPatternButtons from "./KeyPatternButtons";
import GameButton from "./GameButton";
import { useAzikSound } from "@/hooks/useAzikSound";
import VolumeControl from "@/components/VolumeControl";
import { resultComments, COMMENT_IDS_BY_RANK, CommentId } from "@/data/resultComments";
import { WEAKNESS_STAGE_ID } from "@/constants/game";

const FAIRY_QUOTES = {
  start: [
    "準備おっけー？爆速でタイピングしちゃお！マジ期待してるよ！✨",
    "AZIKで打つよ～！指にガッツリ覚え込ませてこー！💅",
    "今日も指がブッ飛ぶくらい速くなるよ！気合い入れてこ～！🔥",
    "さあ始めよー！AZIKの魔法で指を超進化させちゃお！💫",
    "えいえいおー！アタシが全力サポートするからワンチャン大丈夫！💪",
    "キーボードは武器だよね～！AZIKで爆速タイパーになろ！⚡",
    "この練習、のちのち絶対効いてくるやつ！気合い入れてこ！💎",
    "はじめるよ～！集中力みが深くなってきたら最強だよね！🎯",
  ],
  correctWord: [
    "いい感じ！超ヤバいんだけど！💖",
    "やるじゃん！指の動きが超滑らかになっててウケる～！✨",
    "さすが！マジで天才みが深いんだけど！💎",
    "完璧！AZIKの感覚完全に掴めてるじゃん！😼",
    "うぉっ！速くなってる！アタシも鳥肌立ってんだけど！🌟",
    "その調子！もう指が勝手に動いてる感じじゃん！えぐい！⭐",
    "ギャル泣きしそうなくらい上手い！マジで！🥹",
    "えっそんなに上手かったっけ！？ウケるくらい成長してるじゃん！💥",
    "神！！それって天才系の指の動きじゃん！👑",
    "最高すぎ！このまま無双しちゃって！🎯",
    "めっちゃリズム感いいじゃん！タイピングの才能エグくない！？💗",
    "バチ上手い！もうプロ系じゃん！アタシ感動してんだけど！🙄💖",
  ],
  wrongStrict: [
    "あー！そこはAZIK入力じゃなきゃダメだよー！💦",
    "ノーマル入力は禁止！AZIKの短縮キーで打ってね！💅",
    "そこはAZIK！下のヒント表確認してみて！✨",
    "ダメダメー！アタシの魔法でブロックしちゃった！🧚‍♀️",
    "違う違う！AZIKのショートカットを使うんだよ！🎯",
    "はーい！そこ間違い！ヒント見てもっかいトライ！💪",
    "AZIKモードだから通常入力は無効なのよん～！💫",
    "ちょっと待って！そのキーじゃないよ！ヒント確認して！⭐",
    "そこショートカット系だよ！絶対こっちのほうが速くなるから！🔥",
    "きゃぱい気持ちわかるけど！AZIKで打てたら超気持ちいいから！💗",
  ],
  wrongNormal: [
    "あちゃ！押し間違えちゃった！ドンマイ！🥺",
    "ミスだよ！焦らずキーを確認していこー！💅",
    "落ち着いて！正しいキーを押してね！✨",
    "ドンマイドンマイ！完璧じゃなくてもぜんっぜんOK！🩷",
    "あーっ！惜しかった！次！次！！🎮",
    "まあそういう日もあるよ～！焦らず丁寧にいこ！🌸",
    "ミスは成長の証！気にしないで次いこ！🌟",
    "ドンマイ精神で行こ！練習あるのみじゃん！💖",
    "一回のミスとりまスルーで！気持ち切り替えてこ！🙄",
    "惜しかった～！でも大丈夫！このペースで続けてこ！💗",
  ],
} as const;

function getRandomQuote(category: keyof typeof FAIRY_QUOTES): string {
  const quotes = FAIRY_QUOTES[category];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function RubyText({ kanji, kana }: { kanji: string; kana: string }) {
  const startPunctMatch = kanji.match(/^([「『（('"、。！？\s]+)/);
  const endPunctMatch = kanji.match(/([」』）)'"、。！？\s]+)$/);
  const startPunct = startPunctMatch ? startPunctMatch[0] : "";
  const endPunct = endPunctMatch ? endPunctMatch[0] : "";
  const coreKanji = kanji.substring(startPunct.length, kanji.length - endPunct.length);

  if (coreKanji === kana || !coreKanji) {
    return <span>{startPunct}{coreKanji}{endPunct}</span>;
  }
  return (
    <span>
      {startPunct}
      <ruby>
        {coreKanji}
        <rt className="text-xs text-green-300 tracking-normal select-none normal-case">{kana}</rt>
      </ruby>
      {endPunct}
    </span>
  );
}

interface TypingGameProps {
  stageId: string;
  settings: GameSettings;
  onFinish: (stats: GameStats) => void;
  onBackToStageSelect: () => void;
  onUpdateSettings: (s: GameSettings) => void;
  ghostBestWpm?: number;
  weaknessOverrideWords?: TypingWord[];
  effectiveDict?: Record<string, AzikMapping>;
}

export default function TypingGame({ stageId, settings, onFinish, onBackToStageSelect, onUpdateSettings, ghostBestWpm, weaknessOverrideWords, effectiveDict }: TypingGameProps) {
  const isSkkStage = STAGES.find(s => s.id === stageId)?.category === "SKK";
  const [stage, setStage] = useState<StageData | null>(null);

  useEffect(() => {
    if (isSkkStage) return;
    if (stageId === WEAKNESS_STAGE_ID) {
      setStage({ id: WEAKNESS_STAGE_ID, name: "弱点練習", category: "Practice", description: "弱点集中練習", words: [] } as unknown as StageData);
      return;
    }
    setStage(null);
    loadStage(stageId).then(setStage);
  }, [stageId, isSkkStage]);

  const [words, setWords] = useState<TypingWord[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [optimalKeys, setOptimalKeys] = useState({ totalNormal: 0, totalAzik: 0 });
  const [fairyMessage, setFairyMessage] = useState("準備はおっけー？キーを押すとタイピングスタートだよ！✨");
  const [fairyEmotion, setFairyEmotion] = useState<FairyEmotion>("idle");
  const [pendingStats, setPendingStats] = useState<GameStats | null>(null);

  const keyHeatmapRef = useRef<Record<string, { miss: number; attempt: number }>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // hook から返る startedAt/optimalKeys を callback closure で参照するための ref
  const startedAtRef = useRef<number | null>(null);
  const optimalKeysRef = useRef({ totalNormal: 0, totalAzik: 0 });

  const { playCorrect, playMiss, playWordComplete, playStageClear } = useAzikSound(settings.soundTheme, settings.soundVolume);

  const getAllowedPatterns = useCallback((currentSeg: AzikSegment): string[] => {
    return getPatterns(currentSeg, {
      stageId,
      stageCategory: stage?.category,
      isTraining: settings.isTraining,
      isFullTraining: settings.isFullTraining,
      dict: effectiveDict ?? AZIK_DICTIONARY,
    });
  }, [stageId, stage?.category, settings.isTraining, settings.isFullTraining, effectiveDict]);

  const onFirstKey = useCallback(() => {
    setFairyMessage(getRandomQuote("start"));
    setFairyEmotion("excited");
  }, []);

  const onSegmentComplete = useCallback(() => {
    playCorrect();
  }, [playCorrect]);

  const onWordComplete = useCallback(() => {
    playWordComplete();
    setFairyMessage(getRandomQuote("correctWord"));
    setFairyEmotion("happy");
  }, [playWordComplete]);

  const onAllComplete = useCallback((finalState: TypingKeyState) => {
    playStageClear();
    const totalTime = Math.max((Date.now() - (startedAtRef.current || Date.now())) / 1000, 1);
    const totalKeys = finalState.totalCorrectKeys;
    const accuracy = Math.round((totalKeys / (totalKeys + finalState.totalMissKeys)) * 100);
    const wpm = Math.round((totalKeys / totalTime) * 60);

    const { totalNormal, totalAzik } = optimalKeysRef.current;
    const azikRatio = totalNormal > totalAzik
      ? Math.max(0, Math.min(100, Math.round(((totalNormal - totalKeys) / (totalNormal - totalAzik)) * 100)))
      : 100;
    const savedKeys = Math.max(0, totalNormal - totalKeys);

    const rank = getRank(accuracy, wpm, azikRatio);
    const commentIds = COMMENT_IDS_BY_RANK[rank];
    const commentId: CommentId = commentIds[Math.floor(Math.random() * commentIds.length)];
    const commentText = resultComments[commentId] || "";

    setFairyMessage(commentText);
    const rankEmotion: FairyEmotion = rank === "PERFECT" ? "perfect" : rank === "A" ? "proud" : "happy";
    setFairyEmotion(rankEmotion);
    setPendingStats({
      time: totalTime, wpm, accuracy, totalKeys,
      missCount: finalState.totalMissKeys, azikRatio, rank,
      comment: commentId, savedKeys, keyHeatmap: keyHeatmapRef.current,
    });
  }, [playStageClear]);

  const onCorrectKey = useCallback((_key: string, expectedKey: string | undefined) => {
    if (expectedKey) {
      const prev = keyHeatmapRef.current;
      const entry = prev[expectedKey] ?? { miss: 0, attempt: 0 };
      keyHeatmapRef.current = { ...prev, [expectedKey]: { ...entry, attempt: entry.attempt + 1 } };
    }
  }, []);

  const onMissKey = useCallback((_key: string, expectedKey: string | undefined) => {
    if (expectedKey) {
      const prev = keyHeatmapRef.current;
      const entry = prev[expectedKey] ?? { miss: 0, attempt: 0 };
      keyHeatmapRef.current = { ...prev, [expectedKey]: { ...entry, attempt: entry.attempt + 1, miss: entry.miss + 1 } };
    }
    playMiss();
    if (settings.isTraining) {
      setFairyMessage(getRandomQuote("wrongStrict"));
      setFairyEmotion("warning");
      setTimeout(() => setFairyEmotion("excited"), 600);
    } else {
      setFairyMessage(getRandomQuote("wrongNormal"));
      setFairyEmotion("warning");
      setTimeout(() => setFairyEmotion("excited"), 600);
    }
  }, [playMiss, settings.isTraining]);

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
    disabled: !!pendingStats,
    wiggleOnMiss: settings.isTraining,
    onFirstKey,
    onSegmentComplete,
    onWordComplete,
    onAllComplete,
    onCorrectKey,
    onMissKey,
  });

  // onAllComplete が refs 経由でアクセスできるよう hook 戻り値を同期
  startedAtRef.current = startedAt;
  optimalKeysRef.current = optimalKeys;

  const getRealtimeSavedKeys = () => {
    const { optimalNormal } = calcOptimalProgress(words, wordIndex, segmentIndex);
    const confirmedCorrectKeys = totalCorrectKeys - inputBuffer.length;
    return Math.max(0, optimalNormal - confirmedCorrectKeys);
  };

  const getRealtimeAzikRatio = () => {
    const { optimalNormal, optimalAzik } = calcOptimalProgress(words, wordIndex, segmentIndex);
    if (optimalNormal <= optimalAzik) return 100;
    const confirmedCorrectKeys = totalCorrectKeys - inputBuffer.length;
    return Math.max(0, Math.min(100, Math.round(((optimalNormal - confirmedCorrectKeys) / (optimalNormal - optimalAzik)) * 100)));
  };

  // STAGE COMPLETE: PRESS ANY KEY でリザルトへ
  useEffect(() => {
    if (!pendingStats) return;
    const handler = (e: KeyboardEvent) => {
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
      onFinish(pendingStats);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pendingStats, onFinish]);

  useEffect(() => {
    if (!stage) return;

    const dict = effectiveDict ?? AZIK_DICTIONARY;
    let initializedWords: TypingWord[];

    if (stage.id === WEAKNESS_STAGE_ID && weaknessOverrideWords && weaknessOverrideWords.length > 0) {
      initializedWords = weaknessOverrideWords;
    } else if (stage.id === WEAKNESS_STAGE_ID) {
      // weaknessOverrideWordsがまだロード中: 待機
      return;
    } else {
      const isDebug = process.env.NEXT_PUBLIC_DEBUG === "true";
      const limit = isDebug ? 1 : (
        stage.category === "Challenge" ? 0 :
        stage.category === "Practice"  ? 50 :
        settings.wordsPerSession
      );
      // filter blocked words first, then sample — ensures word count is maintained
      const allMapped = stage.words.map(w => createTypingWord(w.kanji, w.kana, dict));
      const eligible = allMapped.filter(w => !isWordBlockedForStage(w, stage.id, dict));
      const pool = eligible.length > 0 ? eligible : allMapped;
      initializedWords = limit > 0 && pool.length > limit
        ? [...pool].sort(() => Math.random() - 0.5).slice(0, limit)
        : pool;
    }

    const counts = calculateOptimalKeyCounts(initializedWords);
    setWords(initializedWords);
    setOptimalKeys(counts);
    setElapsedTime(0);
    keyHeatmapRef.current = {};
    hookReset();

    const msg = stage.id === WEAKNESS_STAGE_ID
      ? "弱点集中練習！苦手なキーを克服するよ！💪"
      : `${stage.name}！AZIKでいくよー！何かキーを押してね！💖`;
    setFairyMessage(msg);
    setFairyEmotion("idle");
    setPendingStats(null);
  }, [stage, effectiveDict, weaknessOverrideWords]);

  useEffect(() => {
    if (startedAt === null || pendingStats) return;
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startedAt, pendingStats]);

  if (isSkkStage) {
    return (
      <SkkTypingGame
        stageId={stageId}
        settings={settings}
        effectiveDict={effectiveDict}
        onFinish={onFinish}
        onBackToStageSelect={onBackToStageSelect}
        onUpdateSettings={onUpdateSettings}
      />
    );
  }

  if (words.length === 0) {
    return <div className="text-green-400 font-pixel text-xl">LOADING STAGE DATA...</div>;
  }

  if (pendingStats) {
    return (
      <FairyScreenLayout wide accent="yellow" fairy={{ message: fairyMessage, emotion: fairyEmotion }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="font-pixel tracking-widest text-center leading-tight">
            <div
              className="text-5xl md:text-6xl font-extrabold"
              style={{ animation: 'glow-yellow 1.6s ease-in-out infinite' }}
            >
              STAGE
            </div>
            <div
              className="text-5xl md:text-6xl font-extrabold mt-2"
              style={{ animation: 'glow-yellow 1.6s ease-in-out infinite' }}
            >
              COMPLETE!
            </div>
          </div>

          {/* ランクバッジ */}
          <div
            className={`font-pixel text-2xl md:text-3xl font-extrabold px-6 py-2 border-4 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] tracking-widest ${
              pendingStats.rank === "PERFECT" ? "border-yellow-400 text-yellow-300 bg-yellow-400/10" :
              pendingStats.rank === "A"       ? "border-orange-400 text-orange-300 bg-orange-400/10" :
              pendingStats.rank === "B"       ? "border-cyan-400   text-cyan-300   bg-cyan-400/10"   :
                                                "border-zinc-100   text-white      bg-zinc-800/50"
            }`}
            style={pendingStats.rank === "PERFECT" ? { animation: 'glow-yellow 1.6s ease-in-out infinite' } : undefined}
          >
            {pendingStats.rank === "PERFECT" ? "✦ PERFECT ✦" : `RANK  ${pendingStats.rank}`}
          </div>

          <div className="grid grid-cols-5 gap-1.5 w-full">
            {[
              { label: "TIME",  value: `${pendingStats.time.toFixed(1)}`, unit: "s",  color: "text-green-200",  border: "border-green-700" },
              { label: "WPM",   value: `${pendingStats.wpm}`,             unit: "",   color: "text-yellow-300", border: "border-yellow-700" },
              { label: "ACC",   value: `${pendingStats.accuracy}`,        unit: "%",  color: "text-green-300",  border: "border-green-700" },
              { label: "AZIK",  value: `${pendingStats.azikRatio}`,       unit: "%",  color: "text-yellow-400", border: "border-yellow-600" },
              { label: "SAVED", value: `${pendingStats.savedKeys}`,       unit: "",   color: "text-cyan-300",   border: "border-cyan-700" },
            ].map(({ label, value, unit, color, border }) => (
              <div key={label} className={`flex flex-col items-center justify-between p-2 md:p-3 bg-zinc-800 border-2 ${border} rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] min-w-0`}>
                <span className="text-[9px] md:text-[10px] font-pixel text-zinc-400 tracking-widest shrink-0">{label}</span>
                <div className={`font-bold font-pixel ${color} mt-1 text-center leading-none`}>
                  <span className="text-xl md:text-2xl">{value}</span>
                  {unit && <span className="text-xs md:text-sm ml-0.5">{unit}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm md:text-base font-pixel text-white animate-pulse tracking-widest">─ PRESS ANY KEY ─</div>
        </div>
      </FairyScreenLayout>
    );
  }

  const currentWord = words[wordIndex];
  const currentSeg: AzikSegment | undefined = currentWord?.segments[segmentIndex];

  const isPlayingPracticeOrChallenge = stage?.category === "Practice" || stage?.category === "Challenge";
  const isEffectivelyTraining = !isPlayingPracticeOrChallenge || settings.isTraining;

  // ステージフィルター済みの表示用パターン（currentSeg.azikは未フィルター生データのため使わない）
  // inputBuffer でプレフィックスフィルタ: 打った文字と合わない候補を除去
  const displayPatterns = currentSeg
    ? getAllowedPatterns(currentSeg).filter(p => p.startsWith(inputBuffer))
    : [];

  const azikHint = currentSeg
    ? `${currentSeg.kana} ➔ ${displayPatterns.map(k => `[${k}]`).join(" or ")}` +
      (!isEffectivelyTraining ? ` (通常: ${currentSeg.normal.map(k => `[${k}]`).join("/")})` : "")
    : "";

  const azikNextKeys = displayPatterns.flatMap(pattern => {
    const remaining = pattern.slice(inputBuffer.length);
    return remaining.length > 0 ? [remaining[0]] : [];
  });

  const normalNextKeys = currentSeg
    ? [...new Set(currentSeg.normal.flatMap(pattern => {
        const remaining = pattern.slice(inputBuffer.length);
        return remaining.length > 0 ? [remaining[0]] : [];
      }))].filter(k => !azikNextKeys.includes(k))
    : [];

  // ゴースト位置計算（経過時間ベース）
  const ghostProgress = (() => {
    if (!ghostBestWpm || !settings.ghostRaceEnabled || !startedAt) return null;
    const elapsed = (Date.now() - startedAt) / 1000;
    const ghostChars = (ghostBestWpm / 60) * elapsed;
    return Math.min(1, ghostChars / Math.max(optimalKeys.totalAzik, 1));
  })();

  // 自分の進捗（キーベース）
  const myKeyProgress = optimalKeys.totalAzik > 0
    ? Math.min(1, totalCorrectKeys / optimalKeys.totalAzik)
    : wordIndex / Math.max(words.length, 1);

  return (
    <FairyScreenLayout
      wide
      fairy={{ message: fairyMessage, emotion: fairyEmotion }}
      fairyHeaderSlot={stage ? (
        <div className="h-7 flex items-center justify-center text-[10px] font-sans text-green-400 border border-green-800 bg-zinc-950 px-2 rounded leading-none whitespace-nowrap overflow-hidden">
          {stage.name}
        </div>
      ) : undefined}
      fairySlot={
        <div className="hidden lg:flex flex-col gap-1.5 text-xs font-pixel border-t border-green-900 pt-3 text-green-300">
          <div>TIME <span className="font-bold text-green-200">{elapsedTime}s</span></div>
          <div>KEYS <span className="font-bold text-zinc-100">{totalCorrectKeys}</span></div>
          <div>WPM <span className="font-bold text-yellow-300">{elapsedTime > 0 ? Math.round((totalCorrectKeys / elapsedTime) * 60) : 0}</span></div>
          <div>ACC <span className="font-bold text-green-300">
            {totalCorrectKeys + totalMissKeys > 0
              ? Math.round((totalCorrectKeys / (totalCorrectKeys + totalMissKeys)) * 100)
              : 100}%
          </span></div>
          <div>MISS <span className="font-bold text-red-400">{totalMissKeys}</span></div>
          <div className="border-t border-green-950/50 my-1"></div>
          <div>AZIK <span className="font-bold text-yellow-400">{getRealtimeAzikRatio()}%</span></div>
          <div>SAVED <span className="font-bold text-cyan-300">{getRealtimeSavedKeys()}</span></div>
        </div>
      }
    >
      {/* ===== ゲーム本体 ===== */}
      <div className={`flex-1 flex flex-col gap-3 ${isWiggling ? "animate-[wiggle_0.08s_ease-in-out_infinite]" : ""}`}>

        {/* 進捗ゲージ（単語ベース） */}
        <div className="bg-zinc-800 border-2 border-green-500 h-7 flex items-center relative rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${(wordIndex / words.length) * 100}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference font-pixel">
            {wordIndex} / {words.length} WORDS
          </span>
        </div>

        {/* ゴーストレースバー */}
        {ghostBestWpm && settings.ghostRaceEnabled && (
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 h-2 bg-zinc-800 rounded overflow-hidden border border-zinc-700">
              {/* 自分の進捗（キーベース） */}
              <div
                className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-100"
                style={{ width: `${Math.min(100, myKeyProgress * 100)}%` }}
              />
              {/* ゴーストマーカー */}
              {ghostProgress !== null && (
                <div
                  className="absolute top-0 h-full w-1 bg-yellow-400 opacity-80"
                  style={{ left: `${Math.min(99, ghostProgress * 100)}%` }}
                />
              )}
            </div>
            <span className="text-[8px] text-yellow-400 font-pixel opacity-70 shrink-0">👻{ghostBestWpm}wpm</span>
          </div>
        )}

        {/* タイピングボード */}
        <div className="w-full flex flex-col items-center p-4 lg:p-5 bg-zinc-950 border-2 border-green-500 rounded-md min-h-[140px] justify-center relative shadow-[inset_4px_4px_10px_rgba(0,0,0,0.8)]">
          {/* 漢字（ルビ付き） */}
          <div className="flex items-center justify-center min-h-[3.5rem] md:min-h-[4rem] lg:min-h-[5rem] w-full text-center mb-1">
            <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-widest text-zinc-100 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {currentWord ? (stage?.category === "Challenge" ? currentWord.kanji : <RubyText kanji={currentWord.kanji} kana={currentWord.kana} />) : ""}
            </div>
          </div>

          {/* ひらがなセグメント */}
          <div className="flex items-center justify-center min-h-[2.5rem] md:min-h-[3rem] lg:min-h-[3.5rem] w-full mb-1">
            {currentWord && (
              <KanaSegmentDisplay
                segments={currentWord.segments}
                currentIndex={segmentIndex}
                sizeClass="text-xl md:text-2xl lg:text-3xl"
              />
            )}
          </div>

          {/* キーガイド */}
          {settings.showGuide && currentSeg && (
            <div className="mt-3 flex flex-col items-center text-sm opacity-80 w-full">
              <span className="text-green-300 font-bold text-xs font-pixel">NEXT KEY:</span>
              <KeyPatternButtons patterns={displayPatterns} inputBuffer={inputBuffer} />
              <KeyboardDiagram
                activeKeys={azikNextKeys}
                normalKeys={normalNextKeys}
                typedKeys={inputBuffer.split("").filter(Boolean)}
                layout={settings.keyboardLayout}
              />
            </div>
          )}
        </div>

        {/* モバイル用メトリクス */}
        <div className="grid grid-cols-4 lg:hidden gap-x-2 gap-y-1 w-full text-xs border-t border-green-900 pt-3 px-1 font-pixel text-green-300">
          <div>TIME: <span className="font-bold text-green-200">{elapsedTime}s</span></div>
          <div>KEYS: <span className="font-bold text-zinc-100">{totalCorrectKeys}</span></div>
          <div>WPM: <span className="font-bold text-yellow-300">{elapsedTime > 0 ? Math.round((totalCorrectKeys / elapsedTime) * 60) : 0}</span></div>
          <div>ACC: <span className="font-bold text-green-300">{totalCorrectKeys + totalMissKeys > 0 ? Math.round((totalCorrectKeys / (totalCorrectKeys + totalMissKeys)) * 100) : 100}%</span></div>
          <div>MISS: <span className="font-bold text-red-400">{totalMissKeys}</span></div>
          <div>AZIK: <span className="font-bold text-yellow-400">{getRealtimeAzikRatio()}%</span></div>
          <div>SAVED: <span className="font-bold text-cyan-300">{getRealtimeSavedKeys()}</span></div>
        </div>

        {/* AZIKヒント表 */}
        {settings.showTable && currentSeg && (
          <div className="w-full p-3 bg-zinc-800/80 border-2 border-dashed border-green-800 rounded text-xs leading-relaxed text-left flex flex-col gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="font-bold text-green-300 flex justify-between font-pixel">
              <span>💡 AZIK HINT:</span>
              <span className="animate-pulse">{isEffectivelyTraining ? (settings.isFullTraining ? "TRAINING/FULL" : "TRAINING/FOCUS") : "NORMAL"}</span>
            </div>
            <div className="font-sans text-zinc-200 border-b border-zinc-700 pb-1.5 mb-1 h-10 overflow-y-auto chip-scroll">
              {azikHint}
            </div>
            <p className="opacity-75 font-sans text-xs min-h-[1.25rem]">
              {currentSeg.kana.endsWith("ん") && currentSeg.kana.length > 1
                ? "💡 撥音拡張: 子音の直後に、母音の1つ下のキー（z, k, j, d, l）で「〜ん」を短縮入力！"
                : ["あい", "うう", "えい", "おう"].some(v => currentSeg.kana.endsWith(v))
                ? "💡 二重母音短縮: 子音の直後に隣のキー（q, h, w, p）で二重母音を短縮入力！"
                : currentSeg.kana === "ん"
                ? "💡 「ん」単体は [q] で一発入力できます！"
                : currentSeg.kana === "っ"
                ? "💡 「っ」単体は [;] で一発入力できます！"
                : ["しゃ","しゅ","しょ","ちゃ","ちゅ","ちょ","じゃ","じゅ","じょ"].includes(currentSeg.kana)
                ? "💡 拗音短縮: シャ行 [x]、チャ行 [c]、ジャ行 [j] で2打鍵！"
                : " "}
            </p>
          </div>
        )}

        {/* 戻るボタン + 音量コントロール */}
        <div className="flex items-center justify-between mt-1">
          <GameButton variant="ghost" size="sm" onClick={onBackToStageSelect}>
            STAGE SELECT
          </GameButton>
          <VolumeControl
            volume={settings.soundVolume}
            theme={settings.soundTheme}
            onVolumeChange={v => onUpdateSettings({ ...settings, soundVolume: v })}
          />
        </div>
      </div>

    </FairyScreenLayout>
  );
}
