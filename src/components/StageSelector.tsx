"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { StageData } from "@/data/azikRules";
import { STAGES, StageMeta } from "@/data/stages";
import { GameSettings, StageProgress } from "@/types/game";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";
import KeyboardDiagram from "@/components/KeyboardDiagram";
import { getIntroConfig } from "@/components/AzikKeyVisualizer";

interface StageSelectorProps {
  onSelectStage: (stageId: string) => void;
  onBackToTitle: () => void;
  progress?: Record<string, StageProgress>;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
}

function isCategoryEnabled(categoryId: string, settings: GameSettings): boolean {
  if (categoryId === "Lev4") return settings.enableSpecial;
  return true;
}

type CategoryType = StageData["category"];

export default function StageSelector({ onSelectStage, onBackToTitle, progress, settings, onUpdateSettings }: StageSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("Lev1");

  const filteredStages = STAGES.filter(s =>
    activeCategory === "Practice"
      ? (s.category === "Practice" || s.category === "Challenge")
      : s.category === activeCategory
  );

  const categories = [
    { id: "Lev1",     label: "単打",    sub: "っ/ん/シャ/チャ" },
    { id: "Lev2a",   label: "撥音",    sub: "○ん拡張" },
    { id: "Lev2b",   label: "二重母音", sub: "○い/○う拡張" },
    { id: "Lev3a",   label: "互換I",   sub: "長音/G/F" },
    { id: "Lev3b",   label: "互換II",  sub: "ZC/ZF/SF..." },
    { id: "Lev4",    label: "語短縮",   sub: "こと/もの..." },
    { id: "Practice", label: "挑戦",   sub: "実戦・お題" },
  ] as const;

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stageRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 画面表示時に最初のタブへ自動フォーカス → 矢印キーを即使えるようにする
  useEffect(() => {
    const activeCatIdx = categories.findIndex(c => c.id === activeCategory);
    const timer = setTimeout(() => {
      tabRefs.current[activeCatIdx]?.focus();
    }, 50);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFairyMessage = () => {
    const cat = categories.find(c => c.id === activeCategory);
    return `${cat?.label ?? ""}の練習ステージを選んでね！クリアするごとに星が増えてくよ⭐💎`;
  };

  const enabledTabIndices = categories
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => isCategoryEnabled(c.id, settings))
    .map(({ i }) => i);

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
      if (isCategoryEnabled(categories[idx].id, settings)) {
        setActiveCategory(categories[idx].id);
        // グリッドの最初のステージにフォーカス移動
        setTimeout(() => stageRefs.current[0]?.focus(), 0);
      }
    }
  }, [enabledTabIndices, categories, settings]);

  const handleStageKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    const cols = window.innerWidth >= 768 ? 2 : 1;
    const total = filteredStages.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      stageRefs.current[Math.min(idx + cols, total - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx - cols >= 0) {
        stageRefs.current[idx - cols]?.focus();
      } else {
        // グリッド最上段からタブに戻る
        const activeCatIdx = categories.findIndex(c => c.id === activeCategory);
        tabRefs.current[activeCatIdx]?.focus();
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stageRefs.current[Math.min(idx + 1, total - 1)]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stageRefs.current[Math.max(idx - 1, 0)]?.focus();
    }
  }, [filteredStages.length, activeCategory, categories]);

  const renderStageCard = (stage: StageMeta, globalIdx: number, badgeLabel: string, subIdx: number) => {
    const stageProg = progress?.[stage.id];
    const categoryEnabled = isCategoryEnabled(activeCategory, settings);
    return (
      <button
        key={stage.id}
        ref={el => { stageRefs.current[globalIdx] = el; }}
        tabIndex={globalIdx === 0 ? 0 : -1}
        onClick={() => categoryEnabled && onSelectStage(stage.id)}
        onKeyDown={e => handleStageKeyDown(e, globalIdx)}
        disabled={!categoryEnabled}
        className={`flex flex-col items-start p-5 border-2 transition-all duration-150 text-left rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full ${
          categoryEnabled
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

        {/* B案: デスクトップホバー展開（Levカテゴリのみ） */}
        {!["Practice", "Challenge"].includes(stage.category) && (() => {
          const intro = getIntroConfig(stage.id);
          if (!intro) return null;
          const frame = intro.frames[intro.frames.length - 1];
          return (
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
          );
        })()}
      </button>
    );
  };

  return (
    <FairyScreenLayout fairy={{ message: getFairyMessage(), emotion: "idle" }}>
      <div className="flex-1 flex flex-col gap-4">
      <h2 className="text-2xl md:text-3xl font-bold text-center animate-pulse tracking-widest border-b-2 border-green-500 pb-2 w-full font-pixel">
        = SELECT LESSON =
      </h2>

      {/* TRAINING / CHALLENGE モード切り替え */}
      {(() => {
        // 実践タブ（Practice + Challenge 統合）のみ CHALLENGE 選択可能。Lev1-4 は常に TRAINING。
        const canChallenge = activeCategory === "Practice";
        const trainingActive = settings.isTraining || !canChallenge;

        return (
          <div className="flex gap-2 w-full items-stretch">
            {/* TRAINING コンテナ（左・二重枠・緑・デフォルト） */}
            <div className={`flex-1 border-4 transition-all duration-150 bg-zinc-900 ${
              trainingActive ? "border-green-500" : "border-zinc-600"
            }`}>
              <button
                onClick={() => canChallenge && onUpdateSettings({ ...settings, isTraining: true })}
                className={`w-full py-1.5 text-xs font-pixel font-bold transition-all duration-150 ${
                  trainingActive
                    ? "bg-green-500 text-black cursor-default"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer"
                }`}
              >
                TRAINING
              </button>

              {/* FOCUS / FULL サブトグル */}
              <div className="flex border-t border-zinc-700">
                {([
                  { value: false, label: "FOCUS" },
                  { value: true,  label: "FULL" },
                ] as const).map(({ value, label }, idx) => (
                  <button
                    key={label}
                    onClick={() => trainingActive && onUpdateSettings({ ...settings, isFullTraining: value })}
                    disabled={!trainingActive}
                    className={`flex-1 py-1.5 text-[10px] font-pixel font-bold transition-all duration-150 ${
                      idx === 0 ? "border-r border-zinc-700" : ""
                    } ${
                      !trainingActive
                        ? "cursor-not-allowed opacity-50 bg-zinc-900 text-zinc-600"
                        : settings.isFullTraining === value
                          ? "bg-green-500 text-black"
                          : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* CHALLENGE ボタン（右・黄色・スコアアタック） */}
            <button
              onClick={() => canChallenge && onUpdateSettings({ ...settings, isTraining: false })}
              disabled={!canChallenge}
              className={`flex-1 py-2 text-xs font-pixel font-bold border-2 transition-all duration-150 ${
                !canChallenge
                  ? "opacity-30 cursor-not-allowed bg-zinc-900 text-zinc-600 border-zinc-700"
                  : !settings.isTraining
                    ? "bg-yellow-500 text-black border-yellow-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-yellow-500 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              CHALLENGE
              <span className="text-[9px] opacity-70 block font-sans">スコアアタック</span>
            </button>
          </div>
        );
      })()}

      {/* カテゴリタブ (role=tablist + 左右矢印ナビ) */}
      <div
        role="tablist"
        aria-label="レッスンカテゴリ"
        className="flex w-full gap-1 border-b border-green-950 pb-4"
      >
        {categories.map((cat, idx) => {
          const enabled = isCategoryEnabled(cat.id, settings);
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              ref={el => { tabRefs.current[idx] = el; }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`stage-panel-${cat.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => enabled && setActiveCategory(cat.id)}
              onKeyDown={e => handleTabKeyDown(e, idx)}
              disabled={!enabled}
              title={!enabled ? "この機能はOFFになっています (設定から変更できます)" : undefined}
              className={`flex-1 min-w-0 px-1 py-2 text-xs font-bold border-2 text-center transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] leading-tight focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-zinc-900 ${
                cat.id === "Practice" ? "focus:ring-yellow-400" : "focus:ring-green-400"
              } ${
                !enabled
                  ? "opacity-35 cursor-not-allowed bg-zinc-900 text-zinc-600 border-zinc-700"
                  : isActive
                    ? cat.id === "Practice"
                      ? "cursor-pointer bg-yellow-500 text-black border-yellow-500"
                      : "cursor-pointer bg-green-500 text-black border-green-500"
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

      <div
        id={`stage-panel-${activeCategory}`}
        role="tabpanel"
        className="w-full flex flex-col gap-4 overflow-y-auto h-[360px] pr-2 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-zinc-900"
      >
        {!isCategoryEnabled(activeCategory, settings) && (
          <div className="text-center text-zinc-500 text-sm py-8 font-sans">
            このカテゴリの機能はOFFになっています。<br />
            <span className="text-xs">設定画面の AZIK FEATURES から有効にできます。</span>
          </div>
        )}
        {activeCategory === "Practice" ? (() => {
          const practiceStages = filteredStages.filter(s => s.category === "Practice");
          const challengeStages = filteredStages.filter(s => s.category === "Challenge");
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {practiceStages.map((stage, idx) => renderStageCard(stage, idx, "実戦", idx))}
              </div>
              {challengeStages.length > 0 && (
                <div className="border-t-2 border-zinc-700 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {challengeStages.map((stage, idx) => renderStageCard(stage, practiceStages.length + idx, "お題", idx))}
                  </div>
                </div>
              )}
            </>
          );
        })() : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStages.map((stage: StageMeta, index: number) =>
              renderStageCard(stage, index, categories.find(c => c.id === activeCategory)?.label ?? activeCategory, index)
            )}
          </div>
        )}
      </div>

      <GameButton variant="danger" size="sm" onClick={onBackToTitle}>
        BACK TO TITLE
      </GameButton>
      </div>
    </FairyScreenLayout>
  );
}
