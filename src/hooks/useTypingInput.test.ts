import { describe, it, expect } from "vitest";
import { processTypingKey, TypingKeyState } from "./useTypingInput";

const BASE: TypingKeyState = {
  wordIndex: 0,
  segmentIndex: 0,
  inputBuffer: "",
  totalCorrectKeys: 0,
  totalMissKeys: 0,
};

// 1語1セグメント: "a" で完了するシンプルなケース
const ONE_SEG_ONE_WORD = { totalSegmentsInWord: 1, totalWords: 1 };
// 2セグメント構成の語
const TWO_SEG_ONE_WORD = { totalSegmentsInWord: 2, totalWords: 1 };
// 2語構成
const ONE_SEG_TWO_WORDS = { totalSegmentsInWord: 1, totalWords: 2 };

describe("processTypingKey", () => {
  describe("バッファ前進 (valid prefix, not completed)", () => {
    it("2文字パターンの1文字目: buffer を進める, correctKeys++", () => {
      const result = processTypingKey(BASE, "c", ["cq", "ca"], 1, 1);
      expect(result.state.inputBuffer).toBe("c");
      expect(result.state.totalCorrectKeys).toBe(1);
      expect(result.state.totalMissKeys).toBe(0);
      expect(result.segmentCompleted).toBe(false);
      expect(result.isMiss).toBe(false);
    });

    it("続く文字でさらにバッファが伸びる", () => {
      const state: TypingKeyState = { ...BASE, inputBuffer: "c" };
      const result = processTypingKey(state, "h", ["cha", "chi"], 1, 1);
      expect(result.state.inputBuffer).toBe("ch");
      expect(result.state.totalCorrectKeys).toBe(1);
    });
  });

  describe("セグメント完了 (complete match)", () => {
    it("1文字パターンで即完了 → segmentCompleted=true, buffer リセット", () => {
      const result = processTypingKey(BASE, "a", ["a"], ...Object.values(TWO_SEG_ONE_WORD));
      expect(result.segmentCompleted).toBe(true);
      expect(result.wordCompleted).toBe(false);
      expect(result.state.inputBuffer).toBe("");
      expect(result.state.segmentIndex).toBe(1);
      expect(result.state.totalCorrectKeys).toBe(1);
    });

    it("2文字パターン完了 → segmentCompleted=true", () => {
      const state: TypingKeyState = { ...BASE, inputBuffer: "c" };
      const result = processTypingKey(state, "q", ["cq"], ...Object.values(TWO_SEG_ONE_WORD));
      expect(result.segmentCompleted).toBe(true);
      expect(result.state.inputBuffer).toBe("");
      expect(result.state.segmentIndex).toBe(1);
    });
  });

  describe("単語完了 (last segment)", () => {
    it("最後のセグメント完了 → wordCompleted=true, wordIndex++", () => {
      const result = processTypingKey(BASE, "a", ["a"], ...Object.values(ONE_SEG_TWO_WORDS));
      expect(result.wordCompleted).toBe(true);
      expect(result.allCompleted).toBe(false);
      expect(result.state.wordIndex).toBe(1);
      expect(result.state.segmentIndex).toBe(0);
    });
  });

  describe("全完了 (last word, last segment)", () => {
    it("最後の語の最後のセグメント完了 → allCompleted=true", () => {
      const result = processTypingKey(BASE, "a", ["a"], ...Object.values(ONE_SEG_ONE_WORD));
      expect(result.allCompleted).toBe(true);
      expect(result.wordCompleted).toBe(true);
    });
  });

  describe("ミス (invalid prefix)", () => {
    it("無効なキー → isMiss=true, missKeys++, 状態変化なし", () => {
      const result = processTypingKey(BASE, "z", ["a", "ka"], 1, 1);
      expect(result.isMiss).toBe(true);
      expect(result.state.totalMissKeys).toBe(1);
      expect(result.state.inputBuffer).toBe("");
      expect(result.state.wordIndex).toBe(0);
      expect(result.state.segmentIndex).toBe(0);
    });

    it("バッファあり状態での無効キー → ミス, buffer は変化しない", () => {
      const state: TypingKeyState = { ...BASE, inputBuffer: "c" };
      const result = processTypingKey(state, "z", ["cq", "ca"], 1, 1);
      expect(result.isMiss).toBe(true);
      expect(result.state.inputBuffer).toBe("c");
    });
  });

  describe("expectedKey の算出", () => {
    it("バッファが空の場合、allowedPatterns の先頭文字", () => {
      const result = processTypingKey(BASE, "z", ["ka", "ki"], 1, 1);
      expect(result.expectedKey).toBe("k");
    });

    it("バッファがある場合、次のキャラクター", () => {
      const state: TypingKeyState = { ...BASE, inputBuffer: "c" };
      const result = processTypingKey(state, "z", ["cq", "ca"], 1, 1);
      expect(result.expectedKey).toBe("q");
    });

    it("パターンが空の場合は undefined", () => {
      const result = processTypingKey(BASE, "z", [], 1, 1);
      expect(result.expectedKey).toBeUndefined();
    });
  });

  describe("エッジケース", () => {
    it("複数パターンのうち一つにマッチすれば有効", () => {
      const result = processTypingKey(BASE, "a", ["a", "ka"], 1, 1);
      expect(result.allCompleted).toBe(true);
      expect(result.isMiss).toBe(false);
    });

    it("completedKeys は wordIndex/segmentIndex と独立して累積する", () => {
      const state: TypingKeyState = { ...BASE, totalCorrectKeys: 5 };
      const result = processTypingKey(state, "a", ["a"], ...Object.values(TWO_SEG_ONE_WORD));
      expect(result.state.totalCorrectKeys).toBe(6);
    });
  });
});
