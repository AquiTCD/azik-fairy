import { describe, it, expect } from "vitest";
import {
  SKK_AZIK_OKURI_TABLE,
  calcStandardKeyCount,
  buildAzikOkuriKeys,
  buildStandardSkkKeys,
  isSkkStageData,
  flattenSentences,
} from "./skkRules";
import type { SkkSentence } from "./skkRules";

describe("SKK_AZIK_OKURI_TABLE", () => {
  it("r系ルールが全て定義されている", () => {
    const rRules = ["kr", "sr", "tr", "nr", "hr", "mr", "yr", "gr", "br"];
    for (const r of rRules) {
      expect(SKK_AZIK_OKURI_TABLE[r], `ルール ${r} が未定義`).toBeDefined();
      expect(SKK_AZIK_OKURI_TABLE[r].okurigana).toBe("る");
    }
  });

  it("p系ルールが全て定義されている", () => {
    const pRules = ["kp", "sp", "tp", "rp", "bp", "gp", "mp", "np"];
    for (const r of pRules) {
      expect(SKK_AZIK_OKURI_TABLE[r], `ルール ${r} が未定義`).toBeDefined();
      expect(SKK_AZIK_OKURI_TABLE[r].okurigana).toBe("う");
    }
  });

  it("q系ルールが全て定義されている", () => {
    const qRules = ["kq", "sq", "tq", "nq", "hq", "mq", "rq", "gq", "zq", "bq", "pq"];
    for (const r of qRules) {
      expect(SKK_AZIK_OKURI_TABLE[r], `ルール ${r} が未定義`).toBeDefined();
      expect(SKK_AZIK_OKURI_TABLE[r].okurigana).toBe("い");
    }
  });

  it("srルールのreading/okuriganaが正しい", () => {
    expect(SKK_AZIK_OKURI_TABLE["sr"]).toEqual({ reading: "す", okurigana: "る" });
  });

  it("kpルールのreading/okuriganaが正しい", () => {
    expect(SKK_AZIK_OKURI_TABLE["kp"]).toEqual({ reading: "こ", okurigana: "う" });
  });

  it("gqルールのreading/okuriganaが正しい", () => {
    expect(SKK_AZIK_OKURI_TABLE["gq"]).toEqual({ reading: "が", okurigana: "い" });
  });
});

describe("calcStandardKeyCount", () => {
  it("書く(か+く): K a K u = 4打", () => {
    expect(calcStandardKeyCount("か", "く")).toBe(4);
  });

  it("走る(はし+る): h a s i R u = 6打", () => {
    expect(calcStandardKeyCount("はし", "る")).toBe(6);
  });

  it("思う(おも+う): O m o U = 4打", () => {
    expect(calcStandardKeyCount("おも", "う")).toBe(4);
  });

  it("為る(す+る): S u R u = 4打", () => {
    expect(calcStandardKeyCount("す", "る")).toBe(4);
  });

  it("成る(な+る): N a R u = 4打", () => {
    expect(calcStandardKeyCount("な", "る")).toBe(4);
  });
});

describe("buildAzikOkuriKeys", () => {
  it("為る: reading=す, okurigana=る → SR (srルール)", () => {
    const keys = buildAzikOkuriKeys("す", "る");
    expect(keys).toEqual([
      { key: "s", shift: true },
      { key: "r", shift: true },
    ]);
  });

  it("成る: reading=な, okurigana=る → NR (nrルール)", () => {
    const keys = buildAzikOkuriKeys("な", "る");
    expect(keys).toEqual([
      { key: "n", shift: true },
      { key: "r", shift: true },
    ]);
  });

  it("憩う: reading=いこ, okurigana=う → IkP (kpルール)", () => {
    const keys = buildAzikOkuriKeys("いこ", "う");
    expect(keys).toEqual([
      { key: "i", shift: true },
      { key: "k" },
      { key: "p", shift: true },
    ]);
  });

  it("思う: reading=おも, okurigana=う → OmP (mpルール)", () => {
    const keys = buildAzikOkuriKeys("おも", "う");
    expect(keys).toEqual([
      { key: "o", shift: true },
      { key: "m" },
      { key: "p", shift: true },
    ]);
  });

  it("願い: reading=ねが, okurigana=い → NeGQ (gqルール)", () => {
    const keys = buildAzikOkuriKeys("ねが", "い");
    expect(keys).toEqual([
      { key: "n", shift: true },
      { key: "e" },
      { key: "g" },
      { key: "q", shift: true },
    ]);
  });

  it("ルールにマッチしない場合は null を返す", () => {
    // 「飛ぶ」は reading=と okurigana=ぶ でルールなし
    expect(buildAzikOkuriKeys("と", "ぶ")).toBeNull();
  });
});

