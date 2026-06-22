import { describe, it, expect } from "vitest";
import { migrateSettings } from "./settingsMigration";
import { GameSettings } from "@/types/game";

const DEFAULTS: GameSettings = {
  isTraining: true,
  isFullTraining: false,
  showGuide: true,
  showTable: true,
  customRules: {},
  keyboardLayout: "JIS",
  soundEnabled: false,
  soundTheme: "soft",
  wordsPerSession: 30,
  enableSpecial: true,
  enableForeign: true,
  nAlternative: "left",
  smallKanaPrefix: "l",
  ghostRaceEnabled: true,
};

describe("migrateSettings", () => {
  describe("customRules のマイグレーション", () => {
    it("string 値を string[] に変換する", () => {
      const raw = { customRules: { あ: "a" } };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.customRules["あ"]).toEqual(["a"]);
    });

    it("すでに string[] の場合は変換しない", () => {
      const raw = { customRules: { あ: ["a", "aa"] } };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.customRules["あ"]).toEqual(["a", "aa"]);
    });

    it("customRules が空の場合は空のまま", () => {
      const raw = { customRules: {} };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.customRules).toEqual({});
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
