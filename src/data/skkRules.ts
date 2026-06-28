// SKK送りがなシミュレーション用の型定義とルール定数

import { buildValidKeys, AzikMapping, AZIK_DICTIONARY } from "./azikRules";

export interface SkkKey {
  key: string;      // lowercase (例: "k", "p", "i")
  shift?: boolean;  // true = Shift押下（変換開始 or 送りがなトリガー）
}

export type SkkInputType = "standard" | "azik-okuri";

/** hook内部の打鍵単位。SkkSegment を平坦化して生成する */
export interface SkkTypingWord {
  display: string;          // 表示用: "書く"
  sentence?: string;        // 所属する文 (SkkSentence.text)
  reading: string;          // 漢字確定部分のかな: "か"（ひらがなセグメントは ""）
  okurigana: string;        // 送りがな: "く"（ひらがな/純漢字セグメントは ""）
  inputType: SkkInputType;
  keys: SkkKey[];           // 期待キー列
  standardKeyCount: number; // AZIK非使用時の理論打鍵数（AZIK節約比率計算用）
  hint: string;
}

/** ステージJSON上のセグメント種別 */
export type SkkSegmentType = "hiragana" | "kanji" | "okurigana";

/** ステージJSON上の1セグメント（ひらがな/純漢字/送りがな）*/
export interface SkkSegment {
  display: string;
  segmentType: SkkSegmentType;
  keys?: SkkKey[];          // okurigana は必須; kanji/hiragana は effectiveDict から動的生成
  standardKeyCount: number;
  hint?: string;            // 省略時は keys から自動生成
  reading?: string;         // kanji / okurigana のみ
  okurigana?: string;       // okurigana のみ
  inputType?: SkkInputType; // okurigana のみ
}

/** ステージJSON上の1文 */
export interface SkkSentence {
  text: string;
  segments: SkkSegment[];
}

export interface SkkStageData {
  id: string;
  category: "SKK";
  name: string;
  description: string;
  concept?: string;
  sentences: SkkSentence[];
}

// -------------------------------------------------------------
// macSKK AZIK <okuri> ルールテーブル
// kana-rule-azik.conf の <okuri> 定義に対応
// key: AZIKの2打鍵ローマ字, value: { reading, okurigana }
// -------------------------------------------------------------
export const SKK_AZIK_OKURI_TABLE: Record<string, { reading: string; okurigana: string }> = {
  // q系（〜い）
  "kq": { reading: "か", okurigana: "い" },
  "sq": { reading: "さ", okurigana: "い" },
  "tq": { reading: "た", okurigana: "い" },
  "nq": { reading: "な", okurigana: "い" },
  "hq": { reading: "は", okurigana: "い" },
  "mq": { reading: "ま", okurigana: "い" },
  "rq": { reading: "ら", okurigana: "い" },
  "gq": { reading: "が", okurigana: "い" },
  "zq": { reading: "ざ", okurigana: "い" },
  "bq": { reading: "ば", okurigana: "い" },
  "pq": { reading: "ぱ", okurigana: "い" },

  // h系（〜う 短母音）
  "kh": { reading: "く", okurigana: "う" },
  "sh": { reading: "す", okurigana: "う" },
  "th": { reading: "つ", okurigana: "う" },
  "nh": { reading: "ぬ", okurigana: "う" },
  "mh": { reading: "む", okurigana: "う" },
  "rh": { reading: "る", okurigana: "う" },
  "gh": { reading: "ぐ", okurigana: "う" },
  "bh": { reading: "ぶ", okurigana: "う" },

  // p系（〜おう → う）
  "kp": { reading: "こ", okurigana: "う" },
  "sp": { reading: "そ", okurigana: "う" },
  "tp": { reading: "と", okurigana: "う" },
  "rp": { reading: "ろ", okurigana: "う" },
  "bp": { reading: "ぼ", okurigana: "う" },
  "gp": { reading: "ご", okurigana: "う" },
  "mp": { reading: "も", okurigana: "う" },
  "np": { reading: "の", okurigana: "う" },

  // w系（〜えい → い）
  "kw": { reading: "け", okurigana: "い" },
  "sw": { reading: "せ", okurigana: "い" },
  "tw": { reading: "て", okurigana: "い" },
  "rw": { reading: "れ", okurigana: "い" },
  "bw": { reading: "べ", okurigana: "い" },
  "gw": { reading: "げ", okurigana: "い" },
  "mw": { reading: "め", okurigana: "い" },
  "nw": { reading: "ね", okurigana: "い" },

  // r系（〜る）
  "kr": { reading: "か", okurigana: "る" },
  "sr": { reading: "す", okurigana: "る" },
  "tr": { reading: "た", okurigana: "る" },
  "nr": { reading: "な", okurigana: "る" },
  "hr": { reading: "ふ", okurigana: "る" },
  "mr": { reading: "ま", okurigana: "る" },
  "yr": { reading: "よ", okurigana: "る" },
  "gr": { reading: "が", okurigana: "る" },
  "br": { reading: "ば", okurigana: "る" },
};