describe("buildStandardSkkKeys", () => {
  it("書く: reading=か, okurigana=く → K a K u", () => {
    expect(buildStandardSkkKeys("か", "く")).toEqual([
      { key: "k", shift: true },
      { key: "a" },
      { key: "k", shift: true },
      { key: "u" },
    ]);
  });

  it("走る: reading=はし, okurigana=る → H a s i R u", () => {
    expect(buildStandardSkkKeys("はし", "る")).toEqual([
      { key: "h", shift: true },
      { key: "a" },
      { key: "s" },
      { key: "i" },
      { key: "r", shift: true },
      { key: "u" },
    ]);
  });

  it("動く: reading=うご, okurigana=く → U g o K u", () => {
    expect(buildStandardSkkKeys("うご", "く")).toEqual([
      { key: "u", shift: true },
      { key: "g" },
      { key: "o" },
      { key: "k", shift: true },
      { key: "u" },
    ]);
  });
});

describe("isSkkStageData", () => {
  it("category=SKK かつ sentences[] を持つオブジェクトで true を返す", () => {
    expect(isSkkStageData({ category: "SKK", id: "x", name: "x", description: "x", sentences: [] })).toBe(true);
  });

  it("sentences がなければ false を返す（旧 words 形式も false）", () => {
    expect(isSkkStageData({ category: "SKK", id: "x", name: "x", description: "x", words: [] })).toBe(false);
  });

  it("category=Lev1 のオブジェクトで false を返す", () => {
    expect(isSkkStageData({ category: "Lev1", id: "x", name: "x", description: "x", sentences: [] })).toBe(false);
  });

  it("null で false を返す", () => {
    expect(isSkkStageData(null)).toBe(false);
  });
});

describe("flattenSentences - 漢字→ひらがな Shift 付与", () => {
  const makeSentence = (segments: SkkSentence["segments"]): SkkSentence => ({
    text: "テスト",
    segments,
  });

  it("kanji の直後の hiragana 先頭キーに Shift が付く（MesiWoKuU パターン）", () => {
    const sentence = makeSentence([
      {
        display: "飯",
        segmentType: "kanji",
        reading: "めし",
        standardKeyCount: 4,
      },
      {
        display: "を",
        segmentType: "hiragana",
        standardKeyCount: 2,
      },
    ]);
    const words = flattenSentences([sentence]);
    const woKeys = words[1].keys;
    expect(woKeys[0]).toEqual({ key: "w", shift: true });
    expect(woKeys[1]).toEqual({ key: "o" });
  });

  it("文頭の hiragana には Shift が付かない", () => {
    const sentence = makeSentence([
      {
        display: "を",
        segmentType: "hiragana",
        standardKeyCount: 2,
      },
    ]);
    const words = flattenSentences([sentence]);
    expect(words[0].keys[0]).toEqual({ key: "w" });
  });

  it("hiragana の直後の hiragana には Shift が付かない", () => {
    const sentence = makeSentence([
      { display: "が", segmentType: "hiragana", standardKeyCount: 2 },
      { display: "を", segmentType: "hiragana", standardKeyCount: 2 },
    ]);
    const words = flattenSentences([sentence]);
    expect(words[1].keys[0]).toEqual({ key: "w" });
  });

  it("okurigana の直後の hiragana には Shift が付かない", () => {
    const sentence = makeSentence([
      {
        display: "為る",
        segmentType: "okurigana",
        reading: "す",
        okurigana: "る",
        inputType: "azik-okuri",
        keys: [{ key: "s", shift: true }, { key: "r", shift: true }],
        standardKeyCount: 4,
      },
      { display: "が", segmentType: "hiragana", standardKeyCount: 2 },
    ]);
    const words = flattenSentences([sentence]);
    expect(words[1].keys[0]).toEqual({ key: "g" });
  });

  it("ヒントが W o として生成される", () => {
    const sentence = makeSentence([
      { display: "飯", segmentType: "kanji", reading: "めし", standardKeyCount: 4 },
      { display: "を", segmentType: "hiragana", standardKeyCount: 2 },
    ]);
    const words = flattenSentences([sentence]);
    expect(words[1].hint).toBe("W o");
  });
});
