// -*- coding: utf-8 -*-
// ステージイントロ設定をeffectiveDictから動的に生成するモジュール

import { AzikMapping, AZIK_DICTIONARY } from "@/data/azikRules";

export type AnimFrame = {
  activeKeys: string[];
  normalKeys: string[];
  label: string;
  sublabel?: string;
};

export type IntroConfig = {
  title: string;
  description: string;
  examples: { from: string; to: string; label: string }[];
  frames: AnimFrame[];
};

type Dict = Record<string, AzikMapping>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ヘルパー関数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** azik[] にあって normal[] にない（AZIK専用）キーを返す */
function azikOnly(dict: Dict, kana: string): string[] {
  const entry = dict[kana];
  if (!entry) return [];
  const normalSet = new Set(entry.normal);
  return entry.azik.filter(k => !normalSet.has(k));
}

/** 最初のAZIK専用キー、なければfallback */
function firstAzik(dict: Dict, kana: string, fallback: string): string {
  const keys = azikOnly(dict, kana);
  return keys[0] ?? fallback;
}

/** N番目のAZIK専用キー、なければfallback */
function nthAzik(dict: Dict, kana: string, n: number, fallback: string): string {
  const keys = azikOnly(dict, kana);
  return keys[n] ?? fallback;
}

/** dict[kana].normal[0] */
function normalFrom(dict: Dict, kana: string): string {
  return dict[kana]?.normal[0] ?? kana;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Lev2a フレーム生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getLev2aFrames(dict: Dict): AnimFrame[] {
  const data = [
    { vowel: "a", refKana: "かん", fallback: "kz", reading: "あん" },
    { vowel: "i", refKana: "きん", fallback: "kk", reading: "いん" },
    { vowel: "u", refKana: "くん", fallback: "kj", reading: "うん" },
    { vowel: "e", refKana: "けん", fallback: "kd", reading: "えん" },
    { vowel: "o", refKana: "こん", fallback: "kl", reading: "おん" },
  ];
  const frames: AnimFrame[] = [];
  for (const { vowel, refKana, fallback, reading } of data) {
    const suffix = firstAzik(dict, refKana, fallback).slice(-1);
    frames.push({
      activeKeys: [],
      normalKeys: [vowel],
      label: `母音キー [${vowel.toUpperCase()}] を基準に…`,
    });
    frames.push({
      activeKeys: [suffix],
      normalKeys: [vowel],
      label: `${vowel.toUpperCase()} の1段下 = ${suffix.toUpperCase()} → ～${reading}`,
      sublabel: "1段下のキー = 撥音拡張",
    });
  }
  return frames;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Lev2b フレーム生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getLev2bFrames(dict: Dict): AnimFrame[] {
  const data = [
    { vowel: "a", refKana: "かい", fallback: "kq", reading: "あい", position: "左上" },
    { vowel: "u", refKana: "くう", fallback: "kh", reading: "うう", position: "右隣" },
    { vowel: "e", refKana: "けい", fallback: "kw", reading: "えい", position: "左上" },
    { vowel: "o", refKana: "こう", fallback: "kp", reading: "おう", position: "右隣" },
  ];
  const frames: AnimFrame[] = [];
  for (const { vowel, refKana, fallback, reading, position } of data) {
    const ext = firstAzik(dict, refKana, fallback).slice(-1);
    frames.push({
      activeKeys: [],
      normalKeys: [vowel],
      label: `母音キー [${vowel.toUpperCase()}] を基準に…`,
    });
    frames.push({
      activeKeys: [ext],
      normalKeys: [vowel],
      label: `${vowel.toUpperCase()} の${position} = ${ext.toUpperCase()} → ～${reading}`,
      sublabel: "隣接キー = 二重母音短縮",
    });
  }
  return frames;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ステージ別ビルダー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildLev1Sokuon(dict: Dict): IntroConfig {
  const key = firstAzik(dict, "っ", ";");
  const norms = dict["っ"]?.normal ?? ["ltu", "ltsu", "xtu"];
  return {
    title: `っ は [${key}] 一打！`,
    description: `「${norms[0]}」「${norms[1] ?? "ltsu"}」など複数打ちを捨てて、[${key}] 1打で「っ」。同じ子音を2回打つ方式も禁止。`,
    examples: [
      { from: norms[0], to: key, label: "っ" },
      { from: norms[1] ?? "ltsu", to: key, label: "っ" },
      { from: "tt(u)", to: `${key}(u)`, label: "った" },
    ],
    frames: [
      { activeKeys: [], normalKeys: norms.slice(0, 3), label: `従来: ${norms[0]} など (3打)` },
      { activeKeys: [key], normalKeys: [], label: `[${key}] 1打 = っ`, sublabel: "3打 → 1打！" },
    ],
  };
}

function buildLev1HatsuonQ(dict: Dict): IntroConfig {
  const key = firstAzik(dict, "ん", "q");
  const norms = dict["ん"]?.normal ?? ["nn", "xn"];
  return {
    title: `ん は [${key.toUpperCase()}] 一打！`,
    description: `「${norms[0]}」の入力は捨てて、[${key}] 1打で「ん」。次のレッスンで更に速くなる。`,
    examples: [
      { from: norms[0], to: key, label: "ん" },
      { from: "hon", to: `ho${key}`, label: "ほん" },
    ],
    frames: [
      { activeKeys: [], normalKeys: [norms[0][0]], label: `従来: ${norms[0]} (+ n か子音)` },
      { activeKeys: [key], normalKeys: [], label: `[${key}] 1打 = ん`, sublabel: `${norms[0]} → ${key}！` },
    ],
  };
}

function buildLev1Sha(dict: Dict): IntroConfig {
  const shaAzik = firstAzik(dict, "しゃ", "xa");
  const prefix = shaAzik[0];
  return {
    title: `シャ行 は [${prefix.toUpperCase()}] で2打！`,
    description: `「sha」「shu」などの3打を捨てて、[${prefix}] + 母音の2打に。`,
    examples: [
      { from: normalFrom(dict, "しゃ"), to: `${prefix}a`, label: "しゃ" },
      { from: normalFrom(dict, "しゅ"), to: `${prefix}u`, label: "しゅ" },
      { from: normalFrom(dict, "しょ"), to: `${prefix}o`, label: "しょ" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["s", "h", "y"], label: "従来: s-h-a / s-y-a (3打)" },
      { activeKeys: [prefix], normalKeys: [], label: `[${prefix.toUpperCase()}] + 母音 = シャ行 (2打)`, sublabel: "3打 → 2打！" },
    ],
  };
}

function buildLev1Cha(dict: Dict): IntroConfig {
  const chaAzik = firstAzik(dict, "ちゃ", "ca");
  const prefix = chaAzik[0];
  return {
    title: `チャ行 は [${prefix.toUpperCase()}] で2打！`,
    description: `「cha」「chu」などの3打を捨てて、[${prefix}] + 母音の2打に。`,
    examples: [
      { from: normalFrom(dict, "ちゃ"), to: `${prefix}a`, label: "ちゃ" },
      { from: normalFrom(dict, "ちゅ"), to: `${prefix}u`, label: "ちゅ" },
      { from: normalFrom(dict, "ちょ"), to: `${prefix}o`, label: "ちょ" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["t", "h", "y"], label: "従来: c-h-a / t-y-a (3打)" },
      { activeKeys: [prefix], normalKeys: [], label: `[${prefix.toUpperCase()}] + 母音 = チャ行 (2打)`, sublabel: "3打 → 2打！" },
    ],
  };
}

function buildLev1Summary(dict: Dict): IntroConfig {
  const sokuon = firstAzik(dict, "っ", ";");
  const hatsuon = firstAzik(dict, "ん", "q");
  const sha = firstAzik(dict, "しゃ", "xa")[0];
  const cha = firstAzik(dict, "ちゃ", "ca")[0];
  const keys = [sokuon, hatsuon, sha, cha];
  return {
    title: "単打 総まとめ",
    description: `っ[${sokuon}]・ん[${hatsuon}]・シャ行[${sha}]・チャ行[${cha}] をすべて使う文章練習。`,
    examples: [
      { from: dict["っ"]?.normal[0] ?? "ltu", to: sokuon, label: "っ" },
      { from: dict["ん"]?.normal[0] ?? "nn", to: hatsuon, label: "ん" },
      { from: normalFrom(dict, "しゃ"), to: `${sha}a`, label: "しゃ" },
      { from: normalFrom(dict, "ちゃ"), to: `${cha}a`, label: "ちゃ" },
    ],
    frames: [
      { activeKeys: [], normalKeys: keys, label: "単打の4キーを確認…" },
      { activeKeys: keys, normalKeys: [], label: "この4キーがAZIK単打のコア", sublabel: "組み合わせて打とう" },
    ],
  };
}

// ━━ Lev2a ━━

const LEV2A_SPEC_DATA = {
  "lev2a-an-z": { titleReading: "あん", refKana: "かん", fallback: "kz", vowelHint: "A の1段下", exampleKana: ["かん", "さん", "たん", "なん"], frameIdx: 0 },
  "lev2a-in-k": { titleReading: "いん", refKana: "きん", fallback: "kk", vowelHint: "I の1段下", exampleKana: ["きん", "しん", "にん", "ちん"], frameIdx: 1 },
  "lev2a-un-j": { titleReading: "うん", refKana: "くん", fallback: "kj", vowelHint: "U の1段下", exampleKana: ["くん", "すん", "ぶん"],          frameIdx: 2 },
  "lev2a-en-d": { titleReading: "えん", refKana: "けん", fallback: "kd", vowelHint: "E の1段下", exampleKana: ["けん", "せん", "てん", "ねん"], frameIdx: 3 },
  "lev2a-on-l": { titleReading: "おん", refKana: "こん", fallback: "kl", vowelHint: "O の1段下", exampleKana: ["こん", "そん", "とん", "ほん"], frameIdx: 4 },
} as const;

function buildLev2aStage(dict: Dict, stageId: keyof typeof LEV2A_SPEC_DATA): IntroConfig {
  const spec = LEV2A_SPEC_DATA[stageId];
  const suffix = firstAzik(dict, spec.refKana, spec.fallback).slice(-1);
  const allFrames = getLev2aFrames(dict);
  const fi = spec.frameIdx * 2;
  return {
    title: `〜${spec.titleReading} は 子音+[${suffix.toUpperCase()}]！`,
    description: `「${spec.vowelHint}」のキー [${suffix.toUpperCase()}] を使う。子音+${suffix.toUpperCase()} = 〜${spec.titleReading}。`,
    examples: spec.exampleKana.map(kana => {
      // Construct a consonant-specific fallback using the shared suffix
      const refConsonant = spec.fallback.slice(0, 1); // "k"
      const kanaConsonant = normalFrom(dict, kana).slice(0, 1); // e.g. "s" for さん
      const kanaFallback = spec.fallback.replace(refConsonant, kanaConsonant);
      return {
        from: normalFrom(dict, kana),
        to: firstAzik(dict, kana, kanaFallback),
        label: kana,
      };
    }),
    frames: allFrames.slice(fi, fi + 2),
  };
}

function buildLev2aSummary(dict: Dict): IntroConfig {
  const specs = Object.values(LEV2A_SPEC_DATA);
  const suffixes = specs.map(s => firstAzik(dict, s.refKana, s.fallback).slice(-1).toUpperCase());
  const exampleFallbacks = ["kz", "sk", "bj", "td", "kl"];
  const exampleKana = ["かん", "しん", "ぶん", "てん", "こん"];
  return {
    title: `撥音まとめ: ${suffixes.join("/")}`,
    description: "5つの撥音拡張キー。母音キーの「1段下」というルール1つを覚えれば全部わかる。",
    examples: exampleKana.map((kana, i) => ({
      from: normalFrom(dict, kana),
      to: firstAzik(dict, kana, exampleFallbacks[i]),
      label: kana,
    })),
    frames: getLev2aFrames(dict),
  };
}

// ━━ Lev2b ━━

const LEV2B_SPEC_DATA = {
  "lev2b-ai-q": { titleReading: "あい", refKana: "かい", fallback: "kq", vowel: "a", position: "左上", exampleKana: ["かい", "さい", "たい", "ない"], frameIdx: 0 },
  "lev2b-uu-h": { titleReading: "うう", refKana: "くう", fallback: "kh", vowel: "u", position: "右隣", exampleKana: ["くう", "すう", "つう"],          frameIdx: 1 },
  "lev2b-ei-w": { titleReading: "えい", refKana: "けい", fallback: "kw", vowel: "e", position: "左上", exampleKana: ["けい", "せい", "てい", "へい"], frameIdx: 2 },
  "lev2b-ou-p": { titleReading: "おう", refKana: "こう", fallback: "kp", vowel: "o", position: "右隣", exampleKana: ["こう", "そう", "とう", "のう"], frameIdx: 3 },
} as const;

function buildLev2bStage(dict: Dict, stageId: keyof typeof LEV2B_SPEC_DATA): IntroConfig {
  const spec = LEV2B_SPEC_DATA[stageId];
  const ext = firstAzik(dict, spec.refKana, spec.fallback).slice(-1);
  const allFrames = getLev2bFrames(dict);
  const fi = spec.frameIdx * 2;
  let description = `[${spec.vowel}] の${spec.position}にある [${ext.toUpperCase()}]。子音+${ext.toUpperCase()} = 〜${spec.titleReading}。`;
  // For あい: note that ext single-key = ん
  if (stageId === "lev2b-ai-q") {
    const nKey = firstAzik(dict, "ん", "q");
    if (ext === nKey) {
      description += `※${ext.toUpperCase()} 単打は「ん」なので注意。`;
    }
  }
  return {
    title: `〜${spec.titleReading} は 子音+[${ext.toUpperCase()}]！`,
    description,
    examples: spec.exampleKana.map(kana => {
      const refConsonant = spec.fallback.slice(0, 1); // "k"
      const kanaConsonant = normalFrom(dict, kana).slice(0, 1); // e.g. "s" for さい
      const kanaFallback = spec.fallback.replace(refConsonant, kanaConsonant);
      return {
        from: normalFrom(dict, kana),
        to: firstAzik(dict, kana, kanaFallback),
        label: kana,
      };
    }),
    frames: allFrames.slice(fi, fi + 2),
  };
}

function buildLev2bSummary(dict: Dict): IntroConfig {
  const specs = Object.values(LEV2B_SPEC_DATA);
  const exts = specs.map(s => firstAzik(dict, s.refKana, s.fallback).slice(-1).toUpperCase());
  const exampleKana = ["かい", "くう", "けい", "こう"];
  const fallbacks = ["kq", "kh", "kw", "kp"];
  return {
    title: `二重母音まとめ: ${exts.join("/")}`,
    description: "4つの二重母音短縮キー。母音キーの「隣」にあるというルール。",
    examples: exampleKana.map((kana, i) => ({
      from: normalFrom(dict, kana),
      to: firstAzik(dict, kana, fallbacks[i]),
      label: kana,
    })),
    frames: getLev2bFrames(dict),
  };
}

// ━━ Lev3a ━━

function buildLev3aChouon(dict: Dict): IntroConfig {
  const key = firstAzik(dict, "ー", ":");
  return {
    title: `長音 は [${key}]！`,
    description: `「ー」を入力する [-] キーの隣にある [${key}] で代用。指をほとんど動かさずに打てる。`,
    examples: [
      { from: "-", to: key, label: "ー" },
      { from: "ko-hi-", to: `ko${key}hi${key}`, label: "コーヒー" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["-"], label: "従来: [-] 長音キー (遠い)" },
      { activeKeys: [key], normalKeys: ["-"], label: `[${key}] は [-] の隣 = 近い！`, sublabel: "どちらでも長音になる" },
    ],
  };
}

function buildLev3aGYouon(dict: Dict): IntroConfig {
  const kyaAzik = firstAzik(dict, "きゃ", "kga");
  const gKey = kyaAzik[1]; // Y-substitute character
  return {
    title: `拗音の Y → [${gKey.toUpperCase()}] で代用！`,
    description: `「kya」を「k${gKey}a」と打てる。左手だけで拗音を完結できるので楽。`,
    examples: [
      { from: normalFrom(dict, "きゃ"), to: firstAzik(dict, "きゃ", "kga"), label: "きゃ" },
      { from: normalFrom(dict, "にゃ"), to: firstAzik(dict, "にゃ", "nga"), label: "にゃ" },
      { from: normalFrom(dict, "りゃ"), to: firstAzik(dict, "りゃ", "rga"), label: "りゃ" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["y"], label: "従来: Y (右手に移動)" },
      { activeKeys: [gKey], normalKeys: ["y"], label: `[${gKey.toUpperCase()}] が [Y] の代わりに`, sublabel: "左手だけで拗音が完結する" },
    ],
  };
}

function buildLev3aCompatF(dict: Dict): IntroConfig {
  const kfAzik = firstAzik(dict, "き", "kf");
  const fKey = kfAzik.slice(-1);
  return {
    title: `語尾互換 [${fKey.toUpperCase()}]！`,
    description: `末尾が「い」や「う」で終わる音節を [${fKey}] で短縮。き→k${fKey}、ふ→h${fKey} など。`,
    examples: [
      { from: normalFrom(dict, "き"), to: firstAzik(dict, "き", "kf"), label: "き" },
      { from: normalFrom(dict, "ふ"), to: firstAzik(dict, "ふ", "hf"), label: "ふ" },
      { from: normalFrom(dict, "む"), to: firstAzik(dict, "む", "mf"), label: "む" },
      { from: normalFrom(dict, "ゆ"), to: firstAzik(dict, "ゆ", "yf"), label: "ゆ" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["i", "u"], label: "従来: 末尾に i / u を打つ" },
      { activeKeys: [fKey], normalKeys: [], label: `[${fKey.toUpperCase()}] で末尾 i/u を省略`, sublabel: `子音+${fKey} で語尾短縮` },
    ],
  };
}

function buildLev3aSummary(dict: Dict): IntroConfig {
  const chouon = firstAzik(dict, "ー", ":");
  const gKey = firstAzik(dict, "きゃ", "kga")[1];
  const fKey = firstAzik(dict, "き", "kf").slice(-1);
  return {
    title: "互換キー I まとめ",
    description: `長音[${chouon}]・拗音代用[${gKey}]・語尾互換[${fKey}] の3つを組み合わせる練習。`,
    examples: [
      { from: "-", to: chouon, label: "ー" },
      { from: normalFrom(dict, "きゃ"), to: firstAzik(dict, "きゃ", "kga"), label: "きゃ" },
      { from: normalFrom(dict, "き"), to: firstAzik(dict, "き", "kf"), label: "き" },
    ],
    frames: [
      { activeKeys: [], normalKeys: [chouon, gKey, fKey], label: "互換キー I の3キーを確認…" },
      { activeKeys: [chouon, gKey, fKey], normalKeys: [], label: "この3キーが互換キー I", sublabel: "文章の中で使いこなそう" },
    ],
  };
}

// ━━ Lev3b ━━

function buildLev3bForeignKana(dict: Dict): IntroConfig {
  const tgiKey = firstAzik(dict, "てぃ", "tgi");
  const dciKey = firstAzik(dict, "でぃ", "dci");
  const tguKey = firstAzik(dict, "とぅ", "tgu");
  return {
    title: `外来語拡張 ${tgiKey.toUpperCase()}/${dciKey.toUpperCase()}/${tguKey.toUpperCase()}`,
    description: `外来語特有の音節を3打で。てぃ→${tgiKey}、でぃ→${dciKey}、とぅ→${tguKey}。`,
    examples: [
      { from: normalFrom(dict, "てぃ"), to: tgiKey, label: "てぃ" },
      { from: normalFrom(dict, "でぃ"), to: dciKey, label: "でぃ" },
      { from: normalFrom(dict, "とぅ"), to: tguKey, label: "とぅ" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["t", "e", "x", "i"], label: "従来: t-e-x-i など (複雑)" },
      { activeKeys: [...tgiKey], normalKeys: [], label: `てぃ = ${tgiKey.toUpperCase()}`, sublabel: `でぃ=${dciKey.toUpperCase()} / とぅ=${tguKey.toUpperCase()}` },
    ],
  };
}

function buildLev3bZcZfZaZe(dict: Dict): IntroConfig {
  const zaKey = firstAzik(dict, "ざ", "zc");
  const zeKey = firstAzik(dict, "ぜ", "zf");
  return {
    title: `ざ→[${zaKey.toUpperCase()}]、ぜ→[${zeKey.toUpperCase()}]`,
    description: `「za」「ze」は指が交差して打ちにくい。[${zaKey}][${zeKey}] に置き換えて楽に。`,
    examples: [
      { from: normalFrom(dict, "ざ"), to: zaKey, label: "ざ" },
      { from: normalFrom(dict, "ぜ"), to: zeKey, label: "ぜ" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["z", "a"], label: `ざ: za → 指が交差して辛い` },
      { activeKeys: [...new Set([...zaKey])], normalKeys: [], label: `ざ: ${zaKey.toUpperCase()} → 左手内で完結！`, sublabel: `ぜ: ze → ${zeKey.toUpperCase()} も同様` },
    ],
  };
}

function buildLev3bZvZxZaiZei(dict: Dict): IntroConfig {
  const zaiOrigKey = nthAzik(dict, "ざい", 0, "zq");
  const zaiCompatKey = nthAzik(dict, "ざい", 1, "zv");
  const zeiOrigKey = nthAzik(dict, "ぜい", 0, "zw");
  const zeiCompatKey = nthAzik(dict, "ぜい", 1, "zx");
  return {
    title: `ざい→[${zaiCompatKey.toUpperCase()}]、ぜい→[${zeiCompatKey.toUpperCase()}]`,
    description: `「${zaiOrigKey}」「${zeiOrigKey}」は複雑な組み合わせ。[${zaiCompatKey}][${zeiCompatKey}] に置き換えて覚えやすく。`,
    examples: [
      { from: zaiOrigKey, to: zaiCompatKey, label: "ざい" },
      { from: zeiOrigKey, to: zeiCompatKey, label: "ぜい" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["z", "q"], label: `ざい: ${zaiOrigKey.toUpperCase()} → 遠くて打ちにくい` },
      { activeKeys: [...new Set([...zaiCompatKey])], normalKeys: [], label: `ざい: ${zaiCompatKey.toUpperCase()} → 近い！`, sublabel: `ぜい: ${zeiOrigKey} → ${zeiCompatKey.toUpperCase()} も同様` },
    ],
  };
}

function buildLev3bSfSsSaiSei(dict: Dict): IntroConfig {
  const saiOrigKey = nthAzik(dict, "さい", 0, "sq");
  const saiCompatKey = nthAzik(dict, "さい", 1, "sf");
  const seiOrigKey = nthAzik(dict, "せい", 0, "sw");
  const seiCompatKey = nthAzik(dict, "せい", 1, "ss");
  return {
    title: `さい→[${saiCompatKey.toUpperCase()}]、せい→[${seiCompatKey.toUpperCase()}]`,
    description: `「${saiOrigKey}」「${seiOrigKey}」の組み合わせを [${saiCompatKey}][${seiCompatKey}] に。さ行の二重音節をまとめてカバー。`,
    examples: [
      { from: saiOrigKey, to: saiCompatKey, label: "さい" },
      { from: seiOrigKey, to: seiCompatKey, label: "せい" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["s", "q"], label: `さい: ${saiOrigKey.toUpperCase()} → 遠い` },
      { activeKeys: [...new Set([...saiCompatKey])], normalKeys: [], label: `さい: ${saiCompatKey.toUpperCase()} → 近い！`, sublabel: `せい: ${seiOrigKey} → ${seiCompatKey.toUpperCase()} も同様` },
    ],
  };
}

function buildLev3bSummary(dict: Dict): IntroConfig {
  const zaKey = firstAzik(dict, "ざ", "zc");
  const zeKey = firstAzik(dict, "ぜ", "zf");
  const zaiCompatKey = nthAzik(dict, "ざい", 1, "zv");
  const zeiCompatKey = nthAzik(dict, "ぜい", 1, "zx");
  const saiCompatKey = nthAzik(dict, "さい", 1, "sf");
  const seiCompatKey = nthAzik(dict, "せい", 1, "ss");
  const allKeys = Array.from(new Set([...zaKey, ...zeKey, ...zaiCompatKey, ...zeiCompatKey, ...saiCompatKey, ...seiCompatKey]));
  return {
    title: "互換キー II まとめ",
    description: `${zaKey}/${zeKey}/${zaiCompatKey}/${zeiCompatKey}/${saiCompatKey}/${seiCompatKey} の6種。打ちにくい組み合わせを近い指で代替する。`,
    examples: [
      { from: normalFrom(dict, "ざ"), to: zaKey, label: "ざ" },
      { from: normalFrom(dict, "ぜ"), to: zeKey, label: "ぜ" },
      { from: nthAzik(dict, "ざい", 0, "zq"), to: zaiCompatKey, label: "ざい" },
      { from: nthAzik(dict, "ぜい", 0, "zw"), to: zeiCompatKey, label: "ぜい" },
    ],
    frames: [
      { activeKeys: [], normalKeys: ["a", "e", "q", "w"], label: "従来: 遠いキーへ指が伸びる…" },
      { activeKeys: allKeys, normalKeys: [], label: "AZIK: 左手内で完結！", sublabel: "打ちにくい → 打ちやすいキーへ" },
    ],
  };
}

// ━━ Lev4 ━━

function buildLev4SpecialExt1(dict: Dict): IntroConfig {
  const kotKey = firstAzik(dict, "こと", "kt");
  const monoKey = firstAzik(dict, "もの", "mn");
  const suruKey = firstAzik(dict, "する", "sr");
  const masuKey = firstAzik(dict, "ます", "ms");
  const kotNormal = normalFrom(dict, "こと");
  return {
    title: "語短縮: 頻出語が2打で！",
    description: `日本語で超頻出する機能語を2打に圧縮。こと[${kotKey}]・もの[${monoKey}]・する[${suruKey}]・ます[${masuKey}]など。`,
    examples: [
      { from: normalFrom(dict, "こと"), to: kotKey, label: "こと" },
      { from: normalFrom(dict, "もの"), to: monoKey, label: "もの" },
      { from: normalFrom(dict, "する"), to: suruKey, label: "する" },
      { from: normalFrom(dict, "ます"), to: masuKey, label: "ます" },
    ],
    frames: [
      { activeKeys: [], normalKeys: [...kotNormal.slice(0, 3)], label: `従来: ${kotNormal} (${kotNormal.length}打)…` },
      { activeKeys: [...kotKey], normalKeys: [], label: `${kotKey} = こと (${kotKey.length}打！)`, sublabel: `${monoKey}=もの / ${suruKey}=する / ${masuKey}=ます` },
    ],
  };
}

function buildLev4Summary(dict: Dict): IntroConfig {
  const kotKey = firstAzik(dict, "こと", "kt");
  const monoKey = firstAzik(dict, "もの", "mn");
  const suruKey = firstAzik(dict, "する", "sr");
  const masuKey = firstAzik(dict, "ます", "ms");
  const allKeys = [...new Set([...kotKey, ...monoKey, ...suruKey, ...masuKey])];
  return {
    title: "特殊拡張まとめ",
    description: "語短縮キーを交えた自然な日本語文章。無意識に使えるまで繰り返そう。",
    examples: [
      { from: normalFrom(dict, "こと"), to: kotKey, label: "こと" },
      { from: normalFrom(dict, "する"), to: suruKey, label: "する" },
      { from: normalFrom(dict, "ます"), to: masuKey, label: "ます" },
    ],
    frames: [
      { activeKeys: [], normalKeys: allKeys, label: "語短縮キーを確認…" },
      { activeKeys: allKeys, normalKeys: [], label: "この組み合わせが語短縮AZIK", sublabel: "頻出語を2打で" },
    ],
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エクスポート: buildIntroConfig
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildIntroConfig(
  stageId: string,
  dict: Dict = AZIK_DICTIONARY,
): IntroConfig | null {
  switch (stageId) {
    case "lev1-sokuon":         return buildLev1Sokuon(dict);
    case "lev1-hatsuon-q":      return buildLev1HatsuonQ(dict);
    case "lev1-sha":            return buildLev1Sha(dict);
    case "lev1-cha":            return buildLev1Cha(dict);
    case "lev1-summary":        return buildLev1Summary(dict);

    case "lev2a-an-z":
    case "lev2a-in-k":
    case "lev2a-un-j":
    case "lev2a-en-d":
    case "lev2a-on-l":
      return buildLev2aStage(dict, stageId as keyof typeof LEV2A_SPEC_DATA);
    case "lev2a-summary":       return buildLev2aSummary(dict);

    case "lev2b-ai-q":
    case "lev2b-uu-h":
    case "lev2b-ei-w":
    case "lev2b-ou-p":
      return buildLev2bStage(dict, stageId as keyof typeof LEV2B_SPEC_DATA);
    case "lev2b-summary":       return buildLev2bSummary(dict);

    case "lev3a-chouon-colon":  return buildLev3aChouon(dict);
    case "lev3a-g-youon":       return buildLev3aGYouon(dict);
    case "lev3a-compat-f":      return buildLev3aCompatF(dict);
    case "lev3a-summary":       return buildLev3aSummary(dict);

    case "lev3b-foreign-kana":  return buildLev3bForeignKana(dict);
    case "lev3b-zc-zf-za-ze":   return buildLev3bZcZfZaZe(dict);
    case "lev3b-zv-zx-zai-zei": return buildLev3bZvZxZaiZei(dict);
    case "lev3b-sf-ss-sai-sei": return buildLev3bSfSsSaiSei(dict);
    case "lev3b-summary":       return buildLev3bSummary(dict);

    case "lev4-special-ext-1":  return buildLev4SpecialExt1(dict);
    case "lev4-summary":        return buildLev4Summary(dict);

    default:                    return null;
  }
}
