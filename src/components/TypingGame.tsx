"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { TypingWord, createTypingWord, AzikSegment, StageData, mergeCustomAzikRules, calculateOptimalKeyCounts } from "@/data/azikRules";
import { loadStage } from "@/data/stages";
import { STAGE_MAX_LEVELS, AzikLevel, classifyAzikKey, isTargetSegment } from "@/data/stages/wordValidator";
import { GameSettings } from "@/app/page";
import { FairyEmotion } from "./FairyHelper";
import FairyScreenLayout from "./FairyScreenLayout";
import { GameStats } from "@/types/game";
import { getRank } from "@/utils/gameLogic";
import KeyboardDiagram from "./KeyboardDiagram";
import GameButton from "./GameButton";
import { useAzikSound } from "@/hooks/useAzikSound";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import resultComments from "../../public/data/result_comments.json";

interface TypingGameProps {
  stageId: string;
  settings: GameSettings;
  onFinish: (stats: GameStats) => void;
  onBackToStageSelect: () => void;
  onUpdateSettings: (s: GameSettings) => void;
}

export default function TypingGame({ stageId, settings, onFinish, onBackToStageSelect, onUpdateSettings }: TypingGameProps) {
  const [stage, setStage] = useState<StageData | null>(null);

  useEffect(() => {
    setStage(null);
    loadStage(stageId).then(setStage);
  }, [stageId]);

  const renderRuby = (kanji: string, kana: string) => {
    const startPunctMatch = kanji.match(/^([「『（(‘“、。！？\s]+)/);
    const endPunctMatch = kanji.match(/([」』）)’”、。！？\s]+)$/);
    
    const startPunct = startPunctMatch ? startPunctMatch[0] : "";
    const endPunct = endPunctMatch ? endPunctMatch[0] : "";
    
    const coreKanji = kanji.substring(startPunct.length, kanji.length - endPunct.length);
    
    if (coreKanji === kana || !coreKanji) {
      return (
        <span>
          {startPunct}
          {coreKanji}
          {endPunct}
        </span>
      );
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
  };

  const [words, setWords] = useState<TypingWord[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [inputBuffer, setInputBuffer] = useState("");

  const [totalCorrectKeys, setTotalCorrectKeys] = useState(0);
  const [totalMissKeys, setTotalMissKeys] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [optimalKeys, setOptimalKeys] = useState({ totalNormal: 0, totalAzik: 0 });

  const [fairyMessage, setFairyMessage] = useState("準備はおっけー？キーを押すとタイピングスタートだよ！✨");
  const [fairyEmotion, setFairyEmotion] = useState<FairyEmotion>("idle");

  const [isWiggling, setIsWiggling] = useState(false);

  // STAGE COMPLETE 中に "PRESS ANY KEY" で渡す統計
  const [pendingStats, setPendingStats] = useState<GameStats | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fairyQuotes = useRef({
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
  });

  const { playMiss, playCorrect } = useAzikSound(settings.soundEnabled);

  const getRandomQuote = (category: keyof typeof fairyQuotes.current) => {
    const quotes = fairyQuotes.current[category];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const getRealtimeSavedKeys = () => {
    let optimalNormal = 0;
    for (let i = 0; i < wordIndex; i++) {
      const w = words[i];
      w.segments.forEach(seg => {
        optimalNormal += Math.min(...seg.normal.map(p => p.length));
      });
    }
    if (wordIndex < words.length) {
      const currentWord = words[wordIndex];
      for (let j = 0; j < segmentIndex; j++) {
        const seg = currentWord.segments[j];
        optimalNormal += Math.min(...seg.normal.map(p => p.length));
      }
    }
    const confirmedCorrectKeys = totalCorrectKeys - inputBuffer.length;
    return Math.max(0, optimalNormal - confirmedCorrectKeys);
  };

  const getRealtimeAzikRatio = () => {
    let optimalNormal = 0;
    let optimalAzik = 0;
    for (let i = 0; i < wordIndex; i++) {
      const w = words[i];
      w.segments.forEach(seg => {
        optimalNormal += Math.min(...seg.normal.map(p => p.length));
        optimalAzik += Math.min(...seg.azik.map(p => p.length));
      });
    }
    if (wordIndex < words.length) {
      const currentWord = words[wordIndex];
      for (let j = 0; j < segmentIndex; j++) {
        const seg = currentWord.segments[j];
        optimalNormal += Math.min(...seg.normal.map(p => p.length));
        optimalAzik += Math.min(...seg.azik.map(p => p.length));
      }
    }
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

  const customDictionary = React.useMemo(() => {
    return mergeCustomAzikRules(settings.customRules, {
      enableSpecial: settings.enableSpecial,
      enableForeign: settings.enableForeign,
      nAlternative: settings.nAlternative,
    });
  }, [settings.customRules, settings.enableSpecial, settings.enableForeign, settings.nAlternative]);

  useEffect(() => {
    if (!stage) return;
    const isDebug = process.env.NEXT_PUBLIC_DEBUG === "true";
    const limit = isDebug ? 1 : (
      stage.category === "Challenge" ? 0 :
      stage.category === "Practice"  ? 50 :
      settings.wordsPerSession
    );
    const sourceWords = limit > 0 && stage.words.length > limit
      ? [...stage.words].sort(() => Math.random() - 0.5).slice(0, limit)
      : stage.words;
    const initializedWords = sourceWords.map(w => createTypingWord(w.kanji, w.kana, customDictionary));
    setWords(initializedWords);

    // 理論最小キー数を計算
    const counts = calculateOptimalKeyCounts(initializedWords);
    setOptimalKeys(counts);

    setWordIndex(0);
    setSegmentIndex(0);
    setInputBuffer("");
    setStartTime(null);
    setElapsedTime(0);
    setTotalCorrectKeys(0);
    setTotalMissKeys(0);
    setFairyMessage(`${stage.name}！AZIKでいくよー！何かキーを押してね！💖`);
    setFairyEmotion("idle");
  }, [stage, customDictionary]);

  useEffect(() => {
    if (startTime !== null && !isFinished()) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime]);

  const isFinished = useCallback(() => {
    return words.length > 0 && wordIndex >= words.length;
  }, [words, wordIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey || isFinished()) return;
      if (words.length === 0) return;

      let currentStartTime = startTime;
      if (startTime === null) {
        currentStartTime = Date.now();
        setStartTime(currentStartTime);
        setFairyMessage(getRandomQuote("start"));
        setFairyEmotion("excited"); // 初打鍵 → やる気モード
      }

      const key = e.key.toLowerCase();
      const currentWord = words[wordIndex];
      const currentSeg = currentWord.segments[segmentIndex];

      // Lev1-4 は常に training。Practice/Challenge は settings.isTraining で切り替え。
      const isPracticeOrChallenge = stage?.category === "Practice" || stage?.category === "Challenge";
      const effectivelyTraining = !isPracticeOrChallenge || settings.isTraining;

      const allowedPatterns = (() => {
        if (!effectivelyTraining) return [...currentSeg.normal, ...currentSeg.azik];

        const stageLevel = STAGE_MAX_LEVELS[stageId];
        // Practice/Challenge/未登録ステージは制限なし
        if (!stageLevel || stageLevel === AzikLevel.Practice || isPracticeOrChallenge) {
          return currentSeg.azik;
        }

        const isSummaryStage = stageId.includes("summary");
        const isTarget = isTargetSegment(currentSeg, stageLevel, isSummaryStage);

        if (!isTarget) {
          // 非対象セグメント: ALL は AZIK 必須、FOCUS は normal 許可
          return settings.isFullTraining
            ? currentSeg.azik
            : [...currentSeg.normal, ...currentSeg.azik];
        }

        // 対象セグメント: まとめ以外はステージレベルのキーのみ許可（Lev0 の代替キーを除外）
        if (!isSummaryStage) {
          const targetKeys = currentSeg.azik.filter(k => {
            const core = k.startsWith(";") && k.length > 1 ? k.slice(1) : k;
            return classifyAzikKey(core) === stageLevel;
          });
          if (targetKeys.length > 0) return targetKeys;
        }

        return currentSeg.azik;
      })();
      const nextBuffer = inputBuffer + key;
      const isValidPrefix = allowedPatterns.some(pattern => pattern.startsWith(nextBuffer));

      if (isValidPrefix) {
        setInputBuffer(nextBuffer);
        setTotalCorrectKeys(prev => prev + 1);

        const isCompleted = allowedPatterns.includes(nextBuffer);

        if (isCompleted) {
          playCorrect();
          setInputBuffer("");

          if (segmentIndex + 1 < currentWord.segments.length) {
            setSegmentIndex(prev => prev + 1);
          } else {
            const nextWordIndex = wordIndex + 1;
            setWordIndex(nextWordIndex);
            setSegmentIndex(0);

            if (nextWordIndex >= words.length) {
              const totalTime = Math.max((Date.now() - (currentStartTime || Date.now())) / 1000, 1);
              const totalKeys = totalCorrectKeys + 1;
              const accuracy = Math.round((totalKeys / (totalKeys + totalMissKeys)) * 100);
              const wpm = Math.round((totalKeys / totalTime) * 60);

              // AZIK度の計算
              const actualKeys = totalCorrectKeys + 1;
              const totalNormal = optimalKeys.totalNormal;
              const totalAzik = optimalKeys.totalAzik;
               const azikRatio = totalNormal > totalAzik
                 ? Math.max(0, Math.min(100, Math.round(((totalNormal - actualKeys) / (totalNormal - totalAzik)) * 100)))
                 : 100;
               const savedKeys = Math.max(0, totalNormal - actualKeys);
 
               const rank = getRank(accuracy, wpm, azikRatio);
               const commentIds = rank === "PERFECT" ? ["P1", "P2", "P3", "P4"]
                 : rank === "A" ? ["A1", "A2", "A3", "A4"]
                 : rank === "B" ? ["B1", "B2", "B3", "B4"]
                 : ["C1", "C2", "C3", "C4", "C5"];
               const commentId = commentIds[Math.floor(Math.random() * commentIds.length)];
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const commentText = (resultComments as any)[commentId] || "";
 
               setFairyMessage(commentText);
               const rankEmotion: FairyEmotion = rank === "PERFECT" ? "perfect" : rank === "A" ? "proud" : "happy";
               setFairyEmotion(rankEmotion);
               setPendingStats({ time: totalTime, wpm, accuracy, totalKeys, missCount: totalMissKeys, azikRatio, rank, comment: commentId, savedKeys });
            } else {
              setFairyMessage(getRandomQuote("correctWord"));
              setFairyEmotion("happy"); // 1単語クリア → 喜び
            }
          }
        }
      } else {
        playMiss();
        setTotalMissKeys(prev => prev + 1);
        if (settings.isTraining) {
          setIsWiggling(true);
          setFairyMessage(getRandomQuote("wrongStrict"));
          setFairyEmotion("warning");
          setTimeout(() => {
            setIsWiggling(false);
            setFairyEmotion("excited");
          }, 600);
        } else {
          setFairyMessage(getRandomQuote("wrongNormal"));
          setFairyEmotion("warning");
          setTimeout(() => setFairyEmotion("excited"), 600);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [words, wordIndex, segmentIndex, inputBuffer, startTime, totalCorrectKeys, totalMissKeys, settings.isTraining, settings.isFullTraining, isFinished, onFinish]);

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

  const azikHint = currentSeg
    ? `${currentSeg.kana} ➔ ${currentSeg.azik.map(k => `[${k}]`).join(" or ")}` +
      (!isEffectivelyTraining ? ` (通常: ${currentSeg.normal.map(k => `[${k}]`).join("/")})` : "")
    : "";

  const azikNextKeys = currentSeg
    ? currentSeg.azik.flatMap(pattern => {
        const remaining = pattern.slice(inputBuffer.length);
        return remaining.length > 0 ? [remaining[0]] : [];
      })
    : [];

  const normalNextKeys = currentSeg
    ? [...new Set(currentSeg.normal.flatMap(pattern => {
        const remaining = pattern.slice(inputBuffer.length);
        return remaining.length > 0 ? [remaining[0]] : [];
      }))].filter(k => !azikNextKeys.includes(k))
    : [];

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
      <div className={`flex-1 flex flex-col gap-4 ${isWiggling ? "animate-[wiggle_0.08s_ease-in-out_infinite]" : ""}`}>

        {/* 進捗ゲージ */}
        <div className="bg-zinc-800 border-2 border-green-500 h-7 flex items-center relative rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${(wordIndex / words.length) * 100}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference font-pixel">
            {wordIndex} / {words.length} WORDS
          </span>
        </div>

        {/* タイピングボード */}
        <div className="w-full flex flex-col items-center p-6 lg:p-8 bg-zinc-950 border-2 border-green-500 rounded-md min-h-[160px] justify-center relative shadow-[inset_4px_4px_10px_rgba(0,0,0,0.8)]">
          {/* 漢字（ルビ付き） — 常に2行分の高さを確保 */}
          <div className="flex items-center justify-center min-h-[4.5rem] md:min-h-[5rem] lg:min-h-[6rem] w-full text-center mb-2">
            <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-widest text-zinc-100 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {currentWord ? (stage?.category === "Challenge" ? currentWord.kanji : renderRuby(currentWord.kanji, currentWord.kana)) : ""}
            </div>
          </div>

          {/* ひらがなセグメント — 常に2行分の高さを確保 */}
          <div className="flex items-center justify-center min-h-[3.5rem] md:min-h-[4rem] lg:min-h-[4.5rem] w-full mb-2">
          <div className="flex flex-wrap items-center justify-center gap-x-2 text-xl md:text-2xl lg:text-3xl tracking-widest font-sans">
            {currentWord?.segments.map((seg, idx) => {
              const isTyped = idx < segmentIndex;
              const isCurrent = idx === segmentIndex;
              return (
                <span
                  key={idx}
                  className={`px-1 py-0.5 rounded transition-all duration-150 ${
                    isTyped
                      ? "text-zinc-600 line-through"
                      : isCurrent
                      ? "bg-green-900/50 text-green-300 font-bold border-b-4 border-green-400"
                      : "text-green-500"
                  }`}
                >
                  {seg.kana}
                </span>
              );
            })}
          </div>
          </div>{/* カナ wrapper end */}

          {/* キーガイド */}
          {settings.showGuide && currentSeg && (
            <div className="mt-5 flex flex-col items-center text-sm opacity-80 w-full">
              <span className="text-green-300 font-bold text-xs font-pixel">NEXT KEY:</span>
              <div className="flex gap-3 mt-2 font-pixel text-sm">
                {currentSeg.azik.map(pattern => {
                  const remaining = pattern.slice(inputBuffer.length);
                  return (
                    <div key={pattern} className="bg-zinc-800 px-3 py-1.5 border border-zinc-700 rounded text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-zinc-500">{inputBuffer}</span>
                      <span className="text-green-400 font-bold animate-pulse uppercase">{remaining}</span>
                    </div>
                  );
                })}
              </div>
              <KeyboardDiagram
                activeKeys={azikNextKeys}
                normalKeys={normalNextKeys}
                typedKeys={inputBuffer.split("").filter(Boolean)}
                layout={settings.keyboardLayout}
              />
            </div>
          )}
        </div>

        {/* モバイル用メトリクス (lg未満で表示) */}
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
            <div className="font-pixel text-zinc-200 border-b border-zinc-700 pb-1.5 mb-1">
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
                : " "}
            </p>
          </div>
        )}

        {/* 戻るボタン + 音声トグル */}
        <div className="flex items-center justify-between mt-1">
          <GameButton variant="ghost" size="sm" onClick={onBackToStageSelect}>
            STAGE SELECT
          </GameButton>
          <button
            onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
            title={settings.soundEnabled ? "音声 ON（クリックでOFF）" : "音声 OFF（クリックでON）"}
            className="p-2 border border-zinc-700 rounded text-zinc-400 hover:text-green-400 hover:border-green-700 transition-colors duration-150"
          >
            {settings.soundEnabled
              ? <SpeakerHigh size={18} weight="bold" />
              : <SpeakerSlash size={18} weight="bold" />
            }
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0) rotate(0); }
          25%       { transform: translateX(-1px) rotate(-0.5deg); }
          75%       { transform: translateX(1px) rotate(0.5deg); }
        }
      `}</style>
    </FairyScreenLayout>
  );
}