// -------------------------------------------------------------
// 標準SKK入力のためのローマ字変換テーブル（kana → romaji）
// buildSkkKeys の standardKeyCount 計算に使用
// -------------------------------------------------------------
const KANA_TO_ROMAJI: Record<string, string> = {
  "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
  "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
  "さ": "sa", "し": "si", "す": "su", "せ": "se", "そ": "so",
  "た": "ta", "ち": "ti", "つ": "tu", "て": "te", "と": "to",
  "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
  "は": "ha", "ひ": "hi", "ふ": "hu", "へ": "he", "ほ": "ho",
  "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
  "や": "ya", "ゆ": "yu", "よ": "yo",
  "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
  "わ": "wa", "を": "wo", "ん": "nn",
  "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
  "ざ": "za", "じ": "zi", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
  "だ": "da", "ぢ": "di", "づ": "du", "で": "de", "ど": "do",
  "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
  "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
  "っ": "ltu",
};

/**
 * 標準SKK（AZIK非使用）での理論打鍵数を計算する。
 * reading + okurigana をそれぞれローマ字に変換してカウントする。
 * 変換開始Shift(1打)と送りがな先頭Shift(1打)を加算する。
 *
 * 例: 書く (reading="か", okurigana="く")
 *   → K(1) + a(1) + K(1) + u(1) = 4打
 */
export function calcStandardKeyCount(reading: string, okurigana: string): number {
  const readingRomaji = [...reading].map(c => KANA_TO_ROMAJI[c] ?? c).join("");
  const okuriRomaji = [...okurigana].map(c => KANA_TO_ROMAJI[c] ?? c).join("");
  // 変換開始のShiftは最初の文字と同時押しなので打鍵数に加算しない（e.g. K = 1打）
  // 送りがな先頭もShift同時押し = 1打
  return readingRomaji.length + okuriRomaji.length;
}

/**
 * AZIK <okuri> ルールを使った場合のキー列を生成する。
 *
 * 例1: 憩う (reading="いこ", okurigana="う")
 *   → "kp" ルールが "こ"+"う" にマッチ → [{key:"i",shift:true},{key:"k"},{key:"p",shift:true}]
 *
 * 例2: 為る (reading="す", okurigana="る")
 *   → "sr" ルールが "す"+"る" にマッチ → [{key:"s",shift:true},{key:"r",shift:true}]
 *
 * reading の最後の kana + okurigana が SKK_AZIK_OKURI_TABLE のいずれかに一致する場合に
 * AZIK ショートカットとして展開する。一致しない場合は null を返す。
 */
