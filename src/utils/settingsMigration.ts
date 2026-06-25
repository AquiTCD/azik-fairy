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

  if (patched.soundTheme === "off") {
    patched.soundTheme = "soft";
  }
  if (patched.soundTheme === "default") {
    patched.soundTheme = "soft";
  }

  // soundEnabled was removed: migrate to soundVolume
  if ("soundEnabled" in patched) {
    if (patched.soundEnabled === true && !patched.soundVolume) {
      patched.soundVolume = 70;
    }
    delete patched.soundEnabled;
  }

  return { ...defaults, ...patched };
}
