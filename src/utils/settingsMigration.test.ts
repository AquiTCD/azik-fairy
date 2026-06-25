import { describe, it, expect } from "vitest";
import { migrateSettings } from "./settingsMigration";
import { GameSettings } from "@/types/game";

const DEFAULTS: GameSettings = {
  isTraining: true,
  isFullTraining: false,
  showGuide: true,
  showTable: true,
  keyboardLayout: "JIS",
  soundTheme: "soft",
  soundVolume: 0,
  wordsPerSession: 30,
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

    it("enableForeign は除去される", () => {
      const raw = { enableForeign: true };
      const result = migrateSettings(raw, DEFAULTS);
      expect((result as any).enableForeign).toBeUndefined();
    });

    it("enableSpecial は除去される", () => {
      const raw = { enableSpecial: false };
      const result = migrateSettings(raw, DEFAULTS);
      expect((result as any).enableSpecial).toBeUndefined();
    });
  });

  describe("soundTheme のマイグレーション", () => {
    it('soundTheme "off" → soundTheme: "soft"（soundVolume はデフォルト値）', () => {
      const raw = { soundTheme: "off" };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundTheme).toBe("soft");
      expect((result as any).soundEnabled).toBeUndefined();
    });

    it('soundTheme "default" → soundTheme: "soft"（soundVolume はデフォルト値）', () => {
      const raw = { soundTheme: "default" };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundTheme).toBe("soft");
      expect((result as any).soundEnabled).toBeUndefined();
    });

    it('soundTheme "8bit" はそのまま維持', () => {
      const raw = { soundTheme: "8bit" };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundTheme).toBe("8bit");
    });
  });

  describe("旧 soundEnabled のマイグレーション", () => {
    it("soundEnabled: true かつ soundVolume なし → soundVolume: 70 に昇格", () => {
      const raw = { soundEnabled: true };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundVolume).toBe(70);
      expect((result as any).soundEnabled).toBeUndefined();
    });

    it("soundEnabled: false かつ soundVolume なし → soundVolume はデフォルト (0) のまま", () => {
      const raw = { soundEnabled: false };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundVolume).toBe(0);
      expect((result as any).soundEnabled).toBeUndefined();
    });

    it("soundEnabled: true かつ soundVolume 指定あり → soundVolume は既存値を優先", () => {
      const raw = { soundEnabled: true, soundVolume: 50 };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.soundVolume).toBe(50);
      expect((result as any).soundEnabled).toBeUndefined();
    });

    it("soundEnabled なし → soundEnabled フィールドは存在しない", () => {
      const raw = { soundTheme: "8bit" };
      const result = migrateSettings(raw, DEFAULTS);
      expect((result as any).soundEnabled).toBeUndefined();
    });
  });

  describe("デフォルト値のマージ", () => {
    it("存在しないキーはデフォルト値で補完される", () => {
      const raw = { isTraining: false };
      const result = migrateSettings(raw, DEFAULTS);
      expect(result.isTraining).toBe(false);
      expect(result.showGuide).toBe(true);
      expect(result.wordsPerSession).toBe(30);
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
