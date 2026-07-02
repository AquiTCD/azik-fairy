import { describe, it, expect } from "vitest";
import { getAllowedPatterns, type AllowedPatternsOpts } from "./allowedPatterns";
import { AZIK_DICTIONARY } from "../data/azikRules";

const baseOpts: AllowedPatternsOpts = {
  stageId: "challenge-daily-1",
  stageCategory: "Challenge",
  isTraining: false,
  isFullTraining: false,
  dict: AZIK_DICTIONARY,
};

const trainingOpts: AllowedPatternsOpts = {
  stageId: "lev2a-basic-1",
  stageCategory: undefined,
  isTraining: true,
  isFullTraining: false,
  dict: AZIK_DICTIONARY,
};

describe("getAllowedPatterns - 非トレーニングモード", () => {
  it("AZIKパターンが非AZIKより先頭に並ぶ（かん: kz → kan の順）", () => {
    // かん: azik=[kz], normal=[kan]
    const seg = { kana: "かん", normal: ["kan"], azik: ["kz"] };
    const result = getAllowedPatterns(seg, baseOpts);
    const kzIdx = result.indexOf("kz");
    const kanIdx = result.indexOf("kan");
    expect(kzIdx).toBeGreaterThanOrEqual(0);
    expect(kanIdx).toBeGreaterThanOrEqual(0);
    expect(kzIdx).toBeLessThan(kanIdx);
  });

  it("AZIKと通常ローマ字で重複なし", () => {
    const seg = { kana: "かん", normal: ["kan"], azik: ["kz"] };
    const result = getAllowedPatterns(seg, baseOpts);
    expect(new Set(result).size).toBe(result.length);
  });

  it("複数AZIKパターンを持つかなも全てAZIKが先行（しゃ: xa → sya, sha の順）", () => {
    // しゃ: azik=[xa], normal=[sya, sha]
    const seg = { kana: "しゃ", normal: ["sya", "sha"], azik: ["xa"] };
    const result = getAllowedPatterns(seg, baseOpts);
    const xaIdx = result.indexOf("xa");
    const syaIdx = result.indexOf("sya");
    expect(xaIdx).toBeGreaterThanOrEqual(0);
    expect(xaIdx).toBeLessThan(syaIdx);
  });

  it("AZIKキーのみのかな（ちょ）でも全パターンを返す", () => {
    // ちょ: azik=[co], normal=[tyo, cho, cyo]
    const seg = { kana: "ちょ", normal: ["tyo", "cho", "cyo"], azik: ["co"] };
    const result = getAllowedPatterns(seg, baseOpts);
    expect(result).toContain("co");
    expect(result).toContain("tyo");
    expect(result.indexOf("co")).toBeLessThan(result.indexOf("tyo"));
  });
});

describe("getAllowedPatterns - トレーニングモード", () => {
  it("isTraining=true + stageLevel未定義 → AZIKキーのみ返す", () => {
    // "nonexistent-stage" は STAGE_MAX_LEVELS に存在しない → stageLevel=undefined → AZIK only
    const opts: AllowedPatternsOpts = {
      ...trainingOpts,
      stageId: "nonexistent-stage",
      stageCategory: undefined,
    };
    const seg = { kana: "かん", normal: ["kan"], azik: ["kz"] };
    const result = getAllowedPatterns(seg, opts);
    expect(result).toContain("kz");
    expect(result).not.toContain("kan");
  });

  it("Practiceカテゴリ + isTraining=true → AZIKキーのみ返す", () => {
    const opts: AllowedPatternsOpts = {
      stageId: "practice-words-1",
      stageCategory: "Practice",
      isTraining: true,
      isFullTraining: false,
      dict: AZIK_DICTIONARY,
    };
    const seg = { kana: "かん", normal: ["kan"], azik: ["kz"] };
    const result = getAllowedPatterns(seg, opts);
    expect(result).toContain("kz");
    expect(result).not.toContain("kan");
  });

  it("Challengeカテゴリ + isTraining=false → 非トレーニング（AZIKも非AZIKも含む）", () => {
    const opts: AllowedPatternsOpts = {
      ...baseOpts,
      stageId: "challenge-daily-1",
      stageCategory: "Challenge",
      isTraining: false,
    };
    const seg = { kana: "かん", normal: ["kan"], azik: ["kz"] };
    const result = getAllowedPatterns(seg, opts);
    expect(result).toContain("kz");
    expect(result).toContain("kan");
  });
});
