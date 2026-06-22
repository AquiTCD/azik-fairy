import { describe, it, expect } from "vitest";
import {
  splitIntoAzikSegments,
  AZIK_DICTIONARY,
  buildValidKeys,
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

    it("should parse じん correctly with both zk and jk", () => {
      const segs = splitIntoAzikSegments("じんぞく");
      expect(segs[0].kana).toBe("じん");
      expect(segs[0].azik).toContain("zk");
      expect(segs[0].azik).toContain("jk");
      expect(segs[0].normal).toContain("zin");
      expect(segs[0].normal).toContain("jin");
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
      // きゃ / っかん / て / き の分割を確認 (促音とそれに続く「かん」が結合される)
      // っかん: 子音k+促音+撥音拡張 → "kkan" or ";kz"
      const kkanSegment = segs.find(s => s.kana === "っかん");
      expect(kkanSegment).toBeDefined();
      expect(kkanSegment?.azik).toContain(";kz");
      expect(kkanSegment?.normal).toContain("kkan");
    });

    it("should correctly parse: あっとう", () => {
      const segs = splitIntoAzikSegments("あっとう");
      // あ / っとう の分割を確認 (促音とそれに続く二重母音「とう」が結合される)
      // っとう: 子音t+促音+二重母音拡張 → "ttou" or ";tp"
      expect(segs).toHaveLength(2);
      expect(segs[0].kana).toBe("あ");
      expect(segs[1].kana).toBe("っとう");
      expect(segs[1].azik).toContain(";tp");
      expect(segs[1].normal).toContain("ttou");
    });
  });

  // ---------------------------------------------------------------
  // 小書きゃゅょ と 外来語複合拗音
  // ---------------------------------------------------------------
  describe("Small youon kana (ゃゅょ) and foreign compounds", () => {
    it("ゅ is typeable standalone as xyu or lyu", () => {
      expect(AZIK_DICTIONARY["ゅ"]).toBeDefined();
      expect(AZIK_DICTIONARY["ゅ"].normal).toContain("xyu");
      expect(AZIK_DICTIONARY["ゅ"].normal).toContain("lyu");
    });

    it("ゃ is typeable standalone as xya or lya", () => {
      expect(AZIK_DICTIONARY["ゃ"]).toBeDefined();
      expect(AZIK_DICTIONARY["ゃ"].normal).toContain("xya");
    });

    it("ょ is typeable standalone as xyo or lyo", () => {
      expect(AZIK_DICTIONARY["ょ"]).toBeDefined();
      expect(AZIK_DICTIONARY["ょ"].normal).toContain("xyo");
    });

    it("でゅ is parsed as single segment [dhu] with the AZIK dictionary", () => {
      const segs = splitIntoAzikSegments("でゅおたろう");
      expect(segs[0].kana).toBe("でゅ");
      expect(segs[0].normal).toContain("dhu");
    });

    it("てゅ is parsed as single segment [tyu] with the AZIK dictionary", () => {
      const segs = splitIntoAzikSegments("てゅーりんがー");
      expect(segs[0].kana).toBe("てゅ");
      expect(segs[0].normal).toContain("tyu");
    });

    it("ふゅ is parsed as single segment [fyu] with the AZIK dictionary", () => {
      const segs = splitIntoAzikSegments("ふゅーじょん");
      expect(segs[0].kana).toBe("ふゅ");
      expect(segs[0].normal).toContain("fyu");
    });
  });
});

