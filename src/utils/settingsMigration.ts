import { GameSettings } from "@/types/game";

/**
 * Migrates raw parsed settings JSON from localStorage to the current GameSettings shape.
 * Handles legacy formats safely; unknown keys are dropped via the spread with DEFAULT_SETTINGS.
 */
export function migrateSettings(raw: Record<string, unknown>, defaults: GameSettings): GameSettings {
  const patched = { ...raw };

  // customRules: 旧フォーマット string → string[] に変換
  if (patched.customRules && typeof patched.customRules === "object" && !Array.isArray(patched.customRules)) {
    const migrated: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(patched.customRules as Record<string, unknown>)) {
      if (typeof v === "string") migrated[k] = [v];
      else if (Array.isArray(v)) migrated[k] = v as string[];
    }
    patched.customRules = migrated;
  }

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
