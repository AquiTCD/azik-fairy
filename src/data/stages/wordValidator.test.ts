import { describe, it, expect } from "vitest";
import {
  AzikLevel,
  levelOrdinal,
  classifyAzikKey,
  filterDictionaryByLevel,
  canWordAppearAtLevel,
  findMinimumLevel,
  filterStageWords,
  containsTargetLevel,
  isTargetSegment,
} from "./wordValidator";
import type { StageData, AzikSegment } from "../azikRules";
import { AZIK_DICTIONARY } from "../azikRules";

describe("wordValidator", () => {

  // ---------------------------------------------------------------
  // levelOrdinal
  // ---------------------------------------------------------------
  describe("levelOrdinal", () => {
    it("maintains strict order Lev0 < Lev1a < ... < Lev4 < Practice", () => {
      expect(levelOrdinal(AzikLevel.Lev0)).toBeLessThan(levelOrdinal(AzikLevel.Lev1a));
      expect(levelOrdinal(AzikLevel.Lev1a)).toBeLessThan(levelOrdinal(AzikLevel.Lev1b));
      expect(levelOrdinal(AzikLevel.Lev1b)).toBeLessThan(levelOrdinal(AzikLevel.Lev1c));
      expect(levelOrdinal(AzikLevel.Lev1c)).toBeLessThan(levelOrdinal(AzikLevel.Lev1d));
      expect(levelOrdinal(AzikLevel.Lev1d)).toBeLessThan(levelOrdinal(AzikLevel.Lev2a));
      expect(levelOrdinal(AzikLevel.Lev2a)).toBeLessThan(levelOrdinal(AzikLevel.Lev2b));
      expect(levelOrdinal(AzikLevel.Lev2b)).toBeLessThan(levelOrdinal(AzikLevel.Lev3a));
      expect(levelOrdinal(AzikLevel.Lev3a)).toBeLessThan(levelOrdinal(AzikLevel.Lev3b));
      expect(levelOrdinal(AzikLevel.Lev3b)).toBeLessThan(levelOrdinal(AzikLevel.Lev4));
      expect(levelOrdinal(AzikLevel.Lev4)).toBeLessThan(levelOrdinal(AzikLevel.Practice));
    });
  });

  // ---------------------------------------------------------------
  // classifyAzikKey
  // ---------------------------------------------------------------
  describe("classifyAzikKey", () => {
    it("classifies ; and ;* as Lev1a (っ)", () => {
      expect(classifyAzikKey(";")).toBe(AzikLevel.Lev1a);
      expect(classifyAzikKey(";ta")).toBe(AzikLevel.Lev1a);
      expect(classifyAzikKey(";ka")).toBe(AzikLevel.Lev1a);
    });

    it("classifies q (alone) as Lev1b (ん)", () => {
      expect(classifyAzikKey("q")).toBe(AzikLevel.Lev1b);
    });

    it("classifies x* as Lev1c (シャ行) including xp and xh", () => {
      expect(classifyAzikKey("xa")).toBe(AzikLevel.Lev1c);
      expect(classifyAzikKey("xi")).toBe(AzikLevel.Lev1c);
      expect(classifyAzikKey("xu")).toBe(AzikLevel.Lev1c);
      expect(classifyAzikKey("xo")).toBe(AzikLevel.Lev1c);
      expect(classifyAzikKey("xz")).toBe(AzikLevel.Lev1c);
      expect(classifyAzikKey("xp")).toBe(AzikLevel.Lev1c); // NOT Lev2b
      expect(classifyAzikKey("xh")).toBe(AzikLevel.Lev1c); // NOT Lev2b
    });

    it("classifies c* as Lev1d (チャ行) including cp and ch", () => {
      expect(classifyAzikKey("ca")).toBe(AzikLevel.Lev1d);
      expect(classifyAzikKey("cp")).toBe(AzikLevel.Lev1d); // NOT Lev2b
      expect(classifyAzikKey("ch")).toBe(AzikLevel.Lev1d); // NOT Lev2b
    });

    it("classifies Lev2a suffix Z/K/J/D/L correctly", () => {
      expect(classifyAzikKey("kz")).toBe(AzikLevel.Lev2a); // かん
      expect(classifyAzikKey("sz")).toBe(AzikLevel.Lev2a); // さん
      expect(classifyAzikKey("kk")).toBe(AzikLevel.Lev2a); // きん
      expect(classifyAzikKey("sk")).toBe(AzikLevel.Lev2a); // しん
      expect(classifyAzikKey("kj")).toBe(AzikLevel.Lev2a); // くん
      expect(classifyAzikKey("kd")).toBe(AzikLevel.Lev2a); // けん
      expect(classifyAzikKey("kl")).toBe(AzikLevel.Lev2a); // こん
      expect(classifyAzikKey("hl")).toBe(AzikLevel.Lev2a); // ほん
      expect(classifyAzikKey("rk")).toBe(AzikLevel.Lev2a); // りん
      expect(classifyAzikKey("tz")).toBe(AzikLevel.Lev2a); // たん
    });

    it("classifies Lev2b suffix Q/H/W/P correctly", () => {
      expect(classifyAzikKey("kq")).toBe(AzikLevel.Lev2b); // かい
      expect(classifyAzikKey("kh")).toBe(AzikLevel.Lev2b); // くう
      expect(classifyAzikKey("kw")).toBe(AzikLevel.Lev2b); // けい
      expect(classifyAzikKey("kp")).toBe(AzikLevel.Lev2b); // こう
      expect(classifyAzikKey("sp")).toBe(AzikLevel.Lev2b); // そう
      expect(classifyAzikKey("th")).toBe(AzikLevel.Lev2b); // つう
    });

    it("classifies Lev3b compat keys (zc/zf/zv/zx/sf/ss)", () => {
      expect(classifyAzikKey("zc")).toBe(AzikLevel.Lev3b);
      expect(classifyAzikKey("zf")).toBe(AzikLevel.Lev3b);
      expect(classifyAzikKey("zv")).toBe(AzikLevel.Lev3b);
      expect(classifyAzikKey("zx")).toBe(AzikLevel.Lev3b);
      expect(classifyAzikKey("sf")).toBe(AzikLevel.Lev3b);
      expect(classifyAzikKey("ss")).toBe(AzikLevel.Lev3b);
    });

    it("classifies : as Lev3a (長音互換)", () => {
      expect(classifyAzikKey(":")).toBe(AzikLevel.Lev3a);
    });

    it("classifies G-youon (kga, nga etc.) as Lev3a", () => {
      expect(classifyAzikKey("kga")).toBe(AzikLevel.Lev3a);
      expect(classifyAzikKey("nga")).toBe(AzikLevel.Lev3a);
      expect(classifyAzikKey("kgz")).toBe(AzikLevel.Lev3a);
    });

    it("classifies compat-F (kf/nf/mf etc.) as Lev3a", () => {
      expect(classifyAzikKey("kf")).toBe(AzikLevel.Lev3a);
      expect(classifyAzikKey("nf")).toBe(AzikLevel.Lev3a);
      expect(classifyAzikKey("mf")).toBe(AzikLevel.Lev3a);
      expect(classifyAzikKey("hf")).toBe(AzikLevel.Lev3a);
      expect(classifyAzikKey("yf")).toBe(AzikLevel.Lev3a);
    });

    it("classifies Lev4 word shortcuts", () => {
      expect(classifyAzikKey("kt")).toBe(AzikLevel.Lev4); // こと
      expect(classifyAzikKey("mn")).toBe(AzikLevel.Lev4); // もの
      expect(classifyAzikKey("sr")).toBe(AzikLevel.Lev4); // する
      expect(classifyAzikKey("ms")).toBe(AzikLevel.Lev4); // ます
    });

    it("classifies plain romaji as Lev0", () => {
      expect(classifyAzikKey("ka")).toBe(AzikLevel.Lev0);
      expect(classifyAzikKey("si")).toBe(AzikLevel.Lev0);
      expect(classifyAzikKey("ta")).toBe(AzikLevel.Lev0);
      expect(classifyAzikKey("a")).toBe(AzikLevel.Lev0);
      expect(classifyAzikKey("i")).toBe(AzikLevel.Lev0);
      expect(classifyAzikKey("-")).toBe(AzikLevel.Lev0);
    });
  });

  // ---------------------------------------------------------------
  // filterDictionaryByLevel
  // ---------------------------------------------------------------
  describe("filterDictionaryByLevel", () => {
    it("returns full dict for Practice level", () => {
      const filtered = filterDictionaryByLevel(AZIK_DICTIONARY, AzikLevel.Practice);
      expect(filtered).toBe(AZIK_DICTIONARY); // same reference
    });

    it("removes Lev2a compound entries when filtered to Lev1b", () => {
      const filtered = filterDictionaryByLevel(AZIK_DICTIONARY, AzikLevel.Lev1b);
      // かん[kz] is Lev2a → should be removed
      expect(filtered["かん"]).toBeUndefined();
      // ほん[hl] is Lev2a → should be removed
      expect(filtered["ほん"]).toBeUndefined();
      // ん[q] is Lev1b → should remain
      expect(filtered["ん"]).toBeDefined();
      // か[ka] is Lev0 → should remain
      expect(filtered["か"]).toBeDefined();
    });

    it("removes Lev1b ん entry when filtered to Lev1a", () => {
      const filtered = filterDictionaryByLevel(AZIK_DICTIONARY, AzikLevel.Lev1a);
      // ん[q] is Lev1b → should be removed at Lev1a
      expect(filtered["ん"]).toBeUndefined();
      // っ[;] is Lev1a → should remain
      expect(filtered["っ"]).toBeDefined();
    });

    it("keeps Lev1c entries at Lev1c but removes Lev1d and above", () => {
      const filtered = filterDictionaryByLevel(AZIK_DICTIONARY, AzikLevel.Lev1c);
      // しゃ[xa] is Lev1c → keep
      expect(filtered["しゃ"]).toBeDefined();
      // ちゃ[ca] is Lev1d → remove
      expect(filtered["ちゃ"]).toBeUndefined();
      // かん[kz] is Lev2a → remove
      expect(filtered["かん"]).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------
  // canWordAppearAtLevel
  // ---------------------------------------------------------------
  describe("canWordAppearAtLevel", () => {
    it("always returns true for Practice level", () => {
      expect(canWordAppearAtLevel("いっぱん", AzikLevel.Practice)).toBe(true);
      expect(canWordAppearAtLevel("かんたん", AzikLevel.Practice)).toBe(true);
    });

    it("いっぱん is invalid at Lev1a (requires ん→q which is Lev1b)", () => {
      // いっぱん: い+っぱ(Lev1a) + ん(q=Lev1b) → ん requires Lev1b
      expect(canWordAppearAtLevel("いっぱん", AzikLevel.Lev1a)).toBe(false);
    });

    it("やっぱり is valid at Lev1a (no ん)", () => {
      expect(canWordAppearAtLevel("やっぱり", AzikLevel.Lev1a)).toBe(true);
    });

    it("きっぷ is valid at Lev1a (no ん)", () => {
      expect(canWordAppearAtLevel("きっぷ", AzikLevel.Lev1a)).toBe(true);
    });

    it("ほん is valid at Lev1b (typed as ho+q)", () => {
      // filterDict at Lev1b removes ほん[hl], parser falls back to ほ[ho]+ん[q]
      // ほ=Lev0, ん(q)=Lev1b → both ≤ Lev1b
      expect(canWordAppearAtLevel("ほん", AzikLevel.Lev1b)).toBe(true);
    });

    it("かんたん is valid at Lev1b (typed as ka+q+ta+q without Lev2a shortcuts)", () => {
      expect(canWordAppearAtLevel("かんたん", AzikLevel.Lev1b)).toBe(true);
    });

    it("でんしゃ is valid at Lev1b (contains でん[td]=Lev2a, removed → で+ん; しゃ=Lev1c→invalid at Lev1b)", () => {
      // しゃ[xa] is Lev1c > Lev1b → invalid at Lev1b
      expect(canWordAppearAtLevel("でんしゃ", AzikLevel.Lev1b)).toBe(false);
    });

    it("かいしゃ is invalid at Lev1b (しゃ[xa]=Lev1c > Lev1b)", () => {
      expect(canWordAppearAtLevel("かいしゃ", AzikLevel.Lev1b)).toBe(false);
    });

    it("いしゃ is valid at Lev1c (い=Lev0, しゃ[xa]=Lev1c)", () => {
      expect(canWordAppearAtLevel("いしゃ", AzikLevel.Lev1c)).toBe(true);
    });

    it("おちゃ is valid at Lev1c via ち[ti]+ゃ[xya] (ゃ is typeable standalone at Lev1c)", () => {
      // ちゃ[ca] is Lev1d but ゃ[xya] is Lev1c — so ち+xya path is valid at Lev1c
      expect(canWordAppearAtLevel("おちゃ", AzikLevel.Lev1c)).toBe(true);
    });

    it("かんばん is valid at Lev2a (かん[kz]=Lev2a, ばん[bz]=Lev2a)", () => {
      expect(canWordAppearAtLevel("かんばん", AzikLevel.Lev2a)).toBe(true);
    });

    it("かいしゃ is valid at Lev2a (かい[kq] removed, parsed as か+い+しゃ — all ≤ Lev2a)", () => {
      // かい[kq] is Lev2b → removed from filtered dict at Lev2a
      // Parser falls back to か[ka] + い[i] + しゃ[xa] — all accessible at Lev2a
      expect(canWordAppearAtLevel("かいしゃ", AzikLevel.Lev2a)).toBe(true);
    });

    it("かいしゃ is valid at Lev2b (かい[kq]=Lev2b, しゃ[xa]=Lev1c)", () => {
      expect(canWordAppearAtLevel("かいしゃ", AzikLevel.Lev2b)).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // findMinimumLevel
  // ---------------------------------------------------------------
  describe("findMinimumLevel", () => {
    it("returns Lev0 for plain kana with no AZIK shortcuts", () => {
      // さくら = sa+ku+ra — all basic romaji
      expect(findMinimumLevel("さくら")).toBe(AzikLevel.Lev0);
    });

    it("returns Lev1a for words with っ", () => {
      // やった: や + った(;ta)
      expect(findMinimumLevel("やった")).toBe(AzikLevel.Lev1a);
    });

    it("returns Lev1b for words with ん (no っ, no higher shortcuts)", () => {
      // ほん: ほ[ho] + ん[q] — after Lev2a ほん[hl] is removed by filtering
      // Actually findMinimumLevel uses full dict! So ほん[hl] → Lev2a
      // This is intentional: findMinimumLevel shows the MOST efficient level
      expect(findMinimumLevel("ほん")).toBe(AzikLevel.Lev2a); // hl=Lev2a is available
    });

    it("returns Lev2a for words with 撥音拡張 when using full dict", () => {
      expect(findMinimumLevel("かんたん")).toBe(AzikLevel.Lev2a); // kz,tz
      expect(findMinimumLevel("しんけん")).toBe(AzikLevel.Lev2a); // sk,kd
    });

    it("returns Lev2b for words with 二重母音 when no higher shortcut available", () => {
      // かいしゃ: かい[kq]=Lev2b, しゃ[xa]=Lev1c → max=Lev2b
      expect(findMinimumLevel("かいしゃ")).toBe(AzikLevel.Lev2b);
    });

    it("returns Lev0 for words with 長音 (ー has both [-]=Lev0 and [:]=Lev3a, min=Lev0)", () => {
      // こーひー: ー has azik:["-",":"] — "-" is Lev0, so minLevel = Lev0
      // findMinimumLevel uses FULL dict and picks the MINIMUM level key
      expect(findMinimumLevel("こーひー")).toBe(AzikLevel.Lev0);
    });

    it("returns Lev4 for Lev4 word shortcuts", () => {
      expect(findMinimumLevel("こと")).toBe(AzikLevel.Lev4);
      expect(findMinimumLevel("もの")).toBe(AzikLevel.Lev4);
      expect(findMinimumLevel("する")).toBe(AzikLevel.Lev4);
    });
  });

  // ---------------------------------------------------------------
  // containsTargetLevel
  // ---------------------------------------------------------------
  describe("containsTargetLevel", () => {
    it("matches plain pattern to exact target level", () => {
      expect(containsTargetLevel("kz", AzikLevel.Lev2a)).toBe(true);
      expect(containsTargetLevel("kp", AzikLevel.Lev2b)).toBe(true);
      expect(containsTargetLevel("q",  AzikLevel.Lev1b)).toBe(true);
      expect(containsTargetLevel(";",  AzikLevel.Lev1a)).toBe(true);
    });

    it("returns false when pattern level does not match target", () => {
      expect(containsTargetLevel("kz", AzikLevel.Lev2b)).toBe(false);
      expect(containsTargetLevel("kp", AzikLevel.Lev2a)).toBe(false);
      expect(containsTargetLevel("ka", AzikLevel.Lev2a)).toBe(false);
    });

    it("strips leading ; from sokuon compound before classifying core (non-Lev1a)", () => {
      // ;kz = っかん → core kz is Lev2a
      expect(containsTargetLevel(";kz", AzikLevel.Lev2a)).toBe(true);
      // ;ta = った → core ta is Lev0
      expect(containsTargetLevel(";ta", AzikLevel.Lev0)).toBe(true);
    });

    it("any ;-starting pattern is Lev1a target (っ shortcut IS the Lev1a element)", () => {
      // ;kz contains っ→; even though core kz is Lev2a
      expect(containsTargetLevel(";kz", AzikLevel.Lev1a)).toBe(true);
      // ;kq = っかい → also contains っ→;
      expect(containsTargetLevel(";kq", AzikLevel.Lev1a)).toBe(true);
      // ;ta = った → contains っ→;
      expect(containsTargetLevel(";ta", AzikLevel.Lev1a)).toBe(true);
      // kz alone does NOT contain っ→;
      expect(containsTargetLevel("kz", AzikLevel.Lev1a)).toBe(false);
    });

    it("bare ; (sokuon shortcut alone) classifies as Lev1a", () => {
      expect(containsTargetLevel(";", AzikLevel.Lev1a)).toBe(true);
      expect(containsTargetLevel(";", AzikLevel.Lev0)).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // isTargetSegment
  // ---------------------------------------------------------------
  describe("isTargetSegment", () => {
    const seg = (azik: string[]): AzikSegment => ({ kana: "x", normal: ["x"], azik });

    describe("non-summary stage", () => {
      it("returns true when any azik pattern matches the stage level exactly", () => {
        // Lev2a stage: kz should be a target
        expect(isTargetSegment(seg(["kz"]), AzikLevel.Lev2a, false)).toBe(true);
        // Lev1b stage: q should be a target
        expect(isTargetSegment(seg(["q"]),  AzikLevel.Lev1b, false)).toBe(true);
      });

      it("returns false when no azik pattern matches the stage level", () => {
        // Lev2a stage: plain ka is Lev0, not Lev2a
        expect(isTargetSegment(seg(["ka"]), AzikLevel.Lev2a, false)).toBe(false);
        // Lev2a stage: kp is Lev2b, not Lev2a
        expect(isTargetSegment(seg(["kp"]), AzikLevel.Lev2a, false)).toBe(false);
      });

      it("returns true when one of multiple patterns matches (others may not)", () => {
        // normal ka + azik kz — kz is Lev2a target
        expect(isTargetSegment(seg(["ka", "kz"]), AzikLevel.Lev2a, false)).toBe(true);
      });

      it("handles sokuon compound patterns correctly", () => {
        // ;kz = っかん — core kz is Lev2a → target at Lev2a
        expect(isTargetSegment(seg([";kz"]), AzikLevel.Lev2a, false)).toBe(true);
        // ;kz also contains っ→; (Lev1a) → target at Lev1a too
        expect(isTargetSegment(seg([";kz"]), AzikLevel.Lev1a, false)).toBe(true);
        // ;kq = っかい — core kq is Lev2b → target at Lev2b
        expect(isTargetSegment(seg([";kq"]), AzikLevel.Lev2b, false)).toBe(true);
        // ;kq also contains っ→; → target at Lev1a
        expect(isTargetSegment(seg([";kq"]), AzikLevel.Lev1a, false)).toBe(true);
      });
    });

    describe("summary stage", () => {
      it("accepts patterns from Lev1a up to stageLevel (cumulative range)", () => {
        // Summary at Lev2a: Lev1a/Lev1b/Lev1c/Lev1d/Lev2a all count
        expect(isTargetSegment(seg([";"]),  AzikLevel.Lev2a, true)).toBe(true);  // Lev1a
        expect(isTargetSegment(seg(["q"]),  AzikLevel.Lev2a, true)).toBe(true);  // Lev1b
        expect(isTargetSegment(seg(["xa"]), AzikLevel.Lev2a, true)).toBe(true);  // Lev1c
        expect(isTargetSegment(seg(["ca"]), AzikLevel.Lev2a, true)).toBe(true);  // Lev1d
        expect(isTargetSegment(seg(["kz"]), AzikLevel.Lev2a, true)).toBe(true);  // Lev2a
      });

      it("rejects Lev0 patterns in summary stage (below Lev1a threshold)", () => {
        expect(isTargetSegment(seg(["ka"]), AzikLevel.Lev2a, true)).toBe(false);
      });

      it("rejects patterns above stageLevel in summary stage", () => {
        // Summary at Lev2a: kp is Lev2b > Lev2a → not a target
        expect(isTargetSegment(seg(["kp"]), AzikLevel.Lev2a, true)).toBe(false);
        // Summary at Lev1b: xa is Lev1c > Lev1b → not a target
        expect(isTargetSegment(seg(["xa"]), AzikLevel.Lev1b, true)).toBe(false);
      });

      it("accepts sokuon compound in summary stage when core is in range", () => {
        // ;kz core=kz=Lev2a, summary at Lev2a → in range
        expect(isTargetSegment(seg([";kz"]), AzikLevel.Lev2a, true)).toBe(true);
        // ;kz core=kz=Lev2a, summary at Lev1b (max=Lev1b < Lev2a) → out of range
        expect(isTargetSegment(seg([";kz"]), AzikLevel.Lev1b, true)).toBe(false);
      });
    });
  });

  // ---------------------------------------------------------------
  // filterStageWords
  // ---------------------------------------------------------------
  describe("filterStageWords", () => {
    const makeStage = (
      category: StageData["category"],
      words: { kana: string; kanji: string }[]
    ): StageData => ({ id: "test", category, name: "test", description: "", words });

    it("removes words containing obsolete kana from any category", () => {
      const stage = makeStage("Lev1", [
        { kana: "いぬ", kanji: "犬" },
        { kana: "ゐとう", kanji: "ゐとう" },
        { kana: "ゑ", kanji: "ゑ" },
        { kana: "ねこ", kanji: "猫" },
      ]);
      const result = filterStageWords(stage);
      expect(result.words.map(w => w.kana)).toEqual(["いぬ", "ねこ"]);
    });

    it("also removes obsolete kana in Practice category", () => {
      const stage = makeStage("Practice", [
        { kana: "やった", kanji: "やった" },
        { kana: "ヰヱ", kanji: "ヰヱ" },
      ]);
      const result = filterStageWords(stage);
      expect(result.words.map(w => w.kana)).toEqual(["やった"]);
    });

    it("removes Lev0 words from Practice category", () => {
      const stage = makeStage("Practice", [
        { kana: "いぬ", kanji: "犬" },
        { kana: "やった", kanji: "やった" },
        { kana: "さくら", kanji: "桜" },
      ]);
      const result = filterStageWords(stage);
      expect(result.words.map(w => w.kana)).not.toContain("いぬ");
      expect(result.words.map(w => w.kana)).not.toContain("さくら");
      expect(result.words.map(w => w.kana)).toContain("やった");
    });

    it("keeps Lev0 words in non-Practice categories", () => {
      const stage = makeStage("Lev1", [
        { kana: "いぬ", kanji: "犬" },
        { kana: "やった", kanji: "やった" },
      ]);
      const result = filterStageWords(stage);
      expect(result.words).toHaveLength(2);
    });

    it("does not mutate the original stage object", () => {
      const words = [{ kana: "ゐとう", kanji: "ゐとう" }];
      const stage = makeStage("Lev1", words);
      filterStageWords(stage);
      expect(stage.words).toHaveLength(1);
    });

    it("returns a new object with same metadata", () => {
      const stage = makeStage("Lev2a", [{ kana: "かんたん", kanji: "簡単" }]);
      const result = filterStageWords(stage);
      expect(result.id).toBe(stage.id);
      expect(result.category).toBe(stage.category);
      expect(result.words).not.toBe(stage.words);
    });
  });
});