// =============================================================
// buildValidKeys
// =============================================================
describe("buildValidKeys", () => {
  const dict = AZIK_DICTIONARY;
  const all = (_sub: string, keys: string[]) => keys;

  it("空文字: [''] を返す", () => {
    expect(buildValidKeys("", dict, all)).toEqual([""]);
  });

  it("単一エントリ かん: kz と kan を両方含む", () => {
    const result = buildValidKeys("かん", dict, all);
    expect(result).toContain("kz");
    expect(result).toContain("kan");
  });

  it("ちゃい: 単体 cq と 分割 cai の両方を含む", () => {
    const result = buildValidKeys("ちゃい", dict, all);
    expect(result).toContain("cq");   // ["ちゃい"] → cq
    expect(result).toContain("cai");  // ["ちゃ","い"] → ca + i
    expect(result).toContain("tyai"); // ["ちゃ","い"] → tya + i
  });

  it("q-suffix フィルター: ちゃい → cq のみ残る", () => {
    const qFilter = (_sub: string, keys: string[]) => keys.filter(k => k.endsWith("q"));
    // "い" は q で終わるキーがないため ["ちゃ","い"] 分割は除外される
    const result = buildValidKeys("ちゃい", dict, qFilter);
    expect(result).toContain("cq");
    expect(result).not.toContain("cai");
    expect(result).not.toContain("tyai");
  });

  it("c-prefix フィルター: ちゃい → cq は含む", () => {
    const cFilter = (_sub: string, keys: string[]) => keys.filter(k => k.startsWith("c"));
    const result = buildValidKeys("ちゃい", dict, cFilter);
    expect(result).toContain("cq");
    // cai は cFilter で ca(✓) と i(✗) → filter が空を返すパスは除外
  });

  it("わん: wz と wan を含み、wn は含まない（辞書に存在しない）", () => {
    const result = buildValidKeys("わん", dict, all);
    expect(result).toContain("wz");
    expect(result).toContain("wan");
    expect(result).not.toContain("wn");
  });

  it("重複なし: 同じキー列が複数の分割パスで生成されても1件のみ", () => {
    const result = buildValidKeys("ちゃい", dict, all);
    const unique = [...new Set(result)];
    expect(result.length).toBe(unique.length);
  });

  it("っかん: ;kz を含む（っ + かん の組み合わせ）", () => {
    const result = buildValidKeys("っかん", dict, all);
    expect(result).toContain(";kz"); // ; + kz
    expect(result).toContain(";kan"); // ; + kan
  });

  describe("longestMatchOnly + isSubTarget (トレーニングモード)", () => {
    // FOCUS トレーニングフィルターの再現:
    // - ターゲットかな(しゃ): AZIK キーのみ ["xa"]
    // - 非ターゲット(し): allKeys をそのまま返す → shixya という分割パスが生成されうる
    const focusFilter = (sub: string, keys: string[]) => {
      if (sub === "しゃ") return keys.filter(k => k === "xa");  // ターゲット: AZIKのみ
      return keys;  // 非ターゲット: allKeys
    };

    it("longestMatchOnly=false: しゃ を し+ゃ に分割して shixya を生成してしまう（バグの再現）", () => {
      const result = buildValidKeys("しゃ", dict, focusFilter, false);
      // し(shi) + ゃ(xya) = shixya が生成される → s が valid prefix になる詰みバグ
      expect(result).toContain("shixya");
    });

    it("longestMatchOnly=true, isSubTarget: しゃ は xa のみ、shixya は除外（しは非ターゲット）", () => {
      // isSubTarget: しゃ はターゲット、し はターゲットでない
      const isSubTarget = (sub: string) => sub === "しゃ" || sub === "ゃ";
      const result = buildValidKeys("しゃ", dict, focusFilter, true, isSubTarget);
      expect(result).toEqual(["xa"]);
      expect(result).not.toContain("shixya");
      expect(result).not.toContain("sixya");
    });

    it("みょう Lev3a-G: mgp(直接) と mgou(みょ分割) の両方が生成される", () => {
      // Lev3a-G filter: stagePred = k.length>=3 && k[1]==="g"
      const lev3aGFilter = (sub: string, keys: string[]) => {
        const entry = dict[sub];
        if (!entry) return [];
        const target = entry.azik.filter(k => k.length >= 3 && k[1] === "g");
        if (target.length > 0) return target;
        return keys;  // 非ターゲット: allKeys
      };
      // isSubTarget: みょう, みょ はターゲット(G key持つ)、み はターゲットでない
      const isSubTarget = (sub: string) => {
        const entry = dict[sub];
        return !!entry?.azik.some(k => k.length >= 3 && k[1] === "g");
      };
      const result = buildValidKeys("みょう", dict, lev3aGFilter, true, isSubTarget);
      expect(result).toContain("mgp");   // 直接エントリ みょう→mgp
      expect(result).toContain("mgou");  // 分割 みょ(mgo)+う(u) = mgou
    });

    it("かん: longestMatchOnly=true, isSubTarget=undefined で kz と kan を返す", () => {
      const result = buildValidKeys("かん", dict, all, true);
      expect(result).toContain("kz");
      expect(result).toContain("kan");
    });
  });
});
