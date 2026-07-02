"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { StageData, AzikMapping, AZIK_DICTIONARY } from "@/data/azikRules";
import { STAGES, StageMeta } from "@/data/stages";
import { isStageEnabled } from "@/data/stages/wordValidator";
import { GameSettings, StageProgress, WeaknessStat } from "@/types/game";
import { getWeaknessRanking } from "@/utils/gameLogic";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";
import StageCard from "@/components/StageCard";

interface StageSelectorProps {
  onSelectStage: (stageId: string) => void;
  onBackToTitle: () => void;
  flowMode: "training" | "challenge";
  progress?: Record<string, StageProgress>;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  weaknessStats?: Record<string, WeaknessStat>;
  onStartWeaknessPractice?: () => void;
  effectiveDict?: Record<string, AzikMapping>;
}


type CategoryType = StageData["category"];

// TRAINING flow 用カテゴリ（Levのみ、Practice/SKKを除外）
const TRAINING_CATEGORIES = [
  { id: "Lev1",  label: "単打",    sub: "っ/ん/シャ/チャ" },
  { id: "Lev2a", label: "撥音",    sub: "○ん拡張" },
  { id: "Lev2b", label: "二重母音", sub: "○い/○う拡張" },
  { id: "Lev3a", label: "互換I",   sub: "長音/G/F" },
  { id: "Lev3b", label: "互換II",  sub: "ZC/ZF/SF..." },
  { id: "Lev4",  label: "語短縮",  sub: "こと/もの..." },
] as const;

