import { AZIK_DICTIONARY, AzikMapping } from "./azikRules";

export type UserAzikEntryMode = "keep" | "disable" | "replace";

export interface UserAzikEntry {
  mode: UserAzikEntryMode;
  replacementKeys?: string[];
}

export interface UserAzikConfig {
  entries: Record<string, UserAzikEntry>;
}

export const EMPTY_USER_AZIK_CONFIG: UserAzikConfig = { entries: {} };

/**
 * ユーザー設定をベース辞書に適用して有効辞書を返す。
 *
 * - keep:    変更なし
 * - disable: azik を空にする（normal はそのまま）
 * - replace: azik を replacementKeys に差し替え
 * - baseDict に存在しないかなは無視する
 */
export function applyUserConfig(
  baseDict: Record<string, AzikMapping>,
  config: UserAzikConfig,
): Record<string, AzikMapping> {
  const result: Record<string, AzikMapping> = { ...baseDict };

  for (const [kana, entry] of Object.entries(config.entries)) {
    if (!baseDict[kana]) continue;

    if (entry.mode === "disable") {
      result[kana] = { ...baseDict[kana], azik: [] };
    } else if (entry.mode === "replace" && entry.replacementKeys?.length) {
      result[kana] = { ...baseDict[kana], azik: entry.replacementKeys };
    }
  }

  return result;
}

/**
 * macSKK kana-rule.conf テキストをパースして UserAzikConfig を生成する。
 *
 * - 後勝ちルール: 同じかなへの複数定義は後のものが勝つ
 * - baseDict に存在しないかなは無視（AZIK_FAIRY 範囲外）
 * - <okuri> / <shift> などの特殊行はスキップ
 * - ひらがな・ー 以外のかなへのマッピングはスキップ
 */
export function parseConfToUserConfig(
  confText: string,
  baseDict: Record<string, AzikMapping> = AZIK_DICTIONARY,
): UserAzikConfig {
  // step1: 後勝ちで Map<kana, key[]> を構築
  const effectiveMap = new Map<string, string[]>();

  for (const rawLine of confText.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // TSV（Google 日本語入力）とCSV（macSKK conf）を自動判別
    const parts = line.includes("\t") ? line.split("\t") : line.split(",");
    if (parts.length < 2) continue;

    const inputKey = parts[0].trim();
    const kana = parts[1].trim();

    if (kana.includes("<") || kana.includes(">")) continue; // <okuri>/<shift>
    if (!/^[ぁ-ゖーっ]+$/.test(kana)) continue;            // ひらがな+ーのみ
    if (inputKey.includes(" ")) continue;                   // z[スペース] 等

    if (!effectiveMap.has(kana)) effectiveMap.set(kana, []);
    effectiveMap.get(kana)!.push(inputKey);
  }

  // step2: baseDict の各エントリを effectiveMap と照合して UserAzikConfig を生成
  const entries: Record<string, UserAzikEntry> = {};

  for (const [kana, baseMapping] of Object.entries(baseDict)) {
    const confKeys = effectiveMap.get(kana);

    if (!confKeys || confKeys.length === 0) {
      entries[kana] = { mode: "disable" };
      continue;
    }

    const baseAzikSet = new Set(baseMapping.azik);
    const confKeySet = new Set(confKeys);

    const isSameAsBase =
      baseMapping.azik.every(k => confKeySet.has(k)) &&
      confKeys.every(k => baseAzikSet.has(k));

    if (isSameAsBase) {
      entries[kana] = { mode: "keep" };
    } else {
      // conf に明示的に書かれたキーを全て azik ショートカットとして採用する。
      // normal 配列に存在するキーも "ユーザーが意図したショートカット" として扱う。
      entries[kana] = { mode: "replace", replacementKeys: [...confKeys] };
    }
  }

  return { entries };
}
