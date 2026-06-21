"use client";

import React, { useEffect, useState } from "react";
import KeyboardDiagram from "./KeyboardDiagram";
import GameButton from "./GameButton";
import FairyScreenLayout from "./FairyScreenLayout";
import { StageMeta } from "@/data/stages";

interface AzikKeyVisualizerProps {
  stage: StageMeta;
  onStart: (markAsSeen: boolean) => void;
  layout: "US" | "JIS";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// カテゴリ別アニメーション定義
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type AnimFrame = {
  activeKeys: string[];
  normalKeys: string[];
  label: string;
  sublabel?: string;
};

type IntroConfig = {
  title: string;
  description: string;
  examples: { from: string; to: string; label: string }[];
  frames: AnimFrame[];
};

const VOWEL_POSITIONS_US: Record<string, string> = {
  a: "z", i: "k", u: "j", e: "d", o: "l",
};

const VOWEL_POSITIONS_JIS: Record<string, string> = {
  a: "z", i: "k", u: "j", e: "d", o: "l",
};

const DOUBLE_VOWEL_KEYS_US: Record<string, string> = {
  a: "q", u: "h", e: "w", o: "p",
};

function getLev2aFrames(): AnimFrame[] {
  const pairs = [
    { vowel: "a", ext: "z", label: "あ → 1段下 = Z → ～あん" },
    { vowel: "i", ext: "k", label: "い → 1段下 = K → ～いん" },
    { vowel: "u", ext: "j", label: "う → 1段下 = J → ～うん" },
    { vowel: "e", ext: "d", label: "え → 1段下 = D → ～えん" },
    { vowel: "o", ext: "l", label: "お → 1段下 = L → ～おん" },
  ];
  const frames: AnimFrame[] = [];
  for (const { vowel, ext, label } of pairs) {
    frames.push({ activeKeys: [vowel], normalKeys: [], label: `母音キー [${vowel.toUpperCase()}]` });
    frames.push({ activeKeys: [ext], normalKeys: [vowel], label, sublabel: "1段下のキー = 撥音拡張" });
  }
  return frames;
}

function getLev2bFrames(): AnimFrame[] {
  const pairs = [
    { vowel: "a", ext: "q", label: "a の左上 = Q → ～あい" },
    { vowel: "u", ext: "h", label: "u の右 = H → ～うう" },
    { vowel: "e", ext: "w", label: "e の左 = W → ～えい" },
    { vowel: "o", ext: "p", label: "o の右 = P → ～おう" },
  ];
  const frames: AnimFrame[] = [];
  for (const { vowel, ext, label } of pairs) {
    frames.push({ activeKeys: [vowel], normalKeys: [], label: `母音キー [${vowel.toUpperCase()}]` });
    frames.push({ activeKeys: [ext], normalKeys: [vowel], label, sublabel: "隣接キー = 二重母音短縮" });
  }
  return frames;
}

const INTRO_CONFIGS: Record<string, IntroConfig> = {
  "lev1-sokuon": {
    title: "っ は [;] 一打！",
    description: "「tsu」や「ltu」など複数打ちを捨てて、[;] 1打で「っ」。同じ子音を2回打つ方式も禁止。",
    examples: [
      { from: "tsu", to: ";", label: "っ" },
      { from: "ltu", to: ";", label: "っ" },
      { from: "tt(u)", to: ";(u)", label: "った" },
    ],
    frames: [
      { activeKeys: [";"], normalKeys: ["t", "l"], label: "[;] 1打 = っ", sublabel: "tsu / ltu は使わない" },
    ],
  },
  "lev1-hatsuon-q": {
    title: "ん は [Q] 一打！",
    description: "「nn」や「n」+子音の入力は捨てて、[q] 1打で「ん」。Lev2 で更に速くなる。",
    examples: [
      { from: "nn", to: "q", label: "ん" },
      { from: "hon", to: "hoq", label: "ほん" },
    ],
    frames: [
      { activeKeys: ["q"], normalKeys: ["n"], label: "[q] 1打 = ん", sublabel: "nn は使わない" },
    ],
  },
  "lev1-sha": {
    title: "シャ行 は [X] で2打！",
    description: "「sha」「shu」などの3打を捨てて、[x] + 母音の2打に。",
    examples: [
      { from: "sha", to: "xa", label: "しゃ" },
      { from: "shu", to: "xu", label: "しゅ" },
      { from: "sho", to: "xo", label: "しょ" },
    ],
    frames: [
      { activeKeys: ["x"], normalKeys: ["s", "h", "y"], label: "[x] + 母音 = シャ行", sublabel: "SHA/SYA は使わない" },
    ],
  },
  "lev1-cha": {
    title: "チャ行 は [C] で2打！",
    description: "「cha」「chu」などの3打を捨てて、[c] + 母音の2打に。",
    examples: [
      { from: "cha", to: "ca", label: "ちゃ" },
      { from: "chu", to: "cu", label: "ちゅ" },
      { from: "cho", to: "co", label: "ちょ" },
    ],
    frames: [
      { activeKeys: ["c"], normalKeys: ["t", "h", "y"], label: "[c] + 母音 = チャ行", sublabel: "CHA/CYA は使わない" },
    ],
  },
  "lev1-summary": {
    title: "Lev1 総まとめ",
    description: "っ[;]・ん[q]・シャ行[x]・チャ行[c] をすべて使う文章練習。",
    examples: [
      { from: ";", to: ";", label: "っ" },
      { from: "q", to: "q", label: "ん" },
      { from: "x+母音", to: "x+母音", label: "シャ行" },
      { from: "c+母音", to: "c+母音", label: "チャ行" },
    ],
    frames: [
      { activeKeys: [";", "q", "x", "c"], normalKeys: [], label: "Lev1 全ショートカット", sublabel: "4つを組み合わせて打とう" },
    ],
  },
};

// Lev2a: 撥音拡張ステージ別
const LEV2A_STAGES: Record<string, IntroConfig> = {
  "lev2a-an-z": {
    title: "〜あん は 子音+[Z]！",
    description: "「あ」の1段下のキー [Z] を使う。子音+Z = 〜あん。",
    examples: [
      { from: "kan", to: "kz", label: "かん" },
      { from: "san", to: "sz", label: "さん" },
      { from: "tan", to: "tz", label: "たん" },
      { from: "nan", to: "nz", label: "なん" },
    ],
    frames: getLev2aFrames().filter((_, i) => i <= 1),
  },
  "lev2a-in-k": {
    title: "〜いん は 子音+[K]！",
    description: "「い」の1段下のキー [K] を使う。子音+K = 〜いん。",
    examples: [
      { from: "kin", to: "kk", label: "きん" },
      { from: "sin", to: "sk", label: "しん" },
      { from: "nin", to: "nk", label: "にん" },
      { from: "tin", to: "tk", label: "ちん" },
    ],
    frames: getLev2aFrames().filter((_, i) => i >= 2 && i <= 3),
  },
  "lev2a-un-j": {
    title: "〜うん は 子音+[J]！",
    description: "「う」の1段下のキー [J] を使う。子音+J = 〜うん。",
    examples: [
      { from: "kun", to: "kj", label: "くん" },
      { from: "sun", to: "sj", label: "すん" },
      { from: "bun", to: "bj", label: "ぶん" },
    ],
    frames: getLev2aFrames().filter((_, i) => i >= 4 && i <= 5),
  },
  "lev2a-en-d": {
    title: "〜えん は 子音+[D]！",
    description: "「え」の1段下のキー [D] を使う。子音+D = 〜えん。",
    examples: [
      { from: "ken", to: "kd", label: "けん" },
      { from: "sen", to: "sd", label: "せん" },
      { from: "ten", to: "td", label: "てん" },
      { from: "nen", to: "nd", label: "ねん" },
    ],
    frames: getLev2aFrames().filter((_, i) => i >= 6 && i <= 7),
  },
  "lev2a-on-l": {
    title: "〜おん は 子音+[L]！",
    description: "「お」の1段下のキー [L] を使う。子音+L = 〜おん。",
    examples: [
      { from: "kon", to: "kl", label: "こん" },
      { from: "son", to: "sl", label: "そん" },
      { from: "ton", to: "tl", label: "とん" },
      { from: "hon", to: "hl", label: "ほん" },
    ],
    frames: getLev2aFrames().filter((_, i) => i >= 8),
  },
  "lev2a-summary": {
    title: "撥音まとめ: Z/K/J/D/L",
    description: "5つの撥音拡張キー。母音キーの「1段下」というルール1つを覚えれば全部わかる。",
    examples: [
      { from: "kz", to: "kz", label: "かん" },
      { from: "sk", to: "sk", label: "しん" },
      { from: "bj", to: "bj", label: "ぶん" },
      { from: "td", to: "td", label: "てん" },
      { from: "kl", to: "kl", label: "こん" },
    ],
    frames: getLev2aFrames(),
  },
};

const LEV2B_STAGES: Record<string, IntroConfig> = {
  "lev2b-ai-q": {
    title: "〜あい は 子音+[Q]！",
    description: "[a] の左上にある [Q]。子音+Q = 〜あい。※q 単打は「ん」なので注意。",
    examples: [
      { from: "kai", to: "kq", label: "かい" },
      { from: "sai", to: "sq", label: "さい" },
      { from: "tai", to: "tq", label: "たい" },
      { from: "nai", to: "nq", label: "ない" },
    ],
    frames: getLev2bFrames().filter((_, i) => i <= 1),
  },
  "lev2b-uu-h": {
    title: "〜うう は 子音+[H]！",
    description: "[u] の右隣にある [H]（hの場所）。子音+H = 〜うう。",
    examples: [
      { from: "kuu", to: "kh", label: "くう" },
      { from: "suu", to: "sh", label: "すう" },
      { from: "tuu", to: "th", label: "つう" },
    ],
    frames: getLev2bFrames().filter((_, i) => i >= 2 && i <= 3),
  },
  "lev2b-ei-w": {
    title: "〜えい は 子音+[W]！",
    description: "[e] の左上にある [W]。子音+W = 〜えい。",
    examples: [
      { from: "kei", to: "kw", label: "けい" },
      { from: "sei", to: "sw", label: "せい" },
      { from: "tei", to: "tw", label: "てい" },
      { from: "hei", to: "hw", label: "へい" },
    ],
    frames: getLev2bFrames().filter((_, i) => i >= 4 && i <= 5),
  },
  "lev2b-ou-p": {
    title: "〜おう は 子音+[P]！",
    description: "[o] の右隣にある [P]。子音+P = 〜おう。",
    examples: [
      { from: "kou", to: "kp", label: "こう" },
      { from: "sou", to: "sp", label: "そう" },
      { from: "tou", to: "tp", label: "とう" },
      { from: "nou", to: "np", label: "のう" },
    ],
    frames: getLev2bFrames().filter((_, i) => i >= 6 && i <= 7),
  },
  "lev2b-summary": {
    title: "二重母音まとめ: Q/H/W/P",
    description: "4つの二重母音短縮キー。母音キーの「隣」にあるというルール。",
    examples: [
      { from: "kq", to: "kq", label: "かい" },
      { from: "kh", to: "kh", label: "くう" },
      { from: "kw", to: "kw", label: "けい" },
      { from: "kp", to: "kp", label: "こう" },
    ],
    frames: getLev2bFrames(),
  },
};

const LEV3A_STAGES: Record<string, IntroConfig> = {
  "lev3a-chouon-colon": {
    title: "長音 は [:]！",
    description: "「ー」を入力する [-] キーの隣にある [:] で代用。指をほとんど動かさずに打てる。",
    examples: [
      { from: "-", to: ":", label: "ー" },
      { from: "ko-hi-", to: "ko:hi:", label: "コーヒー" },
    ],
    frames: [
      { activeKeys: [":"], normalKeys: ["-"], label: "[-] の隣 = [:]", sublabel: "どちらでも長音になる" },
    ],
  },
  "lev3a-g-youon": {
    title: "拗音の Y → [G] で代用！",
    description: "「kya」を「kga」と打てる。左手だけで拗音を完結できるので楽。",
    examples: [
      { from: "kya", to: "kga", label: "きゃ" },
      { from: "nya", to: "nga", label: "にゃ" },
      { from: "rya", to: "rga", label: "りゃ" },
    ],
    frames: [
      { activeKeys: ["g"], normalKeys: ["y"], label: "[g] が [y] の代わりに", sublabel: "左手で拗音が完結する" },
    ],
  },
  "lev3a-compat-f": {
    title: "語尾互換 [F]！",
    description: "末尾が「い」や「う」で終わる音節を [F] で短縮。き→kf、ふ→hf など。",
    examples: [
      { from: "ki", to: "kf", label: "き" },
      { from: "hu/fu", to: "hf", label: "ふ" },
      { from: "mu", to: "mf", label: "む" },
      { from: "yu", to: "yf", label: "ゆ" },
    ],
    frames: [
      { activeKeys: ["f"], normalKeys: ["i", "u"], label: "[f] = 末尾 i/u の省略", sublabel: "子音+f で語尾短縮" },
    ],
  },
  "lev3a-summary": {
    title: "互換キー I まとめ",
    description: "長音[:]・拗音代用[G]・語尾互換[F] の3つを組み合わせる練習。",
    examples: [
      { from: "-", to: ":", label: "ー" },
      { from: "kya", to: "kga", label: "きゃ" },
      { from: "ki", to: "kf", label: "き" },
    ],
    frames: [
      { activeKeys: [":", "g", "f"], normalKeys: ["-", "y", "i", "u"], label: "Lev3a 互換キー3種", sublabel: "自然な文章の中で使いこなそう" },
    ],
  },
};

const LEV3B_STAGES: Record<string, IntroConfig> = {
  "lev3b-foreign-kana": {
    title: "外来語拡張 TGI/DCI/TGU",
    description: "外来語特有の音節を3打で。てぃ→tgi、でぃ→dci、とぅ→tgu。",
    examples: [
      { from: "texi", to: "tgi", label: "てぃ" },
      { from: "dexi", to: "dci", label: "でぃ" },
      { from: "toxu", to: "tgu", label: "とぅ" },
    ],
    frames: [
      { activeKeys: ["t", "g", "i"], normalKeys: [], label: "てぃ = TGI" },
      { activeKeys: ["d", "c", "i"], normalKeys: [], label: "でぃ = DCI" },
      { activeKeys: ["t", "g", "u"], normalKeys: [], label: "とぅ = TGU" },
    ],
  },
  "lev3b-zc-zf-za-ze": {
    title: "ざ→[ZC]、ぜ→[ZF]",
    description: "「za」「ze」は指が交差して打ちにくい。[zc][zf] に置き換えて楽に。",
    examples: [
      { from: "za", to: "zc", label: "ざ" },
      { from: "ze", to: "zf", label: "ぜ" },
    ],
    frames: [
      { activeKeys: ["z", "c"], normalKeys: ["a"], label: "ざ: za → ZC", sublabel: "指の交差を避ける" },
      { activeKeys: ["z", "f"], normalKeys: ["e"], label: "ぜ: ze → ZF", sublabel: "同じく左手内で完結" },
    ],
  },
  "lev3b-zv-zx-zai-zei": {
    title: "ざい→[ZV]、ぜい→[ZX]",
    description: "「zq」「zw」は複雑な組み合わせ。[zv][zx] に置き換えて覚えやすく。",
    examples: [
      { from: "zq", to: "zv", label: "ざい" },
      { from: "zw", to: "zx", label: "ぜい" },
    ],
    frames: [
      { activeKeys: ["z", "v"], normalKeys: ["q"], label: "ざい: zq → ZV" },
      { activeKeys: ["z", "x"], normalKeys: ["w"], label: "ぜい: zw → ZX" },
    ],
  },
  "lev3b-sf-ss-sai-sei": {
    title: "さい→[SF]、せい→[SS]",
    description: "「sq」「sw」の組み合わせを [sf][ss] に。さ行の二重音節をまとめてカバー。",
    examples: [
      { from: "sq", to: "sf", label: "さい" },
      { from: "sw", to: "ss", label: "せい" },
    ],
    frames: [
      { activeKeys: ["s", "f"], normalKeys: ["q"], label: "さい: sq → SF" },
      { activeKeys: ["s", "s"], normalKeys: ["w"], label: "せい: sw → SS" },
    ],
  },
  "lev3b-summary": {
    title: "互換キー II まとめ",
    description: "ZC/ZF/ZV/ZX/SF/SS の6種。打ちにくい組み合わせを近い指で代替する。",
    examples: [
      { from: "za→zc", to: "zc", label: "ざ" },
      { from: "ze→zf", to: "zf", label: "ぜ" },
      { from: "sq→sf", to: "sf", label: "さい" },
      { from: "sw→ss", to: "ss", label: "せい" },
    ],
    frames: [
      { activeKeys: ["z", "c", "f", "v", "x"], normalKeys: ["a", "e", "q", "w"], label: "Lev3b 互換キー", sublabel: "打ちにくい → 打ちやすいキーへ" },
    ],
  },
};

const LEV4_STAGES: Record<string, IntroConfig> = {
  "lev4-special-ext-1": {
    title: "語短縮: 頻出語が2打で！",
    description: "日本語で超頻出する機能語を2打に圧縮。こと[kt]・もの[mn]・する[sr]・ます[ms]など。",
    examples: [
      { from: "koto", to: "kt", label: "こと" },
      { from: "mono", to: "mn", label: "もの" },
      { from: "suru", to: "sr", label: "する" },
      { from: "masu", to: "ms", label: "ます" },
    ],
    frames: [
      { activeKeys: ["k", "t"], normalKeys: [], label: "kt = こと (4打→2打)" },
      { activeKeys: ["m", "n"], normalKeys: [], label: "mn = もの (4打→2打)" },
      { activeKeys: ["s", "r"], normalKeys: [], label: "sr = する (4打→2打)" },
      { activeKeys: ["m", "s"], normalKeys: [], label: "ms = ます (4打→2打)" },
    ],
  },
  "lev4-summary": {
    title: "特殊拡張まとめ",
    description: "語短縮キーを交えた自然な日本語文章。無意識に使えるまで繰り返そう。",
    examples: [
      { from: "koto", to: "kt", label: "こと" },
      { from: "suru", to: "sr", label: "する" },
      { from: "masu", to: "ms", label: "ます" },
    ],
    frames: [
      { activeKeys: ["k", "t", "m", "n", "s", "r", "m", "s"], normalKeys: [], label: "Lev4 語短縮キー", sublabel: "頻出語を2打で" },
    ],
  },
};

export type { IntroConfig, AnimFrame };
export function getIntroConfig(stageId: string): IntroConfig | null {
  return (
    INTRO_CONFIGS[stageId] ??
    LEV2A_STAGES[stageId] ??
    LEV2B_STAGES[stageId] ??
    LEV3A_STAGES[stageId] ??
    LEV3B_STAGES[stageId] ??
    LEV4_STAGES[stageId] ??
    null
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインコンポーネント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function AzikKeyVisualizer({ stage, onStart, layout }: AzikKeyVisualizerProps) {
  const config = getIntroConfig(stage.id);
  const [frameIdx, setFrameIdx] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const frames = config?.frames ?? [];

  useEffect(() => {
    if (frames.length <= 1) return;
    const timer = setInterval(() => {
      setFrameIdx(prev => (prev + 1) % frames.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [frames.length]);

  const currentFrame = frames[frameIdx] ?? { activeKeys: [], normalKeys: [], label: "" };

  if (!config) {
    return (
      <FairyScreenLayout fairy={{ message: `「${stage.name}」を始めよう！`, emotion: "excited" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <h2 className="text-2xl font-bold font-pixel text-green-400">{stage.name}</h2>
          <p className="text-sm text-zinc-300">{stage.description}</p>
          <GameButton variant="primary" size="lg" onClick={() => onStart(dontShowAgain)}>PLAY</GameButton>
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
          <div className="text-xs font-pixel text-green-400 h-5 transition-all duration-300 tracking-wider">
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

        <div className="flex flex-col gap-2 mt-auto">
          <label className="flex items-center gap-2 text-xs text-green-400 font-sans cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="accent-green-400 w-3.5 h-3.5"
            />
            次回から表示しない
          </label>
          <GameButton variant="primary" size="lg" onClick={() => onStart(dontShowAgain)} className="w-full">
            PLAY
          </GameButton>
        </div>
      </div>
    </FairyScreenLayout>
  );
}
