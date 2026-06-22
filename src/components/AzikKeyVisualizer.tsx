"use client";

import React, { useEffect, useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import KeyboardDiagram from "./KeyboardDiagram";
import GameButton from "./GameButton";
import FairyScreenLayout from "./FairyScreenLayout";
import { StageMeta } from "@/data/stages";
import { AzikMapping } from "@/data/azikRules";
import { buildIntroConfig, IntroConfig, AnimFrame } from "@/data/azikIntroSpec";

export type { IntroConfig, AnimFrame };

export function getIntroConfig(
  stageId: string,
  dict?: Record<string, AzikMapping>,
): IntroConfig | null {
  return buildIntroConfig(stageId, dict);
}

interface AzikKeyVisualizerProps {
  stage: StageMeta;
  onStart: (markAsSeen: boolean) => void;
  onBackToStageSelect: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  layout: "US" | "JIS";
  effectiveDict?: Record<string, AzikMapping>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインコンポーネント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function AzikKeyVisualizer({ stage, onStart, onBackToStageSelect, soundEnabled, onToggleSound, layout, effectiveDict }: AzikKeyVisualizerProps) {
  const config = buildIntroConfig(stage.id, effectiveDict);
  const [frameIdx, setFrameIdx] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const frames = config?.frames ?? [];

  useEffect(() => {
    if (frames.length <= 1) return;
    const timer = setInterval(() => {
      setFrameIdx(prev => (prev + 1) % frames.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [frames.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onBackToStageSelect();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const btns = bottomRef.current?.querySelectorAll<HTMLButtonElement>("button");
        btns?.[1]?.focus(); // STAGE SELECT
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const btns = bottomRef.current?.querySelectorAll<HTMLButtonElement>("button");
        btns?.[0]?.focus(); // PLAY
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onBackToStageSelect]);

  const currentFrame = frames[frameIdx] ?? { activeKeys: [], normalKeys: [], label: "" };

  if (!config) {
    return (
      <FairyScreenLayout fairy={{ message: `「${stage.name}」を始めよう！`, emotion: "excited" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <h2 className="text-2xl font-bold font-pixel text-green-400">{stage.name}</h2>
          <p className="text-sm text-zinc-300">{stage.description}</p>
          <GameButton variant="primary" size="lg" onClick={() => onStart(dontShowAgain)}>PLAY</GameButton>
          <div className="flex items-center justify-between w-full mt-1">
            <GameButton variant="ghost" size="sm" onClick={onBackToStageSelect}>STAGE SELECT</GameButton>
            <button
              onClick={onToggleSound}
              title={soundEnabled ? "音声 ON（クリックでOFF）" : "音声 OFF（クリックでON）"}
              className="p-2 border border-zinc-700 rounded text-zinc-400 hover:text-green-400 hover:border-green-700 transition-colors duration-150"
            >
              {soundEnabled ? <SpeakerHigh size={18} weight="bold" /> : <SpeakerSlash size={18} weight="bold" />}
            </button>
          </div>
        </div>
      </FairyScreenLayout>
    );
  }

  return (
    <FairyScreenLayout fairy={{ message: `「${stage.name}」のルールを確認しよう！`, emotion: "idle" }}>
      <div className="flex-1 flex flex-col gap-4 w-full">
        <h2 className="text-xl md:text-2xl font-bold font-sans text-yellow-400 text-center tracking-wide border-b-2 border-green-500 pb-2">
          {config.title}
        </h2>

        <p className="text-sm text-zinc-300 leading-relaxed">{config.description}</p>

        {/* キーボードアニメーション */}
        <div className="border border-green-800 bg-zinc-950/80 rounded p-3 flex flex-col items-center gap-2">
          <div className="text-xs font-sans text-green-400 h-5 transition-all duration-300 tracking-wide">
            {currentFrame.label}
          </div>
          <KeyboardDiagram
            activeKeys={currentFrame.activeKeys}
            normalKeys={currentFrame.normalKeys}
            layout={layout}
          />
          <div className="text-[10px] text-zinc-500 font-sans h-4">
            {currentFrame.sublabel ?? ''}
          </div>
          {frames.length > 1 && (
            <div className="flex gap-1 mt-1">
              {frames.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === frameIdx ? "bg-yellow-400" : "bg-zinc-600"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 例単語 */}
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-pixel text-green-500 mb-1">EXAMPLES</div>
          <div className="grid grid-cols-2 gap-1.5">
            {config.examples.map((ex, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 flex items-center gap-2 text-xs">
                <span className="text-zinc-500 line-through text-[10px] font-pixel">{ex.from}</span>
                <span className="text-zinc-500">→</span>
                <span className="text-yellow-400 font-bold font-pixel">{ex.to}</span>
                <span className="text-zinc-400 ml-auto text-[10px] font-sans">{ex.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div ref={bottomRef} className="flex flex-col gap-2 mt-auto">
          <label className="flex items-center gap-2 text-xs text-green-400 font-sans cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="accent-green-400 w-3.5 h-3.5"
            />
            次回から表示しない
          </label>
          <GameButton variant="primary" size="lg" onClick={() => onStart(dontShowAgain)} className="w-full" autoFocus>
            PLAY
          </GameButton>
          <div className="flex items-center justify-between mt-1">
            <GameButton variant="ghost" size="sm" onClick={onBackToStageSelect}>STAGE SELECT</GameButton>
            <button
              onClick={onToggleSound}
              title={soundEnabled ? "音声 ON（クリックでOFF）" : "音声 OFF（クリックでON）"}
              className="p-2 border border-zinc-700 rounded text-zinc-400 hover:text-green-400 hover:border-green-700 transition-colors duration-150"
            >
              {soundEnabled ? <SpeakerHigh size={18} weight="bold" /> : <SpeakerSlash size={18} weight="bold" />}
            </button>
          </div>
        </div>
      </div>
    </FairyScreenLayout>
  );
}
