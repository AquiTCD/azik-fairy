"use client";

import React, { useState } from "react";
import { StageData } from "@/data/azikRules";
import { STAGES, StageMeta } from "@/data/stages";
import { GameSettings, StageProgress } from "@/app/page";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";

interface StageSelectorProps {
  onSelectStage: (stageId: string) => void;
  onBackToTitle: () => void;
  progress?: Record<string, StageProgress>;
  settings: GameSettings;
}

// カテゴリが使用可能かどうかを判定
function isCategoryEnabled(categoryId: string, settings: GameSettings): boolean {
  if (categoryId === "Lev4") return settings.enableSpecial;
  return true;
}

type CategoryType = StageData["category"];

export default function StageSelector({ onSelectStage, onBackToTitle, progress, settings }: StageSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("Lev1");

  // カテゴリ別のステージ抽出
  const filteredStages = STAGES.filter(s => s.category === activeCategory);

  const categories = [
    { id: "Lev1",      label: "基礎",  sub: "単打拡張" },
    { id: "Lev2a",    label: "応用①", sub: "撥音" },
    { id: "Lev2b",    label: "応用②", sub: "二重母音" },
    { id: "Lev3a",    label: "発展①", sub: "互換I" },
    { id: "Lev3b",    label: "発展②", sub: "互換II" },
    { id: "Lev4",     label: "特殊",  sub: "語短縮" },
    { id: "Practice", label: "実戦",  sub: "ランダム50件" },
    { id: "Challenge", label: "お題", sub: "全文通し" },
  ] as const;

  const getFairyMessage = () => {
    const cat = categories.find(c => c.id === activeCategory);
    return `${cat?.label ?? ""}の練習ステージを選んでね！クリアするごとに星が増えてくよ⭐💎`;
  };

  return (
    <FairyScreenLayout fairy={{ message: getFairyMessage(), emotion: "idle" }}>
      <div className="flex-1 flex flex-col gap-4">
      <h2 className="text-2xl md:text-3xl font-bold text-center animate-pulse tracking-widest border-b-2 border-green-500 pb-2 w-full font-pixel">
        = SELECT LESSON =
      </h2>

      {/* カテゴリタブ切り替え */}
      <div className="flex flex-wrap gap-2 w-full justify-center border-b border-green-950 pb-4">
        {categories.map(cat => {
          const enabled = isCategoryEnabled(cat.id, settings);
          return (
            <button
              key={cat.id}
              onClick={() => enabled && setActiveCategory(cat.id)}
              disabled={!enabled}
              title={!enabled ? "この機能はOFFになっています (設定から変更できます)" : undefined}
              className={`px-3 py-2 text-xs md:text-sm font-bold border-2 transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] leading-tight ${
                !enabled
                  ? "opacity-35 cursor-not-allowed bg-zinc-900 text-zinc-600 border-zinc-700"
                  : activeCategory === cat.id
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

      {/* ステージリストコンテナ */}
      <div className="w-full flex flex-col gap-4 overflow-y-auto h-[360px] pr-2 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-zinc-900">
        {!isCategoryEnabled(activeCategory, settings) && (
          <div className="text-center text-zinc-500 text-sm py-8 font-sans">
            このカテゴリの機能はOFFになっています。<br />
            <span className="text-xs">設定画面の AZIK FEATURES から有効にできます。</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStages.map((stage: StageMeta, index: number) => {
            const stageProg = progress?.[stage.id];
            const categoryEnabled = isCategoryEnabled(activeCategory, settings);
            return (
              <button
                key={stage.id}
                onClick={() => categoryEnabled && onSelectStage(stage.id)}
                disabled={!categoryEnabled}
                className={`flex flex-col items-start p-5 border-2 transition-all duration-150 text-left rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full ${
                  categoryEnabled
                    ? "bg-zinc-800 border-green-500 hover:bg-green-500 hover:text-black group cursor-pointer"
                    : "bg-zinc-900 border-zinc-700 opacity-40 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-green-500 text-black font-bold group-hover:bg-black group-hover:text-green-500">
                      <span className="font-sans">{categories.find(c => c.id === activeCategory)?.label ?? activeCategory}</span><span className="font-sans">-{index + 1}</span>
                    </span>
                    <span className="text-lg font-bold tracking-wider font-sans">{stage.name}</span>
                  </div>

                  {/* 星の表示 */}
                  {stageProg && (
                    <span className="text-yellow-400 font-bold font-pixel group-hover:text-yellow-900 text-sm">
                      {"★".repeat(stageProg.stars) + "☆".repeat(3 - stageProg.stars)}
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-80 leading-relaxed font-sans text-zinc-300 group-hover:text-zinc-900 flex-grow mb-2">
                  {stage.description}
                </p>

                {/* ベストスコア表示 */}
                {stageProg && (
                  <div className="text-[10px] font-pixel text-green-300 group-hover:text-zinc-800 border-t border-green-900/40 group-hover:border-zinc-900/40 pt-1.5 w-full flex justify-between">
                    <span>BEST: <span className="font-bold">{stageProg.bestWpm}</span> WPM</span>
                    <span>ACC: <span className="font-bold">{stageProg.bestAccuracy}%</span></span>
                    <span>TIME: <span className="font-bold">{stageProg.bestTime.toFixed(1)}s</span></span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <GameButton variant="danger" size="sm" onClick={onBackToTitle}>
        BACK TO TITLE
      </GameButton>
      </div>{/* 左カラム end */}
    </FairyScreenLayout>
  );
}