export function buildAzikOkuriKeys(reading: string, okurigana: string): SkkKey[] | null {
  // reading末尾の1文字 + okurigana がルールに一致するか探す
  for (const [azikKey, rule] of Object.entries(SKK_AZIK_OKURI_TABLE)) {
    if (rule.reading === reading.slice(-rule.reading.length) && rule.okurigana === okurigana) {
      const prefix = reading.slice(0, reading.length - rule.reading.length);
      const prefixKeys = buildStandardReadingKeys(prefix);
      const [firstAzik, ...restAzik] = azikKey.split("");
      // prefixKeys の先頭に変換開始Shiftを付与
      if (prefixKeys.length === 0) {
        // reading がまるごとルールにマッチ（例: 為る = "す" → sr ルール）
        return [
          { key: firstAzik, shift: true },
          ...restAzik.map((k, i) => ({ key: k, shift: i === restAzik.length - 1 })),
        ];
      }
      const [firstPrefix, ...restPrefix] = prefixKeys;
      return [
        { ...firstPrefix, shift: true },
        ...restPrefix,
        { key: firstAzik },
        ...restAzik.map((k, i) => ({ key: k, shift: i === restAzik.length - 1 })),
      ];
    }
  }
  return null;
}

/**
 * 標準SKKのキー列を生成する（AZIK非使用）。
 * reading をローマ字展開し先頭をShift、okurigana先頭子音をShift。
 *
 * 例: 書く (reading="か", okurigana="く")
 *   → [{key:"k",shift:true},{key:"a"},{key:"k",shift:true},{key:"u"}]
 */
export function buildStandardSkkKeys(reading: string, okurigana: string): SkkKey[] {
  const readingKeys = buildStandardReadingKeys(reading);
  const okuriKeys = buildStandardReadingKeys(okurigana);

  if (readingKeys.length === 0 || okuriKeys.length === 0) return [];

  const [firstReading, ...restReading] = readingKeys;
  const [firstOkuri, ...restOkuri] = okuriKeys;

  return [
    { ...firstReading, shift: true },
    ...restReading,
    { ...firstOkuri, shift: true },
    ...restOkuri,
  ];
}

/** かな文字列をローマ字キー列に展開する（Shift なし） */
function buildStandardReadingKeys(kana: string): SkkKey[] {
  const keys: SkkKey[] = [];
  for (const char of kana) {
    const romaji = KANA_TO_ROMAJI[char] ?? char;
    for (const k of romaji) {
      keys.push({ key: k });
    }
  }
  return keys;
}

/** SkkStageData の型ガード */
export function isSkkStageData(data: unknown): data is SkkStageData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return d.category === "SKK" && Array.isArray(d.sentences);
}

/** ユーザーの effectiveDict でかな文字列をキー列に変換する（kanji/hiragana セグメント用） */
function computeKanaKeys(
  kana: string,
  isKanji: boolean,
  dict: Record<string, AzikMapping>,
): SkkKey[] {
  const sequences = buildValidKeys(kana, dict);
  const seq = sequences.length > 0
    ? sequences.reduce((a, b) => (a.length <= b.length ? a : b))
    : [...kana].map(c => KANA_TO_ROMAJI[c] ?? c).join("");
  return seq.split("").map((k, i) => ({
    key: k,
    ...(isKanji && i === 0 ? { shift: true } : {}),
  }));
}

function skkKeysToHint(keys: SkkKey[]): string {
  return keys.map(k => (k.shift ? k.key.toUpperCase() : k.key)).join(" ");
}

/** SkkSentence[] を hook が扱う SkkTypingWord[] に平坦化する。
 *  kanji/hiragana セグメントのキー列は effectiveDict から動的生成。
 *  okurigana セグメントは JSON の keys をそのまま使用。 */
export function flattenSentences(
  sentences: SkkSentence[],
  effectiveDict: Record<string, AzikMapping> = AZIK_DICTIONARY,
): SkkTypingWord[] {
  return sentences.flatMap(s =>
    s.segments.map(seg => {
      let keys: SkkKey[];
      if (seg.segmentType === "okurigana") {
        keys = seg.keys!;
      } else {
        const kana = seg.segmentType === "kanji" ? (seg.reading ?? seg.display) : seg.display;
        keys = computeKanaKeys(kana, seg.segmentType === "kanji", effectiveDict);
      }
      return {
        display: seg.display,
        sentence: s.text,
        reading: seg.reading ?? "",
        okurigana: seg.okurigana ?? "",
        inputType: seg.inputType ?? "standard",
        keys,
        standardKeyCount: seg.standardKeyCount,
        hint: seg.hint ?? skkKeysToHint(keys),
      };
    })
  );
}
