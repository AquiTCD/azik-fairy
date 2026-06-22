"use client";

import React, { useState, useEffect } from "react";
import { GameSettings } from "@/types/game";
import { SoundThemeName } from "@/hooks/useAzikSound";
import { parseExternalRomajiTable, AZIK_DICTIONARY } from "@/data/azikRules";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";

interface SettingsProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onBackToTitle: () => void;
  onClearProgress: () => void;
  onResetStageIntros: () => void;
  onImportConf?: (confText: string) => void;
  onResetUserConfig?: () => void;
  userAzikConfig?: import("@/data/userAzikConfig").UserAzikConfig;
}

// 本当に人によって違う3キーのみUIで設定可能。
// 撥音/二重母音の拡張キー(z/k/j/d/l等)はconf importで変更する。
const getCustomizableKeys = (layout: "US" | "JIS") => [
  { label: "単音 ん", key: "ん", defaultVal: "q" },
  { label: "単音 っ", key: "っ", defaultVal: ";" },
  // JISは:が独立キー。USは:=Shift+;なので-を推奨デフォルト。
  { label: "長音 ー", key: "ー", defaultVal: layout === "JIS" ? ":" : "-" },
] as const;

export default function Settings({ settings, onUpdateSettings, onBackToTitle, onClearProgress, onResetStageIntros, onImportConf, onResetUserConfig, userAzikConfig }: SettingsProps) {
  const isCustomized = !!userAzikConfig && Object.keys(userAzikConfig.entries).length > 0;
  const [activeSubTab, setActiveSubTab] = useState<"FORM" | "JSON" | "TSV_SKK">("FORM");
  const [introResetDone, setIntroResetDone] = useState(false);

  // JSON入力バッファとエラー管理
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // TSV/SKK入力バッファとエラー管理
  const [tsvSkkInput, setTsvSkkInput] = useState("");
  const [tsvSkkError, setTsvSkkError] = useState<string | null>(null);

  // キャプチャ待ち中のキー名 (null = 非アクティブ)
  const [capturingKey, setCapturingKey] = useState<string | null>(null);

  // 初期ロード時にJSONエディタの中身を設定
  useEffect(() => {
    setJsonInput(JSON.stringify(settings.customRules, null, 2));
  }, [settings.customRules]);

  const customizableKeys = getCustomizableKeys(settings.keyboardLayout);

  const toggleSetting = (key: keyof Omit<GameSettings, "customRules" | "wordsPerSession" | "keyboardLayout" | "enableSpecial" | "enableForeign" | "nAlternative" | "soundTheme">) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  // レイアウト切替: ーキーが旧レイアウトのデフォルトのままなら新デフォルトに自動更新
  const handleLayoutChange = (layout: "US" | "JIS") => {
    const oldDefault = settings.keyboardLayout === "JIS" ? ":" : "-";
    const newDefault = layout === "JIS" ? ":" : "-";
    const currentLong = settings.customRules["ー"];
    const isAtOldDefault = !currentLong?.length || currentLong[0] === oldDefault;

    const newCustomRules = { ...settings.customRules };
    if (isAtOldDefault) {
      if (layout === "JIS") {
        delete newCustomRules["ー"]; // JISはAZIK辞書デフォルト(:)なので不要
      } else {
        newCustomRules["ー"] = [newDefault]; // US: - を自動セット
      }
    }
    onUpdateSettings({ ...settings, keyboardLayout: layout, customRules: newCustomRules });
  };

  // キャプチャモード: クリック後の任意キー入力を拾って登録
  useEffect(() => {
    if (!capturingKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === "Escape") { setCapturingKey(null); return; }
      // 修飾キー単体は無視
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
      // 1文字の印字可能キーのみ受け付ける
      if (e.key.length === 1) {
        handleKeyChange(capturingKey, e.key);
      }
      setCapturingKey(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // handleKeyChange は下で定義するが、React が警告しないよう capturingKey のみ依存に
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturingKey]);

  // 個別フォームのキー変更 (UI は primary key のみ編集)
  const handleKeyChange = (key: string, val: string) => {
    const sanitizedVal = val.toLowerCase().slice(0, 1);
    const updatedRules = {
      ...settings.customRules,
      [key]: sanitizedVal ? [sanitizedVal] : [],
    };

    onUpdateSettings({
      ...settings,
      customRules: updatedRules,
    });
  };

  // JSONの一括適用
  const applyJsonRules = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("オブジェクト形式である必要があります。");
      }

      // 値が文字列または文字列配列であることを検証、string[]に正規化
      const cleaned: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") {
          const s = v.toLowerCase().slice(0, 1);
          if (s) cleaned[k] = [s];
        } else if (Array.isArray(v)) {
          const arr = v.flatMap(s => typeof s === "string" ? [s.toLowerCase().slice(0, 1)] : []).filter(Boolean);
          if (arr.length) cleaned[k] = arr;
        }
      }

      onUpdateSettings({
        ...settings,
        customRules: cleaned,
      });
      setJsonError(null);
      alert("カスタムキーを一括適用しました！💖");
    } catch (err: any) {
      setJsonError("JSONのパースに失敗しました: " + err.message);
    }
  };

  // TSV / SKK 一括インポート
  const applyTsvSkkRules = () => {
    try {
      const parsed = parseExternalRomajiTable(tsvSkkInput);
      const keys = Object.keys(parsed);
      if (keys.length === 0) {
        throw new Error("有効なマッピング行が見つかりませんでした。(「ん」「っ」、二重母音等の定義を確認してください)");
      }

      onUpdateSettings({
        ...settings,
        customRules: {
          ...settings.customRules,
          ...parsed,
        },
      });
      setTsvSkkError(null);
      alert(`インポート成功！💖 (${keys.length} 件のキーを適用・マージしました)`);
    } catch (err: any) {
      setTsvSkkError("インポートエラー: " + err.message);
    }
  };

  // デフォルトに戻す
  const resetToDefault = () => {
    if (confirm("すべてのキー配列設定をデフォルトに戻しますか？")) {
      onUpdateSettings({
        ...settings,
        customRules: {},
      });
      setJsonError(null);
    }
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
              <span className="text-xs font-pixel font-bold text-green-300 tracking-wider">TRAINING MODE</span>
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
              <span className="text-xs font-pixel font-bold text-yellow-300 tracking-wider">CHALLENGE MODE</span>
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
                      onClick={() => handleLayoutChange(layout)}
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

          {/* キー設定セクション */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-green-950 pb-2 gap-2">
              <h3 className="text-sm font-bold text-green-300">■ KEY CONFIG</h3>

              {/* サブタブ切り替え */}
              <div className="flex gap-1.5">
                {(["FORM", "JSON", "TSV_SKK"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`px-2 py-0.5 text-[9px] md:text-[10px] border font-bold rounded cursor-pointer ${activeSubTab === tab
                      ? "bg-green-500 text-black border-green-500"
                      : "bg-zinc-800 text-green-400 border-zinc-700 hover:border-green-500"
                      }`}
                  >
                    {tab === "FORM" ? "個別フォーム" : tab === "JSON" ? "JSON一括" : "TSV/SKKインポート"}
                  </button>
                ))}
              </div>
            </div>

            {/* AZIKフィーチャー + N代替設定 */}
            <div className="flex flex-col gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded">
              <span className="text-sm font-extrabold font-sans text-zinc-300 tracking-wider">AZIK FEATURES:</span>

              {/* ON/OFFトグル */}
              <div className="flex flex-col gap-2">
                {([
                  { key: "enableSpecial", label: "特殊拡張", desc: "こと[kt] もの[mn] する[sr] です[ds] ます[ms] など" },
                  { key: "enableForeign", label: "外来語拡張", desc: "てぃ[tgi] でぃ[dci] とぅ[tgp] どぅ[dcp]" },
                ] as const).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-extrabold font-sans text-green-300">{label}</span>
                      <span className="text-xs text-zinc-300 ml-2 font-sans">{desc}</span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ ...settings, [key]: !settings[key] })}
                      className={`px-3 py-0.5 text-xs font-pixel font-bold border-2 flex-shrink-0 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings[key]
                        ? "bg-green-500 text-black border-green-500"
                        : "bg-zinc-700 text-green-400 border-green-500"
                        }`}
                    >
                      {settings[key] ? "ON" : "OFF"}
                    </button>
                  </div>
                ))}
              </div>

              {/* N代替 3択 */}
              <div className="border-t border-zinc-700 pt-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-extrabold font-sans text-green-300">N代替 (撥音)</span>
                    <span className="text-xs text-zinc-300 ml-2 font-sans">sz→sn / kz→kn など</span>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {([
                      { val: "off", label: "OFF", title: "Zのみ (源流AZIK)" },
                      { val: "left", label: "LEFT", title: "左手子音のみ g/s/t/d/b/r/w/f/c/z/x" },
                      { val: "all", label: "ALL", title: "全子音 k/j/h 含む" },
                    ] as const).map(({ val, label, title }) => (
                      <button
                        key={val}
                        title={title}
                        onClick={() => onUpdateSettings({ ...settings, nAlternative: val })}
                        className={`px-2.5 py-0.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.nAlternative === val
                          ? "bg-green-500 text-black border-green-500"
                          : "bg-zinc-700 text-green-400 border-zinc-600 hover:border-green-500"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-1.5">
                  撥音ZショートカットへのNの追加。LEFT=左手子音のみ、ALL=k/j/h含む全子音。
                </p>
              </div>

              {/* 小書き仮名プレフィックス */}
              <div className="border-t border-zinc-700 pt-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-extrabold font-sans text-green-300">小書き仮名</span>
                    <span className="text-xs text-zinc-300 ml-2 font-sans">ぁぃぅぇぉ / ゃゅょ の入力</span>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {([
                      { val: "l",    label: "L",    title: "la/li/lu/le/lo (標準)" },
                      { val: "xx",   label: "XX",   title: "xxa/xxi/xxu/xxe/xxo (SKK用)" },
                      { val: "both", label: "BOTH", title: "L系・XX系の両方を有効" },
                    ] as const).map(({ val, label, title }) => (
                      <button
                        key={val}
                        title={title}
                        onClick={() => onUpdateSettings({ ...settings, smallKanaPrefix: val })}
                        className={`px-2.5 py-0.5 text-xs font-pixel font-bold border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${settings.smallKanaPrefix === val
                          ? "bg-green-500 text-black border-green-500"
                          : "bg-zinc-700 text-green-400 border-zinc-600 hover:border-green-500"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-1.5">
                  AZIKでは x は し行専用のため la/li 系が標準。SKKで L をIME切替に使っている場合は XX を選択してください。
                </p>
              </div>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                OFFにした機能は該当ショートカットが無効になり、対応練習ステージも非表示になります。
              </p>
            </div>

            {activeSubTab === "JSON" && (
              /* JSONエディタ */
              <div className="flex flex-col gap-3 p-4 bg-zinc-950 border-2 border-green-500 rounded">
                <div className="text-[10px] leading-relaxed text-zinc-400">
                  <span className="text-green-300 font-bold">【コピー用サンプルJSON】</span><br />
                  以下をコピーしてカスタマイズし、下の入力欄に貼り付けて適用できます。複数キーは配列で指定可能です：
                  <pre className="bg-zinc-900 border border-zinc-800 p-2 mt-1.5 text-[9px] rounded text-green-500 overflow-x-auto select-all">
                    {`{
  "ん": ["q"],
  "っ": [";", ":"],
  "ー": [":"]
}`}
                  </pre>
                  <span className="text-zinc-500 block mt-1">撥音/二重母音の拡張キー（あん=z等）はTSV/SKK importから変更できます。</span>
                </div>
                <div className="border-t border-zinc-800 pt-2.5">
                  <span className="text-xs text-green-300 block mb-1">JSON INPUT:</span>
                  <textarea
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    rows={6}
                    className="w-full bg-zinc-900 border border-green-800 text-green-400 p-2 font-mono text-xs focus:outline-none focus:border-green-500 rounded"
                    placeholder='{ "ん": "q", "っ": ";" }'
                  />
                </div>
                {jsonError && <p className="text-[10px] text-red-500 leading-normal">{jsonError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={applyJsonRules}
                    className="px-3 py-1 bg-green-500 text-black font-bold text-xs border border-green-500 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-green-500 cursor-pointer"
                  >
                    JSON適用
                  </button>
                </div>
              </div>
            )}

            {activeSubTab === "TSV_SKK" && (
              /* TSV/SKKインポーター */
              <div className="flex flex-col gap-3 p-4 bg-zinc-950 border-2 border-green-500 rounded">
                <div className="text-[10px] leading-relaxed text-zinc-400 font-sans">
                  <span className="text-green-300 font-bold">【TSV/SKK設定コピペインポート】</span><br />
                  Google日本語入力のローマ字表（TSV）や、macSKK等の <code className="text-yellow-400">kana-rule.conf</code> の内容をそのまま貼り付けて適用できます。
                  該当するAZIKキー定義（単音ん・っ、撥音拡張、二重母音等）のみを自動で検出して現在の設定にマージします。コメント行（#）は自動で無視されます。
                </div>
                <div className="border-t border-zinc-800 pt-2.5">
                  <span className="text-xs text-green-300 block mb-1">SETTINGS DATA (TSV / CSV / conf):</span>
                  <textarea
                    value={tsvSkkInput}
                    onChange={e => setTsvSkkInput(e.target.value)}
                    rows={8}
                    className="w-full bg-zinc-900 border border-green-800 text-green-400 p-2 font-mono text-xs focus:outline-none focus:border-green-500 rounded"
                    placeholder={`# 例: Google日本語入力 TSV の場合
q\tん
;\tっ
z\tあん

# 例: SKK kana-rule.conf の場合
q,ん
;,っ
z,あん`}
                  />
                </div>
                {tsvSkkError && <p className="text-[10px] text-red-500 leading-normal">{tsvSkkError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={applyTsvSkkRules}
                    className="px-3 py-1 bg-green-500 text-black font-bold text-xs border border-green-500 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-green-500 cursor-pointer"
                  >
                    インポート適用
                  </button>
                </div>
              </div>
            )}

            {activeSubTab === "FORM" && (
              /* 個別フォームエディタ: クリックでキャプチャ */
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-zinc-500 font-sans">キーアイコンをクリックして次に押したキーで登録。ESCでキャンセル。</p>
                <div className="grid grid-cols-3 gap-3">
                  {customizableKeys.map(item => {
                    const keys = settings.customRules[item.key];
                    const primaryVal = keys?.[0] ?? item.defaultVal;
                    const altKeys = keys?.slice(1) ?? [];
                    const isCustom = keys !== undefined && (keys[0] !== item.defaultVal || keys.length > 1);
                    const isCapturing = capturingKey === item.key;

                    return (
                      <div
                        key={item.key}
                        className="flex flex-col gap-1.5 p-3 bg-zinc-800 border border-green-800 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] opacity-80">{item.label}</span>
                          {isCustom && <span className="text-[9px] text-yellow-400 font-sans font-bold">Custom</span>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* クリックでキャプチャ開始するキーキャップ */}
                          <button
                            onClick={() => setCapturingKey(isCapturing ? null : item.key)}
                            title="クリックして次に押したキーで登録"
                            className={`min-w-[2.5rem] px-2 py-1.5 text-base font-bold font-mono border-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 cursor-pointer ${isCapturing
                              ? "bg-yellow-400 text-black border-yellow-400 animate-pulse"
                              : isCustom
                                ? "bg-green-500 text-black border-green-400 hover:bg-green-400"
                                : "bg-zinc-900 text-green-300 border-green-700 hover:border-green-500 hover:bg-zinc-700"
                              }`}
                          >
                            {isCapturing ? "?" : primaryVal.toUpperCase()}
                          </button>
                          {altKeys.map(k => (
                            <span key={k} className="text-[10px] font-mono font-bold text-green-400 bg-zinc-900 border border-green-800 rounded px-1.5 py-0.5 uppercase">{k}</span>
                          ))}
                        </div>
                        {isCapturing && (
                          <span className="text-[9px] text-yellow-300 font-sans animate-pulse">キー待ち... (ESCでキャンセル)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* リセットボタン */}
            <div className="flex justify-end mt-1">
              <button
                onClick={resetToDefault}
                className="px-3 py-1.5 bg-zinc-800 border-2 border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-black transition-colors duration-150 rounded text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer font-pixel font-bold"
              >
                RESET TO DEFAULT KEYS
              </button>
            </div>

          </div>

          {/* ユーザー AZIK conf インポート */}
          {onImportConf && (
            <div className="flex flex-col gap-3 mt-2 border-t border-zinc-700 pt-4">
              <h3 className="text-sm font-bold text-cyan-400 font-pixel">■ MY AZIK CONFIG</h3>
              <div className="flex flex-col gap-2 p-4 bg-zinc-800 border border-zinc-700 rounded">
                <div>
                  <span className="font-bold text-sm tracking-wider text-cyan-300 font-pixel">IMPORT kana-rule.conf / TSV:</span>
                  <p className="text-[10px] opacity-75 font-sans mt-1 leading-relaxed">
                    macSKK の kana-rule.conf（カンマ区切り）または Google 日本語入力のローマ字テーブル（タブ区切り TSV）をペーストすると、azik ショートカットの有効/無効が練習に反映されます。
                  </p>
                </div>
                <textarea
                  className="w-full h-28 bg-zinc-900 border border-zinc-600 text-green-300 text-xs font-mono p-2 rounded resize-y"
                  placeholder={"# macSKK conf 例\nq,ん\n;,っ\nwz,わん\n\n# Google IME TSV 例\nq\tん\n;\tっ"}
                  onChange={(e) => {
                    if (e.target.value.trim()) onImportConf(e.target.value);
                  }}
                />
                {isCustomized && onResetUserConfig && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400 font-pixel">✓ カスタム設定適用中</span>
                    <button
                      onClick={onResetUserConfig}
                      className="px-3 py-1 bg-zinc-900 border border-zinc-600 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors rounded text-xs cursor-pointer font-bold font-pixel whitespace-nowrap"
                    >
                      RESET TO DEFAULT
                    </button>
                  </div>
                )}
              </div>

              {/* 現在の有効キー差分テーブル */}
              {userAzikConfig && (() => {
                const disabled: Array<{ kana: string; base: string[] }> = [];
                const replaced: Array<{ kana: string; base: string[]; current: string[] }> = [];

                for (const [kana, entry] of Object.entries(userAzikConfig.entries)) {
                  const base = AZIK_DICTIONARY[kana];
                  if (!base) continue;
                  if (entry.mode === "disable") {
                    disabled.push({ kana, base: base.azik });
                  } else if (entry.mode === "replace" && entry.replacementKeys) {
                    replaced.push({ kana, base: base.azik, current: entry.replacementKeys });
                  }
                }

                if (disabled.length === 0 && replaced.length === 0) {
                  return (
                    <p className="text-[10px] text-zinc-500 font-pixel mt-1">変更なし — デフォルトと同じ設定です</p>
                  );
                }

                return (
                  <div className="flex flex-col gap-2 mt-1">
                    {disabled.length > 0 && (
                      <div>
                        <p className="text-[10px] text-red-400 font-pixel mb-1">DISABLED ({disabled.length}件)</p>
                        <div className="flex flex-wrap gap-1">
                          {disabled.map(({ kana, base }) => (
                            <span key={kana} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-red-800 rounded text-[10px] font-mono">
                              <span className="text-zinc-300">{kana}</span>
                              <span className="text-red-400 line-through opacity-60">{base.join("/")}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {replaced.length > 0 && (
                      <div>
                        <p className="text-[10px] text-yellow-400 font-pixel mb-1">REPLACED ({replaced.length}件)</p>
                        <div className="flex flex-wrap gap-1">
                          {replaced.map(({ kana, base, current }) => (
                            <span key={kana} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-yellow-800 rounded text-[10px] font-mono">
                              <span className="text-zinc-300">{kana}</span>
                              <span className="text-red-400 line-through opacity-60">{base.join("/")}</span>
                              <span className="text-zinc-500">→</span>
                              <span className="text-yellow-300">{current.join("/")}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* レッスン説明リセット */}
          <div className="flex flex-col gap-3 mt-2 border-t border-zinc-700 pt-4">
            <h3 className="text-sm font-bold text-green-400 font-pixel">■ LESSON INTRO</h3>
            <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800 border border-zinc-700 rounded">
              <div>
                <span className="font-bold text-sm tracking-wider text-green-300 font-pixel">RESET INTRO HISTORY:</span>
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
            <h3 className="text-sm font-bold text-red-400 font-pixel">■ DANGER ZONE</h3>
            <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800 border-2 border-red-800 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <span className="font-bold text-sm tracking-wider text-red-400 font-pixel">CLEAR ALL PROGRESS:</span>
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
