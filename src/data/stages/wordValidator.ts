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
