"use client";

import React, { useState } from "react";
import { AZIK_DICTIONARY, AzikMapping } from "@/data/azikRules";
import { AzikLevel, classifyAzikKey } from "@/data/stages/wordValidator";
import { UserDictConfig } from "@/data/userDictConfig";

interface AzikKeyConfigTableProps {
  config: UserDictConfig;
  baseDict: Record<string, AzikMapping>;
  onSetKanaKeys: (kana: string, cfg: { normal: string[]; azik: string[] }) => void;
}

type GroupKey = "Lev1" | "Lev2a" | "Lev2b" | "Lev3a" | "Lev3b" | "Lev4";

const GROUP_LABELS: Record<GroupKey, string> = {
  Lev1:  "■ 基本ショートカット (ん/っ/ー)",
  Lev2a: "■ 撥音 Z系 (かん=kz)",
  Lev2b: "■ 二重母音 Q系 (かい=kq)",
  Lev3a: "■ 長音 H/P/W系",
  Lev3b: "■ 拗音 G系 (きゃ=kga)",
  Lev4:  "■ ち行/し行/複合系 (ちゃ=ca)",
};

function getGroupForAzikLevel(level: AzikLevel): GroupKey | null {
  switch (level) {
    case AzikLevel.Lev1a:
    case AzikLevel.Lev1b:
    case AzikLevel.Lev1c:
    case AzikLevel.Lev1d:
      return "Lev1";
    case AzikLevel.Lev2a:
      return "Lev2a";
    case AzikLevel.Lev2b:
      return "Lev2b";
    case AzikLevel.Lev3a:
      return "Lev3a";
    case AzikLevel.Lev3b:
      return "Lev3b";
    case AzikLevel.Lev4:
      return "Lev4";
    default:
      return null;
  }
}

function classifyKana(baseAzik: string[]): GroupKey | null {
  for (const key of baseAzik) {
    const level = classifyAzikKey(key);
    const group = getGroupForAzikLevel(level);
    if (group !== null) return group;
  }
  return null;
}

// base と user の azik 配列が同一かを判定
function azikSameAsBase(baseAzik: string[], userAzik: string[]): boolean {
  if (baseAzik.length !== userAzik.length) return false;
  const userSet = new Set(userAzik);
  return baseAzik.every(k => userSet.has(k));
}

export default function AzikKeyConfigTable({ config, baseDict, onSetKanaKeys }: AzikKeyConfigTableProps) {
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
    Lev1: true,
    Lev2a: false,
    Lev2b: false,
    Lev3a: false,
    Lev3b: false,
    Lev4: false,
  });

  const toggleGroup = (g: GroupKey) => {
    setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));
  };

  // AZIK_DICTIONARY を走査して、azik が base.normal と異なるかなを抽出
  const grouped: Record<GroupKey, string[]> = {
    Lev1: [], Lev2a: [], Lev2b: [], Lev3a: [], Lev3b: [], Lev4: [],
  };

  for (const [kana, mapping] of Object.entries(baseDict)) {
    // azik が normal と完全同一（= AZIKキーなし）のかなはスキップ
    const normalSet = new Set(mapping.normal);
    const hasAzikKey = mapping.azik.some(k => !normalSet.has(k));
    if (!hasAzikKey) continue;

    const group = classifyKana(mapping.azik);
    if (group !== null) {
      grouped[group].push(kana);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {(Object.keys(GROUP_LABELS) as GroupKey[]).map(groupKey => {
        const kanas = grouped[groupKey];
        if (kanas.length === 0) return null;
        const isOpen = openGroups[groupKey];
        return (
          <div key={groupKey} className="border border-zinc-700 rounded overflow-hidden">
            <button
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex justify-between items-center px-3 py-2 bg-zinc-800 text-left text-xs font-pixel font-bold text-green-300 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <span>{GROUP_LABELS[groupKey]}</span>
              <span className="text-zinc-500 text-[10px]">{isOpen ? "▲" : "▼"} ({kanas.length})</span>
            </button>
            {isOpen && (
              <div className="flex flex-col divide-y divide-zinc-800">
                {kanas.map(kana => {
                  const baseMapping = baseDict[kana];
                  const userEntry = config[kana];
                  const effectiveAzik = userEntry ? userEntry.azik : baseMapping.azik;
                  const isDisabled = effectiveAzik.length === 0;
                  const isModified = userEntry !== undefined && !azikSameAsBase(baseMapping.azik, effectiveAzik);

                  return (
                    <div key={kana} className="flex items-center gap-3 px-3 py-2 bg-zinc-900">
                      {/* かな */}
                      <span className="w-8 text-center text-base font-bold text-zinc-300 shrink-0">{kana}</span>

                      {/* 通常ローマ字 */}
                      <div className="flex gap-1 flex-wrap shrink-0">
                        {baseMapping.normal.map(k => (
                          <span key={k} className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 border border-zinc-600 rounded text-zinc-400">{k}</span>
                        ))}
                      </div>

                      <span className="text-zinc-600 text-xs shrink-0">|</span>

                      {/* AZIK キー chips */}
                      <div className="flex gap-1 flex-wrap flex-1">
                        {baseMapping.azik.map(k => {
                          const inEffective = effectiveAzik.includes(k);
                          return (
                            <span
                              key={k}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono border rounded ${
                                !inEffective
                                  ? "bg-zinc-900 border-red-800 text-red-400 line-through opacity-60"
                                  : isModified
                                  ? "bg-zinc-900 border-yellow-700 text-yellow-300"
                                  : "bg-zinc-900 border-green-800 text-green-400"
                              }`}
                            >
                              {k}
                              {inEffective && (
                                <button
                                  onClick={() => {
                                    const newAzik = effectiveAzik.filter(a => a !== k);
                                    onSetKanaKeys(kana, {
                                      normal: baseMapping.normal,
                                      azik: newAzik,
                                    });
                                  }}
                                  title={`${kana} の AZIKキー「${k}」を無効化`}
                                  className="ml-0.5 text-zinc-500 hover:text-red-400 cursor-pointer leading-none"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          );
                        })}

                        {/* ユーザー追加の新しいAZIKキー */}
                        {userEntry && userEntry.azik
                          .filter(k => !baseMapping.azik.includes(k))
                          .map(k => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono border rounded bg-zinc-900 border-cyan-700 text-cyan-300"
                            >
                              {k}
                              <button
                                onClick={() => {
                                  const newAzik = effectiveAzik.filter(a => a !== k);
                                  onSetKanaKeys(kana, {
                                    normal: baseMapping.normal,
                                    azik: newAzik,
                                  });
                                }}
                                title={`${kana} の追加AZIKキー「${k}」を削除`}
                                className="ml-0.5 text-zinc-500 hover:text-red-400 cursor-pointer leading-none"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        }
                      </div>

                      {/* ステータスバッジ */}
                      {isDisabled && (
                        <span className="text-[9px] text-red-400 font-pixel shrink-0">DISABLED</span>
                      )}
                      {isModified && !isDisabled && (
                        <span className="text-[9px] text-yellow-400 font-pixel shrink-0">CUSTOM</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
