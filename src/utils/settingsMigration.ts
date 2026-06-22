import { GameSettings } from "@/types/game";

/**
 * Migrates raw parsed settings JSON from localStorage to the current GameSettings shape.
 * Handles legacy formats safely; unknown keys are dropped via the spread with DEFAULT_SETTINGS.
 */
export function migrateSettings(raw: Record<string, unknown>, defaults: GameSettings): GameSettings {
  const patched = { ...raw };

  // customRules: 旧フィールド — 新しい GameSettings には存在しないため除去する
  // （古い localStorage データを読み込んでもクラッシュしないよう、変換せず削除）
  delete patched.customRules;

  // 旧フィールドを削除
  delete patched.nAlternative;
  delete patched.smallKanaPrefix;
  delete patched.enableForeign;
  delete patched.enableSpecial;

  // soundTheme: 旧 "off" → soundEnabled: false + theme: "soft"
  if (patched.soundTheme === "off") {
    patched.soundEnabled = false;
    patched.soundTheme = "soft";
  }
  // soundTheme: 旧 "default" → soundEnabled: true + theme: "soft"
  if (patched.soundTheme === "default") {
    patched.soundEnabled = true;
    patched.soundTheme = "soft";
  }

  return { ...defaults, ...patched };
}
