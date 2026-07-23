import { describe, it, expect } from "vitest";
import { applyThemeChange, themeGroup } from "./themeVolumeGroup";

describe("themeGroup", () => {
  it('"default" は "default" グループ', () => {
    expect(themeGroup("default")).toBe("default");
  });
  it('"office-light" は "office" グループ', () => {
    expect(themeGroup("office-light")).toBe("office");
  });
  it('"office-dark" は "office" グループ', () => {
    expect(themeGroup("office-dark")).toBe("office");
  });
});

describe("applyThemeChange", () => {
  it("default -> office-light: soundVolume と officeSoundVolume がスワップされる", () => {
    const result = applyThemeChange(
      { theme: "default", soundVolume: 70, officeSoundVolume: 0 },
      "office-light"
    );
    expect(result).toEqual({ theme: "office-light", soundVolume: 0, officeSoundVolume: 70 });
  });

  it("office-dark -> default: soundVolume と officeSoundVolume がスワップされ、元の default 音量に復元される", () => {
    const result = applyThemeChange(
      { theme: "office-dark", soundVolume: 0, officeSoundVolume: 70 },
      "default"
    );
    expect(result).toEqual({ theme: "default", soundVolume: 70, officeSoundVolume: 0 });
  });

  it("office-light -> office-dark: 同一グループ内なので音量はスワップされない", () => {
    const result = applyThemeChange(
      { theme: "office-light", soundVolume: 25, officeSoundVolume: 70 },
      "office-dark"
    );
    expect(result).toEqual({ theme: "office-dark", soundVolume: 25, officeSoundVolume: 70 });
  });

  it("default -> default: 何も変化しない", () => {
    const result = applyThemeChange(
      { theme: "default", soundVolume: 70, officeSoundVolume: 0 },
      "default"
    );
    expect(result).toEqual({ theme: "default", soundVolume: 70, officeSoundVolume: 0 });
  });

  it("office内で音量を変更した後にdefaultへ戻ると、変更後のoffice音量がofficeSoundVolumeに退避される", () => {
    // ユーザーがofficeモード中にミュート解除して50に変更した状態を模す
    const afterVolumeChange = { theme: "office-light" as const, soundVolume: 50, officeSoundVolume: 70 };
    const result = applyThemeChange(afterVolumeChange, "default");
    expect(result).toEqual({ theme: "default", soundVolume: 70, officeSoundVolume: 50 });
  });
});
