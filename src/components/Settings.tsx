"use client";

import React, { useState } from "react";
import { GameSettings } from "@/types/game";
import { SoundThemeName } from "@/hooks/useAzikSound";
import { AZIK_DICTIONARY } from "@/data/azikRules";
import { UserDictConfig } from "@/data/userDictConfig";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";
import AzikKeyConfigTable from "@/components/AzikKeyConfigTable";

interface SettingsProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onBackToTitle: () => void;
  onClearProgress: () => void;
  onResetStageIntros: () => void;
  onImportTable?: (text: string) => void;
  onSetKanaKeys?: (kana: string, cfg: { normal: string[]; azik: string[] }) => void;
  onResetUserDict?: () => void;
  isCustomized?: boolean;
  userDictConfig?: UserDictConfig;
}

export default function Settings({ settings, onUpdateSettings, onBackToTitle, onClearProgress, onResetStageIntros, onImportTable, onSetKanaKeys, onResetUserDict, isCustomized, userDictConfig }: SettingsProps) {
  const [introResetDone, setIntroResetDone] = useState(false);
  const [importInput, setImportInput] = useState("");

  const toggleSetting = (key: keyof Omit<GameSettings, "wordsPerSession" | "keyboardLayout" | "enableSpecial" | "soundTheme">) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <FairyScreenLayout fairy={{ message: "設定でプレイスタイルをカスタマイズしよ！キーも自由に変えられるよ💅✨", emotion: "idle" }}>
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center animate-pulse tracking-widest border-b-2 border-green-500 pb-2 w-full font-pixel">
          = OPTIONS & CUSTOM =
        </h2>

        {/* 設定コンテナ (縦スクロール対応) */}
        <div className="flex flex-col gap-6 w-full overflow-y-auto max-h-[420px] pr-2 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-zinc-900">

          {/* 基本設定セクション */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-green-300 border-b border-green-950 pb-1">■ SYSTEM SETTINGS</h3>

            {/* TRAINING MODE設定 */}
            <div className="flex flex-col gap-3 p-4 bg-zinc-800 border-2 border-green-500 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs font-bold text-green-300 tracking-wider">TRAINING MODE</span>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-zinc-300 tracking-wider">FOCUS / FULL:</span>
                <div className="flex gap-2">
                  {([
                    { value: false, label: "FOCUS", desc: "ステージ学習範囲のキーのみAZIK必須" },
                    { value: true, label: "FULL", desc: "全AZIKショートカット強制" },
                  ] as const).map(({ value, label, desc }) => (
                    <button
                      key={label}
                      onClick={() => onUpdateSettings({ ...settings, isFullTraining: value })}
                      className={`flex-1 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.isFullTraining === value
                        ? "bg-green-500 text-black border-green-500"
                        : "bg-zinc-700 text-zinc-400 border-zinc-600 hover:border-green-500"
                        }`}
                    >
                      {label}
                      <span className="text-[9px] opacity-70 block font-sans">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] md:text-xs opacity-75 font-sans leading-relaxed">
                TRAININGモードでのAZIK入力強制の範囲を設定します。<br />
                FOCUS: 現在のステージで学習するキーのみAZIK必須。<br />
                FULL: 全AZIKショートカット（学習済み含む）すべてを強制。
              </p>
            </div>

            {/* CHALLENGE MODE設定 */}
            <div className="flex flex-col gap-3 p-4 bg-zinc-800 border-2 border-yellow-700 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs font-bold text-yellow-300 tracking-wider">CHALLENGE MODE</span>
              <div className="flex justify-between items-center gap-4">
                <span className="font-bold text-sm tracking-wider">入力モード デフォルト:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, isTraining: true })}
                    className={`px-4 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.isTraining
                      ? "bg-green-500 text-black border-green-500"
                      : "bg-zinc-700 text-zinc-400 border-zinc-600 hover:border-green-500"
                      }`}
                  >
                    TRAINING
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, isTraining: false })}
                    className={`px-4 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${!settings.isTraining
                      ? "bg-yellow-500 text-black border-yellow-500"
                      : "bg-zinc-700 text-zinc-400 border-zinc-600 hover:border-yellow-500"
                      }`}
                  >
                    CHALLENGE
                  </button>
                </div>
              </div>
              <p className="text-[10px] md:text-xs opacity-75 font-sans leading-relaxed">
                CHALLENGEフローでステージを選んだときの初期モードです。<br />
                CHALLENGE（スコアアタック）時はスコアパラメータ付きでシェアできます。
              </p>
            </div>

            {/* キーガイド */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-800 border-2 border-green-500 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center gap-4">
                <span className="font-bold text-sm md:text-base tracking-wider">KEY GUIDE:</span>
                <button
                  onClick={() => toggleSetting("showGuide")}
                  className={`px-4 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.showGuide
                    ? "bg-green-500 text-black border-green-500"
                    : "bg-zinc-700 text-green-400 border-green-500"
                    }`}
                >
                  {settings.showGuide ? "SHOW" : "HIDE"}
                </button>
              </div>
              <p className="text-[10px] md:text-xs opacity-75 font-sans leading-relaxed">
                タイピング画面で、次に押すべきAZIKのキーガイドを文字の下に表示します。
              </p>
            </div>

            {/* ヒント表 */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-800 border-2 border-green-500 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center gap-4">
                <span className="font-bold text-sm md:text-base tracking-wider">AZIK HELP TABLE:</span>
                <button
                  onClick={() => toggleSetting("showTable")}
                  className={`px-4 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.showTable
                    ? "bg-green-500 text-black border-green-500"
                    : "bg-zinc-700 text-green-400 border-green-500"
                    }`}
                >
                  {settings.showTable ? "SHOW" : "HIDE"}
                </button>
              </div>
              <p className="text-[10px] md:text-xs opacity-75 font-sans leading-relaxed">
                プレイ画面下部に、現在入力中のキーに対応するAZIKの省略対応ルールを常時ヒント表示します。
              </p>
            </div>

            {/* キーボードレイアウト */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-800 border-2 border-green-500 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center gap-4">
                <span className="font-bold text-sm md:text-base tracking-wider">KEYBOARD LAYOUT:</span>
                <div className="flex gap-2">
                  {(["JIS", "US"] as const).map(layout => (
                    <button
                      key={layout}
                      onClick={() => onUpdateSettings({ ...settings, keyboardLayout: layout })}
                      className={`px-4 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.keyboardLayout === layout
                        ? "bg-green-500 text-black border-green-500"
                        : "bg-zinc-700 text-green-400 border-green-500 hover:bg-green-900"
                        }`}
                    >
                      {layout}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] md:text-xs opacity-75 font-sans leading-relaxed">
                タイピング画面のキーボード図のレイアウトを切り替えます（US配列 / JIS配列）。
              </p>
            </div>

            {/* サウンド */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-800 border-2 border-green-500 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-sm md:text-base tracking-wider">SOUND THEME:</span>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, soundEnabled: false })}
                    className={`px-3 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                      !settings.soundEnabled
                        ? "bg-green-500 text-black border-green-500"
                        : "bg-zinc-700 text-green-400 border-green-500"
                    }`}
                  >
                    OFF
                  </button>
                  {(["soft", "8bit", "typewriter"] as SoundThemeName[]).map(t => (
                    <button
                      key={t}
                      onClick={() => onUpdateSettings({ ...settings, soundEnabled: true, soundTheme: t })}
                      className={`px-3 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                        settings.soundEnabled && settings.soundTheme === t
                          ? "bg-green-500 text-black border-green-500"
                          : "bg-zinc-700 text-green-400 border-green-500"
                      }`}
                    >
                      {t === "typewriter" ? "TYPE" : t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] md:text-xs opacity-75 font-sans leading-relaxed">
                効果音のテーマを選択します。OFF / SOFT / 8BIT / TYPE の4種類。ゲーム画面からもON/OFFのみ切り替え可能です。
              </p>
            </div>

            {/* ゴーストレース */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-800 border-2 border-green-500 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center gap-4">
                <span className="font-bold text-sm md:text-base tracking-wider">GHOST RACE:</span>
                <button
                  onClick={() => toggleSetting("ghostRaceEnabled")}
                  className={`px-4 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.ghostRaceEnabled
                    ? "bg-green-500 text-black border-green-500"
                    : "bg-zinc-700 text-green-400 border-green-500"
                    }`}
                >
                  {settings.ghostRaceEnabled ? "ON" : "OFF"}
                </button>
              </div>
              <p className="text-[10px] md:text-xs opacity-75 font-sans leading-relaxed">
                ステージプレイ中に自己ベストのペースをゴーストバーで表示します。
              </p>
            </div>

            {/* セッション語彙数（練習ステージ用） */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-800 border-2 border-green-500 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center gap-4">
                <span className="font-bold text-sm md:text-base tracking-wider">WORDS / STAGE:</span>
                <div className="flex items-center gap-2">
                  {[10, 20, 30, 50, 0].map(n => (
                    <button
                      key={n}
                      onClick={() => onUpdateSettings({ ...settings, wordsPerSession: n })}
                      className={`px-3 py-1.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.wordsPerSession === n
                        ? "bg-green-500 text-black border-green-500"
                        : "bg-zinc-700 text-green-400 border-green-500 hover:bg-green-900"
                        }`}
                    >
                      {n === 0 ? "ALL" : n}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] md:text-xs opacity-75 font-sans leading-relaxed">
                基礎〜特殊の練習ステージのみ適用。ランダムサンプリングで件数を制限します。実戦は50件固定、お題は全件通し。
              </p>
            </div>
          </div>

          {/* AZIKフィーチャー設定セクション */}
          <div className="flex flex-col gap-4 mt-2">
            <h3 className="text-sm font-bold text-green-300 border-b border-green-950 pb-1">■ KEY CONFIG</h3>

            {/* AZIKフィーチャー */}
            <div className="flex flex-col gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded">
              <span className="text-sm font-extrabold font-sans text-zinc-300 tracking-wider">AZIK FEATURES:</span>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-extrabold font-sans text-green-300">特殊拡張</span>
                  <span className="text-xs text-zinc-300 ml-2 font-sans">こと[kt] もの[mn] する[sr] など Lev4 ステージ</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, enableSpecial: !settings.enableSpecial })}
                  className={`px-3 py-0.5 text-xs font-pixel font-bold border-2 flex-shrink-0 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.enableSpecial
                    ? "bg-green-500 text-black border-green-500"
                    : "bg-zinc-700 text-green-400 border-green-500"
                    }`}
                >
                  {settings.enableSpecial ? "ON" : "OFF"}
                </button>
              </div>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                OFFにすると Lev4（語短縮）の練習ステージが非表示になります。キーショートカットの有効/無効は下の MY AZIK CONFIG で個別に設定してください。
              </p>
            </div>
          </div>

          {/* MY AZIK CONFIG セクション */}
          <div className="flex flex-col gap-3 mt-2 border-t border-zinc-700 pt-4">
            <h3 className="text-sm font-bold text-cyan-400">■ MY AZIK CONFIG</h3>

            {/* インポートエリア */}
            {onImportTable && (
              <div className="flex flex-col gap-2 p-4 bg-zinc-800 border border-zinc-700 rounded">
                <div>
                  <span className="font-bold text-sm tracking-wider text-cyan-300 font-pixel">IMPORT kana-rule.conf / TSV:</span>
                  <p className="text-[10px] opacity-75 font-sans mt-1 leading-relaxed">
                    macSKK の kana-rule.conf（カンマ区切り）または Google 日本語入力のローマ字テーブル（タブ区切り TSV）をペーストすると、azik ショートカットの有効/無効が練習に反映されます。
                  </p>
                </div>
                <textarea
                  value={importInput}
                  className="w-full h-28 bg-zinc-900 border border-zinc-600 text-green-300 text-xs font-mono p-2 rounded resize-y"
                  placeholder={"# macSKK conf 例\nq,ん\n;,っ\nwz,わん\n\n# Google IME TSV 例\nq\tん\n;\tっ"}
                  onChange={(e) => setImportInput(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (importInput.trim()) {
                        onImportTable(importInput);
                        setImportInput("");
                      }
                    }}
                    className="px-3 py-1 bg-green-500 text-black font-bold text-xs border border-green-500 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-green-500 cursor-pointer font-pixel"
                  >
                    インポート適用
                  </button>
                  {isCustomized && onResetUserDict && (
                    <button
                      onClick={onResetUserDict}
                      className="px-3 py-1 bg-zinc-900 border border-zinc-600 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors rounded text-xs cursor-pointer font-bold font-pixel whitespace-nowrap"
                    >
                      RESET TO DEFAULT
                    </button>
                  )}
                  {isCustomized && (
                    <span className="text-[10px] text-cyan-400">✓ カスタム設定適用中</span>
                  )}
                </div>
              </div>
            )}

            {/* AZIKキー設定テーブル */}
            {onSetKanaKeys && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-zinc-500 font-sans">各かなの AZIK ショートカットキーを確認・カスタマイズできます。× で無効化 / 取り消し線をクリックで再有効化 / + で追加。</p>
                <AzikKeyConfigTable
                  config={userDictConfig ?? {}}
                  baseDict={AZIK_DICTIONARY}
                  onSetKanaKeys={onSetKanaKeys}
                />
              </div>
            )}
          </div>

          {/* レッスン説明リセット */}
          <div className="flex flex-col gap-3 mt-2 border-t border-zinc-700 pt-4">
            <h3 className="text-sm font-bold text-green-400">■ LESSON INTRO</h3>
            <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800 border border-zinc-700 rounded">
              <div>
                <span className="font-bold text-sm tracking-wider text-green-300">RESET INTRO HISTORY:</span>
                <p className="text-[10px] opacity-75 font-sans mt-1 leading-relaxed">ステージ開始前のAZIK解説画面をすべて再表示します。</p>
              </div>
              <button
                onClick={() => { onResetStageIntros(); setIntroResetDone(true); setTimeout(() => setIntroResetDone(false), 2000); }}
                className={`px-3 py-2 border rounded text-xs cursor-pointer font-bold font-pixel whitespace-nowrap transition-colors duration-150 ${
                  introResetDone
                    ? "bg-green-500 border-green-400 text-black"
                    : "bg-zinc-900 border-green-700 text-green-400 hover:bg-green-800 hover:text-white active:bg-green-500 active:text-black active:border-green-400"
                }`}
              >
                {introResetDone ? "✓ DONE" : "RESET"}
              </button>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="flex flex-col gap-3 mt-2 border-t-2 border-red-900 pt-4">
            <h3 className="text-sm font-bold text-red-400">■ DANGER ZONE</h3>
            <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800 border-2 border-red-800 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <span className="font-bold text-sm tracking-wider text-red-400">CLEAR ALL PROGRESS:</span>
                <p className="text-[10px] opacity-75 font-sans mt-1 leading-relaxed">すべてのステージスコア・星・クリア記録を削除します。この操作は元に戻せません。</p>
              </div>
              <button
                onClick={onClearProgress}
                className="px-3 py-2 bg-zinc-900 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-colors duration-150 rounded text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer font-bold font-pixel whitespace-nowrap"
              >
                CLEAR
              </button>
            </div>
          </div>

        </div>

        <GameButton variant="danger" size="sm" onClick={onBackToTitle}>
          BACK TO TITLE
        </GameButton>
      </div>{/* 左カラム end */}
    </FairyScreenLayout>
  );
}
