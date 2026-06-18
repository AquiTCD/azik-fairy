import { AZIK_DICTIONARY, splitIntoAzikSegments, AzikMapping, AzikSegment, StageData } from "../azikRules";

// -------------------------------------------------------------
// AZIKレベル定義
// 各レベルは新しいショートカットキーを追加（累積）
// -------------------------------------------------------------
export enum AzikLevel {
  Lev0    = "Lev0",    // 基本ローマ字のみ
  Lev1a   = "Lev1a",  // っ → ;
  Lev1b   = "Lev1b",  // ん → q
  Lev1c   = "Lev1c",  // しゃ行 → x (xa/xo/xz/xp etc.)
  Lev1d   = "Lev1d",  // ちゃ行 → c (ca/co/cz/cp etc.)
  Lev2a   = "Lev2a",  // 撥音拡張 Z/K/J/D/L (かん=kz, しん=sk etc.)
  Lev2b   = "Lev2b",  // 二重母音 Q/H/W/P (かい=kq, こう=kp etc.)
  Lev3a   = "Lev3a",  // 長音[:], 拗音G代用, 互換F (kga, kgh, kf etc.)
  Lev3b   = "Lev3b",  // 互換 ZC/ZF/ZV/ZX/SF/SS
  Lev4    = "Lev4",   // 特殊2打語 (こと=kt, もの=mn etc.)
  Practice = "Practice", // 制限なし
}

const LEVEL_ORDER: AzikLevel[] = [
  AzikLevel.Lev0,
  AzikLevel.Lev1a,
  AzikLevel.Lev1b,
  AzikLevel.Lev1c,
  AzikLevel.Lev1d,
  AzikLevel.Lev2a,
  AzikLevel.Lev2b,
  AzikLevel.Lev3a,
  AzikLevel.Lev3b,
  AzikLevel.Lev4,
  AzikLevel.Practice,
];

