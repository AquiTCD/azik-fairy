"use client";

import React from "react";
import { GameStats, GameSettings } from "@/types/game";
import { Ad } from "@/data/adData";
import { STAGES } from "@/data/stages";
import { getNextStageId } from "@/utils/gameLogic";
import { buildTweetUrl } from "@/utils/tweetUtils";
import { resultComments } from "@/data/resultComments";
import { WEAKNESS_STAGE_ID } from "@/constants/game";
import FairyScreenLayout from "./FairyScreenLayout";
import KeyboardDiagram from "./KeyboardDiagram";
import AdBanner from "./AdBanner";
import GameButton from "./GameButton";
import KeyNavGroup from "./KeyNavGroup";
import XIcon from "./XIcon";

const SHARE_BTN_CLASS = "w-full font-pixel font-bold tracking-wider rounded transition-all duration-150 bg-sky-950 text-sky-300 border-2 border-sky-500 hover:bg-sky-500 hover:text-white focus:bg-sky-500 focus:text-white focus:outline-none px-6 py-4 flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

interface ResultScreenProps {
  stats: GameStats;
  selectedStageId: string | null;
  settings: GameSettings;
  resultAds: Ad[];
  onStartStage: (id: string) => void;
  onStartWeaknessPractice: () => void;
  onGoToStageSelect: () => void;
  onGoToTitle: () => void;
}

export default function ResultScreen({
  stats,
  selectedStageId,
  settings,
  resultAds,
  onStartStage,
  onStartWeaknessPractice,
  onGoToStageSelect,
  onGoToTitle,
}: ResultScreenProps) {
  const isWeaknessResult = selectedStageId === WEAKNESS_STAGE_ID;
  const stageMeta = selectedStageId && !isWeaknessResult ? STAGES.find(s => s.id === selectedStageId) : null;
  const stageTitle = stageMeta?.name ?? (isWeaknessResult ? "弱点練習" : selectedStageId ?? "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const isPracticeOrChallengeStage = stageMeta?.category === "Practice" || stageMeta?.category === "Challenge";
  const isTrainingShare = !isPracticeOrChallengeStage || settings.isTraining;
  const tweetUrl = buildTweetUrl(stats, stageTitle, isTrainingShare, origin);

  const hasHeat = stats.keyHeatmap && Object.values(stats.keyHeatmap).some(e => e.attempt >= 3 && e.miss / e.attempt >= 0.2);

  return (
    <FairyScreenLayout
      fairy={{
        message: resultComments[stats.comment] || stats.comment,
        emotion: stats.rank === "PERFECT" ? "perfect" : stats.rank === "A" ? "proud" : "happy",
      }}
      fairyColClassName="animate-in fade-in zoom-in-95 duration-500 flex flex-col gap-4"
      fairySlot={
        <>
          {hasHeat && (
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
          )}
          <AdBanner ads={resultAds} layout="vertical" />
        </>
      }
    >
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

        <KeyNavGroup className="flex flex-col gap-3 w-full">
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className={SHARE_BTN_CLASS}>
            <XIcon className="w-5 h-5" />
            <span className="text-sm">{isTrainingShare ? "POST TRAINING" : "POST RESULT"}</span>
          </a>
          {!isWeaknessResult && selectedStageId && getNextStageId(selectedStageId) && (
            <GameButton variant="primary" size="md" onClick={() => onStartStage(getNextStageId(selectedStageId)!)} className="w-full">
              NEXT STAGE &gt;
            </GameButton>
          )}
          {selectedStageId && (
            <GameButton variant="secondary" size="md" onClick={isWeaknessResult ? onStartWeaknessPractice : () => onStartStage(selectedStageId)} className="w-full">
              RETRY STAGE
            </GameButton>
          )}
          <GameButton variant="ghost" size="sm" onClick={onGoToStageSelect} className="w-full">
            STAGE SELECT
          </GameButton>
          <GameButton variant="danger" size="sm" onClick={onGoToTitle} className="w-full">
            BACK TO TITLE
          </GameButton>
        </KeyNavGroup>
      </div>
    </FairyScreenLayout>
  );
}
