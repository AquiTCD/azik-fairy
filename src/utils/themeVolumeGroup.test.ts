import { describe, it, expect } from "vitest";
import { applyThemeChange, themeGroup } from "./themeVolumeGroup";

describe("themeGroup", () => {
  it('"default" は "default" グループ', () => {
    expect(themeGroup("default")).toBe("default");
  });
  it('"simple" は "simple" グループ', () => {
    expect(themeGroup("simple")).toBe("simple");
  });
});

describe("applyThemeChange", () => {
  it("default -> simple: soundVolume と simpleSoundVolume がスワップされる", () => {
    const result = applyThemeChange(
      { theme: "default", soundVolume: 70, simpleSoundVolume: 0 },
      "simple"
    );
    expect(result).toEqual({ theme: "simple", soundVolume: 0, simpleSoundVolume: 70 });
  });

  it("simple -> default: soundVolume と simpleSoundVolume がスワップされ、元の default 音量に復元される", () => {
    const result = applyThemeChange(
      { theme: "simple", soundVolume: 0, simpleSoundVolume: 70 },
      "default"
    );
    expect(result).toEqual({ theme: "default", soundVolume: 70, simpleSoundVolume: 0 });
  });

  it("default -> default: 何も変化しない", () => {
    const result = applyThemeChange(
      { theme: "default", soundVolume: 70, simpleSoundVolume: 0 },
      "default"
    );
    expect(result).toEqual({ theme: "default", soundVolume: 70, simpleSoundVolume: 0 });
  });

  it("simple内で音量を変更した後にdefaultへ戻ると、変更後のsimple音量がsimpleSoundVolumeに退避される", () => {
    // ユーザーがsimpleモード中にミュート解除して50に変更した状態を模す
    const afterVolumeChange = { theme: "simple" as const, soundVolume: 50, simpleSoundVolume: 70 };
    const result = applyThemeChange(afterVolumeChange, "default");
    expect(result).toEqual({ theme: "default", soundVolume: 70, simpleSoundVolume: 50 });
  });
});
