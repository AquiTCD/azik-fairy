import React from "react";
import { StageMeta } from "@/data/stages";
import { AzikMapping } from "@/data/azikRules";
import { GameSettings, StageProgress } from "@/types/game";
import KeyboardDiagram from "@/components/KeyboardDiagram";
import { getIntroConfig } from "@/components/AzikKeyVisualizer";

interface StageCardProps {
  stage: StageMeta;
  badgeLabel: string;
  subIdx: number;
  enabled: boolean;
  stageProg?: StageProgress;
  tabIndex: number;
  innerRef: (el: HTMLButtonElement | null) => void;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  settings: GameSettings;
  showIntroPreview: boolean;
  effectiveDict?: Record<string, AzikMapping>;
}

export default function StageCard({
  stage,
  badgeLabel,
  subIdx,
  enabled,
  stageProg,
  tabIndex,
  innerRef,
  onClick,
  onKeyDown,
  settings,
  showIntroPreview,
  effectiveDict,
}: StageCardProps) {
  const intro = showIntroPreview ? getIntroConfig(stage.id, effectiveDict) : null;
  const frame = intro ? intro.frames[intro.frames.length - 1] : null;

  return (
    <button
      ref={innerRef}
      tabIndex={tabIndex}
      onClick={() => enabled && onClick()}
      onKeyDown={onKeyDown}
      disabled={!enabled}
      className={`flex flex-col items-start p-5 border-2 transition-all duration-150 text-left rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full ${
        enabled
          ? "bg-zinc-800 border-green-500 hover:bg-green-500 hover:text-black focus:bg-green-500 focus:text-black group cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:ring-offset-zinc-900"
          : "bg-zinc-900 border-zinc-700 opacity-40 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-xs px-2 py-0.5 bg-green-500 text-black font-bold font-sans group-hover:bg-black group-hover:text-green-500 group-focus:bg-black group-focus:text-green-500">
          {badgeLabel}-{subIdx + 1}
        </span>
        {stageProg && (
          <span className="text-yellow-400 font-bold font-pixel group-hover:text-yellow-900 group-focus:text-yellow-900 text-sm">
            {"★".repeat(stageProg.stars) + "☆".repeat(3 - stageProg.stars)}
          </span>
        )}
      </div>
      <div className="w-full mb-2">
        <span className="text-lg font-bold tracking-wider font-sans">{stage.name}</span>
      </div>
      <p className="text-xs opacity-80 leading-relaxed font-sans text-zinc-300 group-hover:text-zinc-900 group-focus:text-zinc-900 flex-grow mb-2">
        {stage.description}
      </p>
      {stageProg && (
        <div className="text-[10px] font-pixel text-green-300 group-hover:text-zinc-800 group-focus:text-zinc-800 border-t border-green-900/40 group-hover:border-zinc-900/40 group-focus:border-zinc-900/40 pt-1.5 w-full flex justify-between">
          <span>BEST: <span className="font-bold">{stageProg.bestWpm}</span> WPM</span>
          <span>ACC: <span className="font-bold">{stageProg.bestAccuracy}%</span></span>
          <span>TIME: <span className="font-bold">{stageProg.bestTime.toFixed(1)}s</span></span>
        </div>
      )}
      {intro && frame && (
        <div className="hidden group-hover:flex group-focus:flex pointer-events-none flex-col gap-1.5 border-t border-black/20 pt-2 mt-1 w-full">
          <div className="text-[9px] font-pixel text-black/70 font-bold">{intro.title}</div>
          <div className="bg-zinc-900 rounded p-1.5 w-full overflow-hidden" style={{ height: "84px" }}>
            <div style={{ transform: "scale(0.62)", transformOrigin: "top center" }}>
              <KeyboardDiagram
                activeKeys={frame.activeKeys}
                normalKeys={frame.normalKeys}
                layout={settings.keyboardLayout}
                showLegend={false}
              />
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