export function levelOrdinal(level: AzikLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

// Lev4 語短縮キー
const LEV4_SHORTCUTS = new Set([
  "km","kr","gr","kt","gt","zr","st","sr","tt","tb",
  "tm","tr","dt","dr","dm","nr","nt","nb","ht","bt",
  "ms","mt","mn","yr","rr","wt","wr",
]);

// Lev3b 互換キー
const LEV3B_KEYS = new Set(["zc","zf","zv","zx","sf","ss"]);

/**
 * AZIKキー文字列を最低要求レベルに分類する
 *
 * 判定優先順:
 * 1. ;* → Lev1a (っ)
 * 2. q  → Lev1b (ん単打)
 * 3. x* → Lev1c (シャ行)
 * 4. c* → Lev1d (チャ行)
 * 5. Lev3b compat: zc/zf/zv/zx/sf/ss
 * 6. Lev4 語短縮
 * 7. : (長音互換) → Lev3a
 * 8. *g* (G代用, pos1にg) → Lev3a
 * 9. *f (2文字末尾f) → Lev3a compat-F (kf/nf/mf/hf/yf/df etc.)
 * 10. f で始まる場合: 末尾サフィックスで判定 (fz→Lev2a, fp→Lev2b, fa→Lev0)
 * 11. 末尾 z/k/j/d/l → Lev2a
 * 12. 末尾 q/h/w/p → Lev2b
 * 13. その他 → Lev0
 */
export function classifyAzikKey(key: string): AzikLevel {
  if (!key || key.length === 0) return AzikLevel.Lev0;

  // 非ASCII文字 (ひらがな等) = パーサのフォールバック産物 → タイプ不能
  if (/[^\x00-\x7F]/.test(key)) return AzikLevel.Practice;

  // 1. っ ショートカット
  if (key === ";" || key.startsWith(";")) return AzikLevel.Lev1a;

  // 2. ん 単打
  if (key === "q") return AzikLevel.Lev1b;

  // 3. シャ行 (xで始まるすべてのパターン: xa/xi/xu/xz/xj/xl/xh/xp 等)
  if (key.startsWith("x")) return AzikLevel.Lev1c;

  // 4. チャ行 (cで始まるすべてのパターン: ca/ci/cu/cz/cj/cl/ch/cp 等)
  if (key.startsWith("c")) return AzikLevel.Lev1d;

  // 5. Lev3b 互換キー (x*/c*より先にチェック済みなので安全)
  if (LEV3B_KEYS.has(key)) return AzikLevel.Lev3b;

  // 6. Lev4 語短縮
  if (LEV4_SHORTCUTS.has(key)) return AzikLevel.Lev4;

  // 7. 長音互換
  if (key === ":") return AzikLevel.Lev3a;

  // 8. G代用 (3文字以上でpos1がg: kga/kgz/kgp/nga 等)
  if (key.length >= 3 && key[1] === "g") return AzikLevel.Lev3a;

  // 9. compat-F (2文字末尾がf: kf/nf/mf/hf/yf/df/jf 等)
  //    ただしzf/sfはLev3bで既に処理済み
  if (key.length === 2 && key[1] === "f") return AzikLevel.Lev3a;

  // 10. ファ行 (fで始まるパターン: fa/fi/fe/fo → Lev0, fz/fk/fj/fd/fl/fn → Lev2a, fp/fh/fw/fq → Lev2b)
  if (key.startsWith("f")) {
    const last = key[key.length - 1];
    if (["z","k","j","d","l","n"].includes(last)) return AzikLevel.Lev2a;
    if (["q","h","w","p"].includes(last)) return AzikLevel.Lev2b;
    return AzikLevel.Lev0;
  }

  const last = key[key.length - 1];

  // 11. 撥音拡張サフィックス Z/K/J/D/L/N
  //     (kz=かん, kk=きん, kj=くん, kd=けん, kl=こん, kn=かん代替など)
  if (["z","k","j","d","l","n"].includes(last)) return AzikLevel.Lev2a;

  // 12. 二重母音サフィックス Q/H/W/P
  if (["q","h","w","p"].includes(last)) return AzikLevel.Lev2b;

  // 13. 基本ローマ字
  return AzikLevel.Lev0;
}

/**
 * セグメントのAZIKキー群から最小要求レベルを返す
 * (複数キーがある場合は最も低いレベル = 最もアクセスしやすいキー)
 */
function minLevelForKeys(keys: string[]): AzikLevel {
  if (keys.length === 0) return AzikLevel.Lev0;
  let minOrd = levelOrdinal(AzikLevel.Practice);
  let minLevel = AzikLevel.Practice;
  for (const k of keys) {
    const lv = classifyAzikKey(k);
    const ord = levelOrdinal(lv);
    if (ord < minOrd) {
      minOrd = ord;
      minLevel = lv;
    }
  }
  return minLevel;
}

/**
 * maxLevel 以下のAZIKキーを持つエントリだけを残した辞書を返す
 *
 * 目的: 指定レベル以上のショートカットをパーサから隠し、フォールバック分割を強制する。
 * 例: filterDictionaryByLevel(dict, Lev1b) では かん[kz](Lev2a) を除外 →
 *     パーサが か[ka] + ん[q] に分解するようになる
 */
export function filterDictionaryByLevel(
  dict: Record<string, AzikMapping>,
  maxLevel: AzikLevel,
): Record<string, AzikMapping> {
  if (maxLevel === AzikLevel.Practice) return dict;
  const maxOrd = levelOrdinal(maxLevel);
  const result: Record<string, AzikMapping> = {};
  for (const [kana, mapping] of Object.entries(dict)) {
    const minRequired = minLevelForKeys(mapping.azik);
    if (levelOrdinal(minRequired) <= maxOrd) {
      result[kana] = mapping;
    }
  }
  return result;
}

/**
 * かな文字列を指定レベルでタイプできるかを判定する
 *
 * maxLevel でフィルタした辞書を使ってパースし、全セグメントが maxLevel 以下なら true。
 * Practiceレベルは制限なし。
 *
 * 例: canWordAppearAtLevel("いっぱん", Lev1a)
 *   → ぱん[pz] は Lev2a → 辞書から除外 → パーサは ぱ[pa]+ん[q] に分解
 *   → ん[q] は Lev1b > Lev1a → false（っ ステージには不適）
 */
export function canWordAppearAtLevel(
  kana: string,
  maxLevel: AzikLevel,
  dictionary: Record<string, AzikMapping> = AZIK_DICTIONARY,
): boolean {
  if (maxLevel === AzikLevel.Practice) return true;
  const filteredDict = filterDictionaryByLevel(dictionary, maxLevel);
  const segments = splitIntoAzikSegments(kana, filteredDict);
  const maxOrd = levelOrdinal(maxLevel);
  return segments.every(seg => levelOrdinal(minLevelForKeys(seg.azik)) <= maxOrd);
}

/**
 * かな文字列を正しくタイプするために必要な最小AZIKレベルを返す
 */
export function findMinimumLevel(
  kana: string,
  dictionary: Record<string, AzikMapping> = AZIK_DICTIONARY,
): AzikLevel {
  const segments = splitIntoAzikSegments(kana, dictionary);
  let maxOrd = 0;
  let result: AzikLevel = AzikLevel.Lev0;
  for (const seg of segments) {
    const segLevel = minLevelForKeys(seg.azik);
    const ord = levelOrdinal(segLevel);
    if (ord > maxOrd) {
      maxOrd = ord;
      result = segLevel;
    }
  }
  return result;
}

const OBSOLETE_KANA = /[ゐゑヰヱ]/;

/**
 * ステージ語彙から不適切な語を除去して新しい StageData を返す純粋関数。
 * - 全カテゴリ: 廃字（ゐゑヰヱ）を含む語を除外
 * - Practice カテゴリ: Lev0（AZIK ショートカット不要）の語を追加除外
 */
export function filterStageWords(stage: StageData): StageData {
  const words = stage.words.filter(w => !OBSOLETE_KANA.test(w.kana));
  return {
    ...stage,
    words: stage.category === "Practice"
      ? words.filter(w => findMinimumLevel(w.kana) !== AzikLevel.Lev0)
      : words,
  };
}

/**
 * AZIKパターンが対象レベルのショートカットを含むか判定する
 *
 * 促音複合パターン（;kz 等）は先頭の ; を剥がしてコアで判定する。
 * これにより っかん(;kz) が Lev2a ステージで「対象あり」と正しく判定される。
 */
export function containsTargetLevel(pattern: string, target: AzikLevel): boolean {
  const core = (pattern.startsWith(";") && pattern.length > 1) ? pattern.slice(1) : pattern;
  return classifyAzikKey(core) === target;
}

/**
 * セグメントがステージのターゲットレベルのキーを含むか判定する
 *
 * - 通常ステージ: azikLevel に一致するセグメントのみ対象
 * - まとめステージ: Lev1a 〜 stageLevel の全レベルが対象
 */
export function isTargetSegment(
  seg: AzikSegment,
  stageLevel: AzikLevel,
  isSummaryStage: boolean,
): boolean {
  if (isSummaryStage) {
    const stageOrd = levelOrdinal(stageLevel);
    const lev1aOrd = levelOrdinal(AzikLevel.Lev1a);
    return seg.azik.some(pattern => {
      const core = (pattern.startsWith(";") && pattern.length > 1) ? pattern.slice(1) : pattern;
      const ord = levelOrdinal(classifyAzikKey(core));
      return ord >= lev1aOrd && ord <= stageOrd;
    });
  }
  return seg.azik.some(pattern => containsTargetLevel(pattern, stageLevel));
}

// -------------------------------------------------------------
// サブステージ専用キー判別
// Lev3a/Lev3b は同一 AzikLevel 内に複数サブパターンを持つため、
// ステージIDごとにターゲットキーを判別する述語を定義する。
// allowedPatterns フィルターとボキャブラリー検証の両方で使用する。
// -------------------------------------------------------------

/** コアキー文字列がステージのターゲットパターンに一致するか判別する述語 */
export type StageKeyPredicate = (core: string) => boolean;

/**
 * ステージIDごとのターゲットキー判別述語。
 * ここにないステージは AzikLevel ベースのフィルターを使う。
 */
export const STAGE_KEY_PREDS: Record<string, StageKeyPredicate> = {
  "lev3a-chouon-colon": (k) => k === ":",
  "lev3a-g-youon":      (k) => k.length >= 3 && k[1] === "g",
  "lev3a-compat-f":     (k) => k.length === 2 && k[1] === "f",
  "lev3b-zc-zf-za-ze":  (k) => k === "zc" || k === "zf",
  "lev3b-zv-zx-zai-zei":(k) => k === "zv" || k === "zx",
  "lev3b-sf-ss-sai-sei": (k) => k === "sf" || k === "ss",
};

/**
 * 語がそのステージのターゲットキーを一つ以上含むか返す。
 * Lev3a/Lev3b サブステージ向け: STAGE_KEY_PREDS に登録されていないステージは常に true。
 *
 * 用途: lev3a-compat-f に G代用語しか含まない語（例: きょく）を除外する。
 */
export function hasWordTargetKey(
  kana: string,
  stageId: string,
  dictionary: Record<string, AzikMapping> = AZIK_DICTIONARY,
): boolean {
  const pred = STAGE_KEY_PREDS[stageId];
  if (!pred) return true;
  const segments = splitIntoAzikSegments(kana, dictionary);
  return segments.some(seg =>
    seg.azik.some(k => {
      const core = (k.startsWith(";") && k.length > 1) ? k.slice(1) : k;
      return pred(core);
    }),
  );
}

// -------------------------------------------------------------
// ステージ純粋性チェック
// Lev1/Lev2 ステージでは、お題以外のAZIKショートカットを含む語を汚染とみなす。
// 許容: Lev0（基本ローマ字）/ Lev3a・3b・4（互換・語短縮）/ お題のショートカット
// 汚染: 上記以外のすべてのAZIKショートカット（他ステージのお題を含む）
// -------------------------------------------------------------

/** ステージIDごとの純粋性ルール。ここにないステージはチェック対象外。 */
export const STAGE_PURITY_RULES: Record<string, { targetLevel: AzikLevel; targetSuffix: string | null }> = {
  "lev1-sha":   { targetLevel: AzikLevel.Lev1c, targetSuffix: null },
  "lev1-cha":   { targetLevel: AzikLevel.Lev1d, targetSuffix: null },
  "lev2a-an-z": { targetLevel: AzikLevel.Lev2a, targetSuffix: "z" },
  "lev2a-in-k": { targetLevel: AzikLevel.Lev2a, targetSuffix: "k" },
  "lev2a-un-j": { targetLevel: AzikLevel.Lev2a, targetSuffix: "j" },
  "lev2a-en-d": { targetLevel: AzikLevel.Lev2a, targetSuffix: "d" },
  "lev2a-on-l": { targetLevel: AzikLevel.Lev2a, targetSuffix: "l" },
  "lev2b-ai-q": { targetLevel: AzikLevel.Lev2b, targetSuffix: "q" },
  "lev2b-uu-h": { targetLevel: AzikLevel.Lev2b, targetSuffix: "h" },
  "lev2b-ei-w": { targetLevel: AzikLevel.Lev2b, targetSuffix: "w" },
  "lev2b-ou-p": { targetLevel: AzikLevel.Lev2b, targetSuffix: "p" },
};

/** キーが Lev0/互換（Lev3a/3b/4）かを返す — どのステージでも常に許容 */
function isBaseKey(key: string): boolean {
  const core = (key.startsWith(";") && key.length > 1) ? key.slice(1) : key;
  const lv = classifyAzikKey(core);
  return lv === AzikLevel.Lev0 || lv === AzikLevel.Lev3a || lv === AzikLevel.Lev3b || lv === AzikLevel.Lev4;
}

/** キーがお題ステージのターゲットショートカットかを返す */
function isTargetKey(key: string, targetLevel: AzikLevel, targetSuffix: string | null): boolean {
  const core = (key.startsWith(";") && key.length > 1) ? key.slice(1) : key;
  const lv = classifyAzikKey(core);
  if (lv !== targetLevel) return false;
  if (targetSuffix === null) return true;
  return core[core.length - 1] === targetSuffix;
}

/**
 * セグメントが純粋かを返す
 *
 * pure の条件（いずれか）:
 *   1. AZIK配列が空（基本ローマ字のみ）
 *   2. ターゲットキーを持つ（FOCUSモードで正しく強制される）
 *   3. ターゲットキーを持たないが、全AZIKキーが Lev0/互換 のみ
 *
 * ケース2に "sw" と "ss" が共存する例（せい）:
 *   sw = Lev2b → ターゲット外, ss = Lev3b → 互換
 *   ターゲットキーなし → ケース3 判定 → sw が Lev2b → pure = false（汚染）
 */
function isSegmentPure(
  seg: AzikSegment,
  targetLevel: AzikLevel,
  targetSuffix: string | null,
): boolean {
  if (seg.azik.length === 0) return true;
  if (seg.azik.some(k => isTargetKey(k, targetLevel, targetSuffix))) return true;
  return seg.azik.every(isBaseKey);
}

/**
 * 指定ステージにとって語が「純粋」かを返す
 * STAGE_PURITY_RULES に登録されていないステージは常に true。
 *
 * 純粋 = 全セグメントが isSegmentPure を満たす。
 * 汚染されたセグメントとは、「Lev0 / 互換 / お題ショートカット」以外の
 * AZIKキーしか持たないセグメントのこと。
 */
export function isWordPureForStage(
  kana: string,
  stageId: string,
  dictionary: Record<string, AzikMapping> = AZIK_DICTIONARY,
): boolean {
  const rule = STAGE_PURITY_RULES[stageId];
  if (!rule) return true;
  const segments = splitIntoAzikSegments(kana, dictionary);
  return segments.every(seg => isSegmentPure(seg, rule.targetLevel, rule.targetSuffix));
}

// -------------------------------------------------------------

/**
 * ステージIDに対応するAzikLevelを返すヘルパー
 * ステージJSONの azikLevel フィールドと対応
 */
export const STAGE_MAX_LEVELS: Record<string, AzikLevel> = {
  "lev1-sokuon":           AzikLevel.Lev1a,
  "lev1-hatsuon-q":        AzikLevel.Lev1b,
  "lev1-sha":              AzikLevel.Lev1c,
  "lev1-cha":              AzikLevel.Lev1d,
  "lev1-summary":          AzikLevel.Lev1d,
  "lev2a-an-z":            AzikLevel.Lev2a,
  "lev2a-in-k":            AzikLevel.Lev2a,
  "lev2a-un-j":            AzikLevel.Lev2a,
  "lev2a-en-d":            AzikLevel.Lev2a,
  "lev2a-on-l":            AzikLevel.Lev2a,
  "lev2a-summary":         AzikLevel.Lev2a,
  "lev2b-ai-q":            AzikLevel.Lev2b,
  "lev2b-uu-h":            AzikLevel.Lev2b,
  "lev2b-ei-w":            AzikLevel.Lev2b,
  "lev2b-ou-p":            AzikLevel.Lev2b,
  "lev2b-summary":         AzikLevel.Lev2b,
  "lev3a-chouon-colon":    AzikLevel.Lev3a,
  "lev3a-g-youon":         AzikLevel.Lev3a,
  "lev3a-compat-f":        AzikLevel.Lev3a,
  "lev3a-summary":         AzikLevel.Lev3a,
  "lev3b-foreign-kana":    AzikLevel.Lev3b,
  "lev3b-zc-zf-za-ze":    AzikLevel.Lev3b,
  "lev3b-zv-zx-zai-zei":  AzikLevel.Lev3b,
  "lev3b-sf-ss-sai-sei":  AzikLevel.Lev3b,
  "lev3b-summary":         AzikLevel.Lev3b,
  "lev4-special-ext-1":   AzikLevel.Lev4,
  "lev4-summary":          AzikLevel.Lev4,
  "practice-words-1":      AzikLevel.Practice,
  "practice-words-2":      AzikLevel.Practice,
  "practice-sentences":    AzikLevel.Practice,
  "practice-long-text":    AzikLevel.Practice,
};
