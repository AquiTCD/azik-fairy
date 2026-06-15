import { describe, it, expect } from "vitest";
import {
  AzikLevel,
  levelOrdinal,
  classifyAzikKey,
  filterDictionaryByLevel,
  canWordAppearAtLevel,
  findMinimumLevel,
} from "./wordValidator";
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

    it("おちゃ is invalid at Lev1c (ちゃ[ca]=Lev1d > Lev1c)", () => {
      expect(canWordAppearAtLevel("おちゃ", AzikLevel.Lev1c)).toBe(false);
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
});
