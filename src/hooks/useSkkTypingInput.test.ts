import { describe, it, expect } from "vitest";
import { processSkkKey, type SkkKeyState } from "./useSkkTypingInput";
import type { SkkTypingWord } from "@/data/skkRules";

const makeWord = (keys: Array<{ key: string; shift?: boolean }>): SkkTypingWord => ({
  display: "テスト",
  reading: "て",
  okurigana: "す",
  inputType: "standard",
  keys,
  standardKeyCount: 4,
  hint: "T e S u",
});

const initialState = (): SkkKeyState => ({
  wordIndex: 0,
  keyIndex: 0,
  missCount: 0,
  totalKeys: 0,
});

// 書く: [{key:"k",shift:true},{key:"a"},{key:"k",shift:true},{key:"u"}]
const kakuWord = makeWord([
  { key: "k", shift: true },
  { key: "a" },
  { key: "k", shift: true },
  { key: "u" },
]);

// 憩う: [{key:"i",shift:true},{key:"k"},{key:"p",shift:true}]
const ikouWord = makeWord([
  { key: "i", shift: true },
  { key: "k" },
  { key: "p", shift: true },
]);

describe("processSkkKey", () => {
  it("T-U-01: 正しいキー（shift なし）を入力すると進む", () => {
    const state = { ...initialState(), keyIndex: 1 };
    const result = processSkkKey(state, "a", false, [kakuWord]);
    expect(result.isMiss).toBe(false);
    expect(result.nextState.keyIndex).toBe(2);
    expect(result.wordCompleted).toBe(false);
  });

  it("T-U-02: Shift が期待されているのに Shift なしで入力するとミス", () => {
    const result = processSkkKey(initialState(), "k", false, [kakuWord]);
    expect(result.isMiss).toBe(true);
    expect(result.nextState.keyIndex).toBe(0);
    expect(result.nextState.missCount).toBe(1);
  });

  it("T-U-03: Shift が期待されていないのに Shift 付きで入力するとミス", () => {
    const state = { ...initialState(), keyIndex: 1 };
    const result = processSkkKey(state, "a", true, [kakuWord]);
    expect(result.isMiss).toBe(true);
  });

  it("T-U-04: 全く違うキーを入力するとミス", () => {
    const result = processSkkKey(initialState(), "z", true, [kakuWord]);
    expect(result.isMiss).toBe(true);
  });

  it("T-U-05: 最後のキーを正しく入力すると wordCompleted=true", () => {
    const state = { ...initialState(), keyIndex: 3 };
    const result = processSkkKey(state, "u", false, [kakuWord]);
    expect(result.isMiss).toBe(false);
    expect(result.wordCompleted).toBe(true);
    expect(result.nextState.keyIndex).toBe(0);
    expect(result.nextState.wordIndex).toBe(1);
  });

  it("T-U-06: 最後の単語を完了すると allCompleted=true", () => {
    const state = { ...initialState(), keyIndex: 3 };
    const result = processSkkKey(state, "u", false, [kakuWord]);
    expect(result.allCompleted).toBe(true);
  });

  it("T-U-07: 標準SKK 4キー連続入力シミュレーション（書く）", () => {
    let state = initialState();
    const words = [kakuWord];

    let r = processSkkKey(state, "k", true, words);  // K
    expect(r.isMiss).toBe(false);
    expect(r.wordCompleted).toBe(false);
    state = r.nextState;

    r = processSkkKey(state, "a", false, words);       // a
    expect(r.isMiss).toBe(false);
    state = r.nextState;

    r = processSkkKey(state, "k", true, words);        // K (送りがなトリガー)
    expect(r.isMiss).toBe(false);
    expect(r.wordCompleted).toBe(false);
    state = r.nextState;

    r = processSkkKey(state, "u", false, words);       // u
    expect(r.isMiss).toBe(false);
    expect(r.wordCompleted).toBe(true);
    expect(r.allCompleted).toBe(true);
  });

  it("T-U-08: AZIK okuri 3キー連続入力シミュレーション（憩う）", () => {
    let state = initialState();
    const words = [ikouWord];

    let r = processSkkKey(state, "i", true, words);   // I
    expect(r.isMiss).toBe(false);
    state = r.nextState;

    r = processSkkKey(state, "k", false, words);       // k
    expect(r.isMiss).toBe(false);
    state = r.nextState;

    r = processSkkKey(state, "p", true, words);        // P
    expect(r.isMiss).toBe(false);
    expect(r.wordCompleted).toBe(true);
    expect(r.allCompleted).toBe(true);
  });

  it("T-U-09: e.key が大文字で来ても lowercase 正規化後に正解と一致する", () => {
    // ブラウザによっては e.key="K", e.shiftKey=true で来ることがある
    const result = processSkkKey(initialState(), "K", true, [kakuWord]);
    expect(result.isMiss).toBe(false);
    expect(result.nextState.keyIndex).toBe(1);
  });

  it("words が空の場合は allCompleted を返す", () => {
    const result = processSkkKey(initialState(), "k", true, []);
    expect(result.allCompleted).toBe(true);
  });
});
