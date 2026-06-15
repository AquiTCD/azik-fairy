import { describe, it, expect } from "vitest";
import {
  splitIntoAzikSegments,
  AZIK_DICTIONARY,
  mergeCustomAzikRules,
  parseExternalRomajiTable
} from "./azikRules";

describe("AZIK Rules Engine Tests", () => {

  // 1. デフォルトでの基本的な音節パースのテスト
  describe("Default Segmentation Tests", () => {
    it("should parse standard words correctly", () => {
      const segs = splitIntoAzikSegments("かんたん");
      expect(segs).toHaveLength(2); // かん, たん

      // かん
      expect(segs[0].kana).toBe("かん");
      expect(segs[0].azik).toContain("kz");
      expect(segs[0].normal).toContain("kan");

      // たん
      expect(segs[1].kana).toBe("たん");
      expect(segs[1].azik).toContain("tz");
      expect(segs[1].normal).toContain("tan");
    });

    it("should parse double vowel words correctly", () => {
      const segs = splitIntoAzikSegments("かいしゃ");
      // かい, しゃ
      expect(segs).toHaveLength(2);
      expect(segs[0].kana).toBe("かい");
      expect(segs[0].azik).toContain("kq");
      expect(segs[1].kana).toBe("しゃ");
      expect(segs[1].azik).toContain("xa");
    });

    it("should parse sokuon (っ) correctly", () => {
      const segs = splitIntoAzikSegments("やった");
      // や, った
      expect(segs).toHaveLength(2);
      expect(segs[0].kana).toBe("や");
      expect(segs[1].kana).toBe("った");
      expect(segs[1].azik).toContain(";ta");
      expect(segs[1].normal).toContain("tta");
    });

    it("should parse っ + compound kana (いっしょ) as single っしょ segment", () => {
      const segs = splitIntoAzikSegments("いっしょ");
      // い, っしょ (NOT い, っし, ょ)
      expect(segs).toHaveLength(2);
      expect(segs[1].kana).toBe("っしょ");
      expect(segs[1].azik).toContain(";xo");
      expect(segs[1].normal).toSatisfy((arr: string[]) =>
        arr.some(k => k === "ssho" || k === "ssyo")
      );
    });

    it("should parse っちゃ correctly as single segment", () => {
      const segs = splitIntoAzikSegments("あっちゃ");
      expect(segs).toHaveLength(2);
      expect(segs[1].kana).toBe("っちゃ");
      expect(segs[1].azik).toContain(";ca");
    });
  });

  // 2. SKK互換: 母音始まりの撥音・二重母音は別セグメントに分解される
  describe("Vowel-initial syllables split into separate segments (SKK-compatible)", () => {
    it("should split うんてん into 3 segments: う + ん + てん", () => {
      const segs = splitIntoAzikSegments("うんてん");
      expect(segs).toHaveLength(3);
      expect(segs[0].kana).toBe("う");
      expect(segs[0].azik).toContain("u");
      expect(segs[1].kana).toBe("ん");
      expect(segs[1].azik).toContain("q");
      expect(segs[2].kana).toBe("てん");
      expect(segs[2].azik).toContain("td");
    });

    it("should split all vowel+ん patterns into separate segments", () => {
      const cases = [
        { input: "あんしん", vowel: "あ", vowelAzik: "a" },
        { input: "いんしょう", vowel: "い", vowelAzik: "i" },
        { input: "うんてん", vowel: "う", vowelAzik: "u" },
        { input: "えんじょ", vowel: "え", vowelAzik: "e" },
        { input: "おんがく", vowel: "お", vowelAzik: "o" },
      ];
      for (const c of cases) {
        const segs = splitIntoAzikSegments(c.input);
        // first segment = plain vowel
        expect(segs[0].kana).toBe(c.vowel);
        expect(segs[0].azik).toContain(c.vowelAzik);
        // second segment = ん → q
        expect(segs[1].kana).toBe("ん");
        expect(segs[1].azik).toContain("q");
      }
    });

    it("should split vowel-initial double vowels into separate segments", () => {
      // えいが → え + い + が (3 segments, no W shortcut for bare えい)
      const segs = splitIntoAzikSegments("えいが");
      expect(segs[0].kana).toBe("え");
      expect(segs[0].azik).toContain("e");
      expect(segs[1].kana).toBe("い");
      expect(segs[1].azik).toContain("i");
      expect(segs[2].kana).toBe("が");

      // おうさま → お + う + さ + ま (4 segments)
      const segs2 = splitIntoAzikSegments("おうさま");
      expect(segs2[0].kana).toBe("お");
      expect(segs2[1].kana).toBe("う");
    });

    it("should still use AZIK shortcut for consonant-preceded patterns", () => {
      // けいさん = けい[kw] + さん[sz]
      const segs = splitIntoAzikSegments("けいさん");
      expect(segs[0].kana).toBe("けい");
      expect(segs[0].azik).toContain("kw");
      // えんじょ starts with vowel, so えん = え + ん[q]
      // but in a word like けんじょ: けん = kd
      const segs2 = splitIntoAzikSegments("けんじょ");
      expect(segs2[0].kana).toBe("けん");
      expect(segs2[0].azik).toContain("kd");
    });
  });

  // 3. カスタムキーマッピングの上書きマージ処理のテスト
  describe("Custom Key Mapping Merging Tests", () => {
    it("should override specific key mappings successfully", () => {
      const customSettings = {
        "ん": ["x"],
        "っ": ["v"],
        "あん": ["y"], // あん拡張キー z → y に変更 → かん[kz]→[ky], たん[tz]→[ty]
      };

      const mergedDict = mergeCustomAzikRules(customSettings);

      // ん/っ の単打キー上書き
      expect(mergedDict["ん"].azik).toEqual(["x"]);
      expect(mergedDict["っ"].azik).toEqual(["v"]);
      // 母音初起エントリ "あん" は辞書に存在しないのでundefined (SKK互換)
      expect(mergedDict["あん"]).toBeUndefined();

      // パースのテスト: マージ後の辞書を使ってパースする
      const segs = splitIntoAzikSegments("かんたん", mergedDict);

      // かん (子音k + あん拡張[y] ➔ ky)
      expect(segs[0].kana).toBe("かん");
      expect(segs[0].azik).toContain("ky");

      // たん (子音t + あん拡張[y] ➔ ty)
      expect(segs[1].kana).toBe("たん");
      expect(segs[1].azik).toContain("ty");
    });
  });

  // 4. 促音エッジケーステスト
  describe("Sokuon edge cases", () => {
    it("should handle っ at end of string as fallback segment", () => {
      const segs = splitIntoAzikSegments("きっ");
      // き, っ の2セグメントになるはず（っ単独の末尾）
      expect(segs).toHaveLength(2);
      expect(segs[0].kana).toBe("き");
      expect(segs[1].kana).toBe("っ");
      // っ単体のAZIKキー（デフォルト: ";"）が入っていること
      expect(segs[1].azik).toContain(";");
    });

    it("should treat っ before vowel as separate segments (no consonant doubling)", () => {
      const segs = splitIntoAzikSegments("っあ");
      // 「っあ」は「った」と違い子音2打ができない → っ + あ の2セグメント
      expect(segs[0].kana).toBe("っ");
      expect(segs[1].kana).toBe("あ");
    });

    it("should correctly parse complex: きゅうにゅう", () => {
      const segs = splitIntoAzikSegments("きゅうにゅう");
      // きゅう, にゅう の2セグメント
      expect(segs).toHaveLength(2);
      expect(segs[0].kana).toBe("きゅう");
      expect(segs[1].kana).toBe("にゅう");
    });

    it("should correctly parse: きゃっかんてき", () => {
      const segs = splitIntoAzikSegments("きゃっかんてき");
      // きゃ, っか, んて き → きゃ / っか / ん / て / き の分割を確認
      // っか: 子音k+促音 → "kka" or ";ka"
      const kakSegment = segs.find(s => s.kana === "っか");
      expect(kakSegment).toBeDefined();
      expect(kakSegment?.azik.some(p => p.includes("k"))).toBe(true);
    });
  });

  // 5. mergeCustomAzikRules 境界値テスト
  describe("mergeCustomAzikRules edge cases", () => {
    it("should return unchanged dict when customRules is empty", () => {
      const merged = mergeCustomAzikRules({});
      expect(merged["かん"].azik).toContain("kz");
      expect(merged["ん"].azik).toContain("q");
    });

    it("should only affect compound entries related to the changed key", () => {
      // うん拡張キーを j→x に変更しても、あん系(kz)は変わらない
      const merged = mergeCustomAzikRules({ "うん": ["x"] });
      // 母音初起エントリ "うん" は辞書に存在しない (SKK互換)
      expect(merged["うん"]).toBeUndefined();
      expect(merged["かん"].azik).toContain("kz");  // あん系は変わらない
      expect(merged["きん"].azik).toContain("kk");  // いん系(extension=k)は変わらない
      // くん の azik は kj → うん extension が x になれば kx
      expect(merged["くん"].azik).toContain("kx");
    });

    it("should handle unknown customRule key gracefully (no crash)", () => {
      expect(() => mergeCustomAzikRules({ "存在しないキー": ["x"] })).not.toThrow();
    });
  });

  describe("nAlternative (N as Z substitute for 撥音)", () => {
    it("off: should NOT add N alternatives for any consonant", () => {
      const merged = mergeCustomAzikRules({}, { enableSpecial: true, enableForeign: true, nAlternative: "off" });
      expect(merged["さん"].azik).not.toContain("sn");
      expect(merged["かん"].azik).not.toContain("kn");
      expect(merged["がん"].azik).not.toContain("gn");
    });

    it("left: should add N for left-hand consonants (s/g/t/d/b/r/w/c/x/z)", () => {
      const merged = mergeCustomAzikRules({}, { enableSpecial: true, enableForeign: true, nAlternative: "left" });
      // left-hand: s, g, t, d, b, r, w, z, x, c
      expect(merged["さん"].azik).toContain("sn");   // s = left-hand
      expect(merged["がん"].azik).toContain("gn");   // g = left-hand
      expect(merged["たん"].azik).toContain("tn");   // t = left-hand
      expect(merged["だん"].azik).toContain("dn");   // d = left-hand
      expect(merged["ばん"].azik).toContain("bn");   // b = left-hand
      expect(merged["らん"].azik).toContain("rn");   // r = left-hand
      expect(merged["わん"].azik).toContain("wn");   // w = left-hand
      expect(merged["しゃん"].azik).toContain("xn"); // x = left-hand
      expect(merged["ちゃん"].azik).toContain("cn"); // c = left-hand
    });

    it("left: should NOT add N for right-hand consonants (k/h/j/m/y/p)", () => {
      const merged = mergeCustomAzikRules({}, { enableSpecial: true, enableForeign: true, nAlternative: "left" });
      expect(merged["かん"].azik).not.toContain("kn");  // k = right-hand
      expect(merged["はん"].azik).not.toContain("hn");  // h = right-hand
      expect(merged["じゃん"].azik).not.toContain("jn"); // j = right-hand
      expect(merged["まん"].azik).not.toContain("mn");  // m = right-hand
      expect(merged["やん"].azik).not.toContain("yn");  // y = right-hand
      expect(merged["ぱん"].azik).not.toContain("pn");  // p = right-hand
    });

    it("all: should add N for all consonants including right-hand (k/h/j)", () => {
      const merged = mergeCustomAzikRules({}, { enableSpecial: true, enableForeign: true, nAlternative: "all" });
      expect(merged["かん"].azik).toContain("kn");
      expect(merged["はん"].azik).toContain("hn");
      expect(merged["じゃん"].azik).toContain("jn");
      expect(merged["まん"].azik).toContain("mn");
      // left-hand still included
      expect(merged["さん"].azik).toContain("sn");
      expect(merged["がん"].azik).toContain("gn");
    });

    it("left: Z alternatives should still be present alongside N", () => {
      const merged = mergeCustomAzikRules({}, { enableSpecial: true, enableForeign: true, nAlternative: "left" });
      expect(merged["さん"].azik).toContain("sz"); // Z still works
      expect(merged["さん"].azik).toContain("sn"); // N also works
    });

    it("default (no features arg): should use left mode", () => {
      const merged = mergeCustomAzikRules({});
      expect(merged["さん"].azik).toContain("sn");
      expect(merged["かん"].azik).not.toContain("kn");
    });
  });

  // 6. parseExternalRomajiTable エッジケーステスト
  describe("parseExternalRomajiTable edge cases", () => {
    it("should return empty object for empty string input", () => {
      expect(parseExternalRomajiTable("")).toEqual({});
    });

    it("should return empty object for whitespace-only input", () => {
      expect(parseExternalRomajiTable("   \n  \t  ")).toEqual({});
    });

    it("should ignore lines without a valid separator", () => {
      const text = `q\tん\nこれはセパレータがない行`;
      const result = parseExternalRomajiTable(text);
      expect(result["ん"]).toEqual(["q"]);
      expect(Object.keys(result)).toHaveLength(1);
    });

    it("should ignore romaji entries longer than 1 character", () => {
      const text = `ka\tか\nq\tん`;
      const result = parseExternalRomajiTable(text);
      // ka → か は対象外（ローマ字2文字）
      expect(result["か"]).toBeUndefined();
      expect(result["ん"]).toEqual(["q"]);
    });
  });

  // 7. TSV / SKK インポートパーサーのテスト
  describe("parseExternalRomajiTable Tests", () => {
    it("should parse TSV (Google Japanese Input ROM table) format correctly", () => {
      const tsvText = `
# Google Input ROM table sample
q	ん
;	っ
z	あん
k	いん
j	うん
d	えん
l	おん
q	あい
h	うう
w	えい
p	おう
# 無関係なルールは無視されるべき
ka	か
`;
      const parsed = parseExternalRomajiTable(tsvText);
      expect(parsed).toEqual({
        "ん": ["q"],
        "っ": [";"],
        "あん": ["z"],
        "いん": ["k"],
        "うん": ["j"],
        "えん": ["d"],
        "おん": ["l"],
        "あい": ["q"],
        "うう": ["h"],
        "えい": ["w"],
        "おう": ["p"]
      });
    });

    it("should parse SKK (kana-rule.conf) format correctly and collect multiple keys", () => {
      const skkText = `
# -*- coding: utf-8 -*-
# comment lines
q,ん
;,っ
:,っ
z,あん
k,いん,イ,ｨ
j,うん
d,えん
l,おん
q,あい
h,うう
w,えい
p,おう

# 複数ルールは全て収集される（重複は排除）
z,あん
z,あん
x,あん
`;
      const parsed = parseExternalRomajiTable(skkText);
      // あん: z と x が両方収集される（z の重複は排除）
      expect(parsed["あん"]).toEqual(["z", "x"]);
      // っ: ; と : が両方収集される
      expect(parsed["っ"]).toEqual([";", ":"]);
      expect(parsed["ん"]).toEqual(["q"]);
      expect(parsed["いん"]).toEqual(["k"]);
    });
  });
});