export default function StageSelector({
  onSelectStage, onBackToTitle, flowMode, progress, settings, onUpdateSettings, weaknessStats, onStartWeaknessPractice, effectiveDict,
}: StageSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("Lev1");

  const isChallenge = flowMode === "challenge";
  const weaknessKeys = weaknessStats ? getWeaknessRanking(weaknessStats) : [];
  const hasWeakness = weaknessKeys.length > 0 && !!onStartWeaknessPractice;

  // CHALLENGE flow: Practice + Challenge stages combined
  const challengeFlowPractice = STAGES.filter(s => s.category === "Practice");
  const challengeFlowChallenge = STAGES.filter(s => s.category === "Challenge");

  // TRAINING flow: active category stages
  const filteredStages = STAGES.filter(s =>
    s.category === activeCategory
  );

  const categories = TRAINING_CATEGORIES;

  const dict = effectiveDict ?? AZIK_DICTIONARY;
  const isStageOn = (stageId: string) => isStageEnabled(stageId, dict);
  const isCategoryOn = (catId: string) =>
    STAGES.filter(s => s.category === catId).some(s => isStageOn(s.id));

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stageRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const backButtonRef = useRef<HTMLButtonElement | null>(null);

  const enabledTabIndices = categories
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => isCategoryOn(c.id))
    .map(({ i }) => i);

  useEffect(() => {
    if (isChallenge) {
      setTimeout(() => stageRefs.current[0]?.focus(), 50);
    } else {
      const activeCatIdx = categories.findIndex(c => c.id === activeCategory);
      const timer = setTimeout(() => {
        tabRefs.current[activeCatIdx]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    const pos = enabledTabIndices.indexOf(idx);
    if (pos === -1) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = enabledTabIndices[(pos + 1) % enabledTabIndices.length];
      setActiveCategory(categories[next].id);
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = enabledTabIndices[(pos - 1 + enabledTabIndices.length) % enabledTabIndices.length];
      setActiveCategory(categories[prev].id);
      tabRefs.current[prev]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isCategoryOn(categories[idx].id)) {
        setActiveCategory(categories[idx].id);
        setTimeout(() => stageRefs.current[0]?.focus(), 0);
      }
    }
  }, [enabledTabIndices, categories, settings]);

  const handleStageKeyDown = useCallback((e: React.KeyboardEvent, idx: number, total: number, onTabUp?: () => void) => {
    const cols = window.innerWidth >= 768 ? 2 : 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (idx + cols >= total) {
        backButtonRef.current?.focus();
      } else {
        stageRefs.current[idx + cols]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx - cols >= 0) {
        stageRefs.current[idx - cols]?.focus();
      } else {
        onTabUp?.();
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stageRefs.current[Math.min(idx + 1, total - 1)]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stageRefs.current[Math.max(idx - 1, 0)]?.focus();
    }
  }, []);


  const getFairyMessage = () => {
    if (isChallenge) return "実戦・お題ステージを選んでね！CHALLENGEモードでスコアが記録されるよ💎";
    const cat = categories.find(c => c.id === activeCategory);
    return `${cat?.label ?? ""}の練習ステージを選んでね！クリアするごとに星が増えてくよ⭐💎`;
  };

  return (
    <FairyScreenLayout fairy={{ message: getFairyMessage(), emotion: "idle" }}>
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center animate-pulse tracking-widest border-b-2 border-green-500 pb-2 w-full font-pixel">
          {isChallenge ? "= SELECT STAGE =" : "= SELECT LESSON ="}
        </h2>

        {/* モードインジケーター */}
        {isChallenge ? (
          /* CHALLENGE flow: Training/Challenge toggle */
          <div className="flex gap-2 w-full items-stretch">
            <button
              onClick={() => onUpdateSettings({ ...settings, isTraining: true })}
              className={`flex-1 py-1.5 text-xs font-pixel font-bold border-2 transition-all duration-150 cursor-pointer ${
                settings.isTraining
                  ? "bg-green-500 text-black border-green-500"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-green-500"
              }`}
            >
              TRAINING
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, isTraining: false })}
              className={`flex-1 py-1.5 text-xs font-pixel font-bold border-2 transition-all duration-150 cursor-pointer ${
                !settings.isTraining
                  ? "bg-yellow-500 text-black border-yellow-500"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-yellow-500"
              }`}
            >
              CHALLENGE
            </button>
          </div>
        ) : (
          /* TRAINING flow: mode badge + FOCUS/FULL toggle */
          <div className="flex gap-2 w-full items-center">
            <span className="text-[10px] font-pixel font-bold px-2 py-1 border text-green-300 border-green-700 bg-green-950">
              TRAINING
            </span>
            <div className="flex border border-zinc-700">
              {([
                { value: false, label: "FOCUS" },
                { value: true,  label: "FULL" },
              ] as const).map(({ value, label }, idx) => (
                <button
                  key={label}
                  onClick={() => onUpdateSettings({ ...settings, isFullTraining: value })}
                  className={`px-3 py-1 text-[10px] font-pixel font-bold transition-all duration-150 cursor-pointer ${
                    idx === 0 ? "border-r border-zinc-700" : ""
                  } ${
                    settings.isFullTraining === value
                      ? "bg-green-500 text-black"
                      : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TRAINING flow: カテゴリタブ */}
        {!isChallenge && (
          <div
            role="tablist"
            aria-label="レッスンカテゴリ"
            className="flex w-full gap-1 border-b border-green-950 pb-4"
          >
            {categories.map((cat, idx) => {
              const enabled = isCategoryOn(cat.id);
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  ref={el => { tabRefs.current[idx] = el; }}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => enabled && setActiveCategory(cat.id)}
                  onKeyDown={e => handleTabKeyDown(e, idx)}
                  disabled={!enabled}
                  title={!enabled ? "この機能はOFFになっています (設定から変更できます)" : undefined}
                  className={`flex-1 min-w-0 px-1 py-2 text-xs font-bold border-2 text-center transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] leading-tight focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:ring-offset-zinc-900 ${
                    !enabled
                      ? "opacity-35 cursor-not-allowed bg-zinc-900 text-zinc-600 border-zinc-700"
                      : isActive
                        ? "cursor-pointer bg-green-500 text-black border-green-500"
                        : "cursor-pointer bg-zinc-800 text-green-400 border-zinc-700 hover:border-green-500"
                  }`}
                >
                  <span className="font-sans">{cat.label}</span>
                  {cat.sub && <span className="text-[9px] opacity-70 block font-sans">{cat.sub}</span>}
                  {!enabled && <span className="text-[8px] block text-zinc-500 font-sans">OFF</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* CHALLENGE flow: 弱点練習 */}
        {isChallenge && hasWeakness && (
          <button
            onClick={onStartWeaknessPractice}
            className="w-full flex items-center justify-between px-4 py-3 bg-orange-950 border-2 border-orange-500 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-orange-900 transition-colors duration-150 cursor-pointer"
          >
            <div className="text-left">
              <span className="text-sm font-bold font-pixel text-orange-300">🎯 弱点練習</span>
              <span className="text-[10px] text-orange-400 font-sans block">苦手キー Top {weaknessKeys.length}パターンに絞った集中練習（30語）</span>
            </div>
            <span className="text-orange-400 font-pixel text-xs border border-orange-500 px-2 py-1 rounded">START</span>
          </button>
        )}

        {/* ステージ一覧 */}
        <div
          role="tabpanel"
          className="w-full flex flex-col gap-4 overflow-y-auto h-[360px] pr-2 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-zinc-900"
        >
          {isChallenge ? (
            /* CHALLENGE flow: Practice + Challenge combined */
            (() => {
              const total = challengeFlowPractice.length + challengeFlowChallenge.length;
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {challengeFlowPractice.map((stage, idx) => (
                      <StageCard
                        key={stage.id}
                        stage={stage}
                        badgeLabel="実戦"
                        subIdx={idx}
                        enabled={true}
                        stageProg={progress?.[stage.id]}
                        tabIndex={idx === 0 ? 0 : -1}
                        innerRef={el => { stageRefs.current[idx] = el; }}
                        onClick={() => onSelectStage(stage.id)}
                        onKeyDown={e => handleStageKeyDown(e, idx, total, () => {})}
                        settings={settings}
                        showIntroPreview={false}
                      />
                    ))}
                  </div>
                  {challengeFlowChallenge.length > 0 && (
                    <div className="border-t-2 border-zinc-700 pt-3">
                      <p className="text-[10px] font-pixel text-zinc-500 mb-2">お題</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {challengeFlowChallenge.map((stage, idx) => (
                          <StageCard
                            key={stage.id}
                            stage={stage}
                            badgeLabel="お題"
                            subIdx={idx}
                            enabled={true}
                            stageProg={progress?.[stage.id]}
                            tabIndex={challengeFlowPractice.length + idx === 0 ? 0 : -1}
                            innerRef={el => { stageRefs.current[challengeFlowPractice.length + idx] = el; }}
                            onClick={() => onSelectStage(stage.id)}
                            onKeyDown={e => handleStageKeyDown(e, challengeFlowPractice.length + idx, total, () => {})}
                            settings={settings}
                            showIntroPreview={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            /* TRAINING flow: active category stages */
            <>
              {!isCategoryOn(activeCategory) && (
                <div className="text-center text-zinc-500 text-sm py-8 font-sans">
                  このカテゴリの AZIK キーが全て無効です。<br />
                  <span className="text-xs">設定の MY AZIK CONFIG でキーを有効にしてください。</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStages.map((stage: StageMeta, index: number) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    badgeLabel={categories.find(c => c.id === activeCategory)?.label ?? activeCategory}
                    subIdx={index}
                    enabled={isStageOn(stage.id)}
                    stageProg={progress?.[stage.id]}
                    tabIndex={index === 0 ? 0 : -1}
                    innerRef={el => { stageRefs.current[index] = el; }}
                    onClick={() => onSelectStage(stage.id)}
                    onKeyDown={e => handleStageKeyDown(e, index, filteredStages.length, () => {
                      const activeCatIdx = categories.findIndex(c => c.id === activeCategory);
                      tabRefs.current[activeCatIdx]?.focus();
                    })}
                    settings={settings}
                    showIntroPreview={!["Practice", "Challenge"].includes(stage.category)}
                    effectiveDict={effectiveDict}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <GameButton
          variant="danger"
          size="sm"
          onClick={onBackToTitle}
          ref={backButtonRef}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const total = isChallenge
                ? challengeFlowPractice.length + challengeFlowChallenge.length
                : filteredStages.length;
              stageRefs.current[total - 1]?.focus();
            }
          }}
        >
          BACK
        </GameButton>
      </div>
    </FairyScreenLayout>
  );
}
