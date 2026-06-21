import { describe, it, expect } from "vitest";
import { calcStars, calcStreak, getNextStageId, getRank, calcOptimalProgress } from "./gameLogic";
import type { TypingWord } from "@/data/azikRules";
import { STAGES } from "../data/stages";

describe("gameLogic utilities", () => {

  describe("calcStars", () => {
    it("returns 3 when accuracy>=98 and wpm>=100", () => {
      expect(calcStars(98, 100)).toBe(3);
      expect(calcStars(100, 150)).toBe(3);
    });

    it("returns 2 when accuracy>=90 but not 3-star condition", () => {
      expect(calcStars(90, 99)).toBe(2);
      expect(calcStars(95, 50)).toBe(2);
      // accuracy>=98 but wpm<100 → 2
      expect(calcStars(99, 80)).toBe(2);
    });

    it("returns 1 for any completion below 90% accuracy", () => {
      expect(calcStars(89, 200)).toBe(1);
      expect(calcStars(0, 0)).toBe(1);
      expect(calcStars(50, 100)).toBe(1);
    });
  });

  describe("calcStreak", () => {
    it("starts streak at 1 when no previous play date", () => {
      expect(calcStreak("", "2026-06-15", 0)).toBe(1);
    });

    it("keeps streak unchanged when already played today", () => {
      expect(calcStreak("2026-06-15", "2026-06-15", 5)).toBe(5);
    });

    it("increments streak by 1 when played consecutive days", () => {
      expect(calcStreak("2026-06-14", "2026-06-15", 3)).toBe(4);
    });

    it("resets streak to 1 when gap > 1 day", () => {
      expect(calcStreak("2026-06-10", "2026-06-15", 10)).toBe(1);
      expect(calcStreak("2026-06-13", "2026-06-15", 7)).toBe(1);
    });
  });

  describe("getNextStageId", () => {
    it("returns the next stage id for a valid stage", () => {
      const first = STAGES[0].id;
      const second = STAGES[1].id;
      expect(getNextStageId(first)).toBe(second);
    });

    it("returns null for the last stage", () => {
      const last = STAGES[STAGES.length - 1].id;
      expect(getNextStageId(last)).toBeNull();
    });

    it("returns null for an unknown stage id", () => {
      expect(getNextStageId("nonexistent-stage")).toBeNull();
    });
  });

  describe("getRank", () => {
    it("returns PERFECT when accuracy=100, wpm≥250, azikRatio≥90", () => {
      expect(getRank(100, 250, 90)).toBe("PERFECT");
      expect(getRank(100, 400, 100)).toBe("PERFECT");
    });

    it("does not return PERFECT if any condition is unmet", () => {
      expect(getRank(99,  250, 90)).not.toBe("PERFECT"); // accuracy <100
      expect(getRank(100, 249, 90)).not.toBe("PERFECT"); // wpm <250
      expect(getRank(100, 250, 89)).not.toBe("PERFECT"); // azikRatio <90
    });

    it("returns A when accuracy≥93, wpm≥180, azikRatio≥75 (not PERFECT)", () => {
      expect(getRank(93,  180, 75)).toBe("A");
      expect(getRank(99,  249, 90)).toBe("A"); // near-PERFECT but wpm fails
    });

    it("returns B when accuracy≥80, wpm≥120, azikRatio≥60 (not A)", () => {
      expect(getRank(80,  120, 60)).toBe("B");
      expect(getRank(92,  180, 75)).toBe("B"); // accuracy just below A
    });

    it("returns C for everything else", () => {
      expect(getRank(79,  120, 60)).toBe("C"); // accuracy <80
      expect(getRank(80,  119, 60)).toBe("C"); // wpm <120
      expect(getRank(80,  120, 59)).toBe("C"); // azikRatio <60
      expect(getRank(0,   0,   0)).toBe("C");
    });
  });

  describe("calcOptimalProgress", () => {
    const seg = (normal: string[], azik: string[]) => ({ kana: "x", normal, azik });
    const word = (segs: ReturnType<typeof seg>[]): TypingWord =>
      ({ kanji: "", kana: "", segments: segs });

    it("returns zeros for empty completed word list", () => {
      expect(calcOptimalProgress([], 0, 0)).toEqual({ optimalNormal: 0, optimalAzik: 0 });
    });

    it("sums optimal keys for all fully-completed words", () => {
      // word0: normal=2("ab"), azik=1("c") | word1: normal=3("abc"), azik=2("de")
      const words = [word([seg(["ab"], ["c"])]), word([seg(["abc"], ["de"])])];
      const result = calcOptimalProgress(words, 2, 0);
      expect(result.optimalNormal).toBe(5);
      expect(result.optimalAzik).toBe(3);
    });

    it("includes only completed segments of current word up to segmentIndex", () => {
      // word0: seg0 normal=2/azik=1, seg1 normal=3/azik=2
      const words = [word([seg(["ab"], ["c"]), seg(["abc"], ["de"])])];
      const result = calcOptimalProgress(words, 0, 1); // seg0 done, seg1 not yet
      expect(result.optimalNormal).toBe(2);
      expect(result.optimalAzik).toBe(1);
    });

    it("picks shortest pattern when multiple alternatives exist", () => {
      // normal has "ab"(2) and "abc"(3) → min=2; azik has "c"(1) and "de"(2) → min=1
      const words = [word([seg(["ab", "abc"], ["c", "de"])])];
      const result = calcOptimalProgress(words, 1, 0);
      expect(result.optimalNormal).toBe(2);
      expect(result.optimalAzik).toBe(1);
    });
  });
});
