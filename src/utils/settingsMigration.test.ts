import { describe, it, expect } from "vitest";
import { migrateSettings } from "./settingsMigration";
import { GameSettings } from "@/types/game";

const DEFAULTS: GameSettings = {
  isTraining: true,
  isFullTraining: false,
  showGuide: true,
  showTable: true,
  keyboardLayout: "JIS",
  soundEnabled: false,
  soundTheme: "soft",
  wordsPerSession: 30,
  enableSpecial: true,
  enableForeign: true,
  ghostRaceEnabled: true,
};

describe("migrateSettings", () => {
  describe("旧フィールドの除去", () => {
    it("customRules は除去される（クラッシュしない）", () => {
      const raw = { customRules: { あ: "a" } };
      const result = migrateSettings(raw, DEFAULTS);
      expect((result as any).customRules).toBeUndefined();
    });

    it("nAlternative は除去される", () => {
      const raw = { nAlternative: "left" };
      const result = migrateSettings(raw, DEFAULTS);
      expect((result as any).nAlternative).toBeUndefined();
    });

    it("smallKanaPrefix は除去される", () => {
      const raw = { smallKanaPrefix: "l" };
      const result = migrateSettings(raw, DEFAULTS);
      expect((result as any).smallKanaPrefix).toBeUndefined();
    });
  });

  describe("soundTheme のマイグレーション", () => {
    it('soundTheme "off" → soundEnabled: false, soundTheme: "soft"', () => {
      const raw = { soundTheme: "off" };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundEnabled).toBe(false);
      expect(result.soundTheme).toBe("soft");
    });

    it('soundTheme "default" → soundEnabled: true, soundTheme: "soft"', () => {
      const raw = { soundTheme: "default" };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundEnabled).toBe(true);
      expect(result.soundTheme).toBe("soft");
    });

    it('soundTheme "8bit" はそのまま維持', () => {
      const raw = { soundTheme: "8bit", soundEnabled: true };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundTheme).toBe("8bit");
      expect(result.soundEnabled).toBe(true);
    });
  });

  describe("デフォルト値のマージ", () => {
    it("存在しないキーはデフォルト値で補完される", () => {
      const raw = { isTraining: false };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.isTraining).toBe(false);
      expect(result.showGuide).toBe(true); // デフォルト維持
      expect(result.wordsPerSession).toBe(30); // デフォルト維持
    });

    it("空オブジェクトはすべてデフォルト値になる", () => {
      const result = migrateSettings({}, DEFAULTS);
      expect(result).toEqual(DEFAULTS);
    });

    it("既存キーはデフォルトより優先される", () => {
      const raw = { wordsPerSession: 10, isTraining: false };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.wordsPerSession).toBe(10);
      expect(result.isTraining).toBe(false);
    });
  });
});
