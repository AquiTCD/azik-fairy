"use client";

import React, { useState, useRef, useEffect } from "react";
import { AzikMapping } from "@/data/azikRules";
import { AzikLevel, classifyAzikKey } from "@/data/stages/wordValidator";
import { UserDictConfig } from "@/data/userDictConfig";

interface AzikKeyConfigTableProps {
  config: UserDictConfig;
  baseDict: Record<string, AzikMapping>;
  onSetKanaKeys: (kana: string, cfg: { normal: string[]; azik: string[] }) => void;
}

type GroupKey = "Lev1ab" | "Lev1c" | "Lev1d" | "Lev2a" | "Lev2b" | "Lev3a" | "Lev3b" | "Lev4";

const GROUP_LABELS: Record<GroupKey, string> = {
  Lev1ab: "■ っ / ん 基本 (っ=; ん=q)",
  Lev1c:  "■ し行 x系 (しゃ=xa, しん=xz, しい=xq)",
  Lev1d:  "■ ち行 c系 (ちゃ=ca, ちん=cz, ちい=cq)",
  Lev2a:  "■ 撥音拡張 Z系 (かん=kz, きん=kk, くん=kj)",
  Lev2b:  "■ 二重母音 Q/H/P系 (かい=kq, こう=kp, かー=kh)",
  Lev3a:  "■ 長音・G代用・F互換 (ー=: / きゃ=kga / き=kf)",
  Lev3b:  "■ 旧互換キー (zc / zf / sf / ss)",
  Lev4:   "■ 語短縮 (こと=kt / もの=mn / する=sr)",
};

function getGroupForAzikLevel(level: AzikLevel): GroupKey | null {
  switch (level) {
    case AzikLevel.Lev1a:
    case AzikLevel.Lev1b:
      return "Lev1ab";
    case AzikLevel.Lev1c:
      return "Lev1c";
    case AzikLevel.Lev1d:
      return "Lev1d";
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

export default function AzikKeyConfigTable({ config, baseDict, onSetKanaKeys }: AzikKeyConfigTableProps) {
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
    Lev1ab: true,
    Lev1c: false,
    Lev1d: false,
    Lev2a: false,
    Lev2b: false,
    Lev3a: false,
    Lev3b: false,
    Lev4: false,
  });

  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [addInput, setAddInput] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingFor !== null) addInputRef.current?.focus();
  }, [addingFor]);

  const toggleGroup = (g: GroupKey) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const grouped: Record<GroupKey, string[]> = {
    Lev1ab: [], Lev1c: [], Lev1d: [], Lev2a: [], Lev2b: [], Lev3a: [], Lev3b: [], Lev4: [],
  };

  for (const [kana, mapping] of Object.entries(baseDict)) {
    const normalSet = new Set(mapping.normal);
    const hasAzikKey = mapping.azik.some(k => !normalSet.has(k));
    if (!hasAzikKey) continue;
    const group = classifyKana(mapping.azik);
    if (group !== null) grouped[group].push(kana);
  }

  const commitAdd = (kana: string, effectiveAzik: string[], normal: string[]) => {
    const key = addInput.trim().toLowerCase();
    if (key && !effectiveAzik.includes(key)) {
      onSetKanaKeys(kana, { normal, azik: [...effectiveAzik, key] });
    }
    setAddingFor(null);
    setAddInput("");
  };

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
                  const isAllDisabled = effectiveAzik.length === 0 && baseMapping.azik.length > 0;
                  const isModified = userEntry !== undefined;

                  return (
                    <div key={kana} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 flex-wrap">
                      {/* かな */}
                      <span className="w-8 text-center text-base font-bold text-zinc-300 shrink-0">{kana}</span>

                      {/* 通常ローマ字 */}
                      <div className="flex gap-1 flex-wrap shrink-0">
                        {baseMapping.normal.map(k => (
                          <span key={k} className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 border border-zinc-600 rounded text-zinc-400">{k}</span>
                        ))}
                      </div>

                      <span className="text-zinc-600 text-xs shrink-0">|</span>

                      {/* AZIKキー chips */}
                      <div className="flex gap-1 flex-wrap flex-1 items-center">
                        {baseMapping.azik.map(k => {
                          const inEffective = effectiveAzik.includes(k);
                          if (inEffective) {
                            return (
                              <span
                                key={k}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono border rounded ${
                                  isModified
                                    ? "bg-zinc-900 border-yellow-700 text-yellow-300"
                                    : "bg-zinc-900 border-green-800 text-green-400"
                                }`}
                              >
                                {k}
                                <button
                                  onClick={() => {
                                    const newAzik = effectiveAzik.filter(a => a !== k);
                                    onSetKanaKeys(kana, { normal: baseMapping.normal, azik: newAzik });
                                  }}
                                  title={`「${k}」を無効化`}
                                  className="ml-0.5 text-zinc-500 hover:text-red-400 cursor-pointer leading-none"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          } else {
                            // 無効化されたキー → クリックで再有効化
                            return (
                              <button
                                key={k}
                                onClick={() => {
                                  onSetKanaKeys(kana, { normal: baseMapping.normal, azik: [...effectiveAzik, k] });
                                }}
                                title={`「${k}」を再有効化`}
                                className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono border rounded bg-zinc-900 border-red-900 text-red-500 line-through opacity-60 hover:opacity-100 hover:border-green-700 hover:text-green-400 hover:no-underline cursor-pointer transition-all"
                              >
                                {k}
                              </button>
                            );
                          }
                        })}

                        {/* ユーザー追加の新しいAZIKキー（ベースに存在しないもの） */}
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
                                  onSetKanaKeys(kana, { normal: baseMapping.normal, azik: newAzik });
                                }}
                                title={`追加キー「${k}」を削除`}
                                className="ml-0.5 text-zinc-500 hover:text-red-400 cursor-pointer leading-none"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        }

                        {/* + カスタムキー追加 */}
                        {addingFor === kana ? (
                          <input
                            ref={addInputRef}
                            value={addInput}
                            onChange={e => setAddInput(e.target.value.toLowerCase())}
                            onKeyDown={e => {
                              if (e.key === "Enter") commitAdd(kana, effectiveAzik, baseMapping.normal);
                              if (e.key === "Escape") { setAddingFor(null); setAddInput(""); }
                            }}
                            onBlur={() => commitAdd(kana, effectiveAzik, baseMapping.normal)}
                            className="w-14 px-1 py-0.5 text-[10px] font-mono bg-zinc-800 border border-cyan-600 text-cyan-300 rounded outline-none"
                            placeholder="key↵"
                          />
                        ) : (
                          <button
                            onClick={() => { setAddingFor(kana); setAddInput(""); }}
                            title="AZIKキーを追加"
                            className="px-1.5 py-0.5 text-[10px] font-mono border rounded bg-zinc-900 border-zinc-600 text-zinc-500 hover:border-cyan-600 hover:text-cyan-400 cursor-pointer transition-colors"
                          >
                            +
                          </button>
                        )}
                      </div>

                      {/* ステータスバッジ */}
                      {isAllDisabled && (
                        <span className="text-[9px] text-red-400 font-pixel shrink-0">DISABLED</span>
                      )}
                      {isModified && !isAllDisabled && (
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
