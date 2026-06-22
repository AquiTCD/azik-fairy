import { AZIK_DICTIONARY, AzikMapping } from "./azikRules";

export interface KanaKeyConfig {
  normal: string[];
  azik: string[];
}

export type UserDictConfig = Record<string, KanaKeyConfig>;

export const EMPTY_USER_DICT_CONFIG: UserDictConfig = {};

/**
 * baseDict の entries を UserDictConfig で上書きして返す。
 * UserDictConfig に記載のないかなはベース辞書をそのまま使う。
 */
export function applyUserDictConfig(
  baseDict: Record<string, AzikMapping>,
  userConfig: UserDictConfig
): Record<string, AzikMapping> {
  const result = { ...baseDict };
  for (const [kana, config] of Object.entries(userConfig)) {
    if (baseDict[kana]) {
      result[kana] = { normal: config.normal, azik: config.azik };
    }
  }
  return result;
}

/**
 * kana-rule.conf（CSV）または TSV をパースして UserDictConfig を生成。
 * 「conf に書いてないかな = azik を空にする (disable)」という full-replace セマンティクス。
 * ベースと同一エントリは省略して差分のみ保存する（ストレージ節約）。
 */
export function parseTableToUserDictConfig(
  text: string,
  baseDict: Record<string, AzikMapping> = AZIK_DICTIONARY
): UserDictConfig {
  // step1: 後勝ちで Map<kana, string[]> を構築
  const effectiveMap = new Map<string, string[]>();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.includes("\t") ? line.split("\t") : line.split(",");
    if (parts.length < 2) continue;
    const inputKey = parts[0].trim();
    const kana = parts[1].trim();
    if (kana.includes("<") || kana.includes(">")) continue;
    if (!/^[ぁ-ゖーっ]+$/.test(kana)) continue;
    if (inputKey.includes(" ")) continue;
    if (!effectiveMap.has(kana)) effectiveMap.set(kana, []);
    effectiveMap.get(kana)!.push(inputKey);
  }

  const userConfig: UserDictConfig = {};
  for (const [kana, baseMapping] of Object.entries(baseDict)) {
    const confKeys = effectiveMap.get(kana);
    const baseAzikSet = new Set(baseMapping.azik);
    const baseNormalSet = new Set(baseMapping.normal);

    let azik: string[];
    if (!confKeys || confKeys.length === 0) {
      azik = []; // conf にない = azik を全部 disable
    } else {
      // base.azik にある OR base.normal にない → AZIK ショートカットとして扱う
      // base.normal にのみある → 通常ローマ字なので azik に含めない
      azik = confKeys.filter(k => baseAzikSet.has(k) || !baseNormalSet.has(k));
    }

    // ベースと同一なら保存しない（差分のみ）
    const azikSet = new Set(azik);
    const sameAzik =
      baseMapping.azik.length === azik.length &&
      baseMapping.azik.every(k => azikSet.has(k));
    if (sameAzik) continue;

    userConfig[kana] = { normal: [...baseMapping.normal], azik };
  }
  return userConfig;
}
