import { describe, it, expect } from "vitest";
import { AZIK_DICTIONARY } from "./azikRules";
import {
  applyUserConfig,
  parseConfToUserConfig,
  UserAzikConfig,
  EMPTY_USER_AZIK_CONFIG,
} from "./userAzikConfig";

describe("applyUserConfig", () => {
  it("keep: 辞書を変更しない", () => {
    const config: UserAzikConfig = { entries: { "ん": { mode: "keep" } } };
    const result = applyUserConfig(AZIK_DICTIONARY, config);
    expect(result["ん"].azik).toEqual(AZIK_DICTIONARY["ん"].azik);
  });

  it("disable: azik を空にする", () => {
    const config: UserAzikConfig = { entries: { "ん": { mode: "disable" } } };
    const result = applyUserConfig(AZIK_DICTIONARY, config);
    expect(result["ん"].azik).toEqual([]);
    expect(result["ん"].normal).toEqual(AZIK_DICTIONARY["ん"].normal);
  });

  it("replace: azik キーを差し替える", () => {
    const config: UserAzikConfig = {
      entries: { "っ": { mode: "replace", replacementKeys: ["jj"] } },
    };
    const result = applyUserConfig(AZIK_DICTIONARY, config);
    expect(result["っ"].azik).toEqual(["jj"]);
  });

  it("replace で replacementKeys が空 / 未指定 の場合は何もしない", () => {
    const config: UserAzikConfig = {
      entries: { "っ": { mode: "replace", replacementKeys: [] } },
    };
    const result = applyUserConfig(AZIK_DICTIONARY, config);
    expect(result["っ"].azik).toEqual(AZIK_DICTIONARY["っ"].azik);
  });

  it("baseDict に存在しないかなは無視する", () => {
    const config: UserAzikConfig = { entries: { "なぁ": { mode: "disable" } } };
    const result = applyUserConfig(AZIK_DICTIONARY, config);
    expect(result["なぁ"]).toBeUndefined();
  });

  it("純粋関数: 元の辞書を変更しない", () => {
    const originalAzik = [...AZIK_DICTIONARY["ん"].azik];
    applyUserConfig(AZIK_DICTIONARY, { entries: { "ん": { mode: "disable" } } });
    expect(AZIK_DICTIONARY["ん"].azik).toEqual(originalAzik);
  });

  it("空設定: 辞書は変化しない", () => {
    const result = applyUserConfig(AZIK_DICTIONARY, EMPTY_USER_AZIK_CONFIG);
    expect(result["ん"].azik).toEqual(AZIK_DICTIONARY["ん"].azik);
  });
});

describe("parseConfToUserConfig", () => {
  it("q,ん → ん は keep（ベースと同じ）", () => {
    const conf = "q,ん\n";
    const result = parseConfToUserConfig(conf);
    expect(result.entries["ん"]?.mode).toBe("keep");
  });

  it("conf に存在しないかな → disable", () => {
    const conf = "q,ん\n"; // わん は conf に存在しない
    const result = parseConfToUserConfig(conf);
    expect(result.entries["わん"]?.mode).toBe("disable");
  });

  it("後勝ちルール: conf に xn のみ定義 → azik ショートカットが xn に置換", () => {
    // ん の base azik は ["q"]、conf は xn のみ → q は不要で xn に差し替え
    const conf = "xn,ん\n";
    const result = parseConfToUserConfig(conf);
    expect(result.entries["ん"]?.mode).toBe("replace");
    expect(result.entries["ん"]?.replacementKeys).toContain("xn");
    expect(result.entries["ん"]?.replacementKeys).not.toContain("q");
  });

  it("両方定義: q と xn の両方が azik に入る", () => {
    const conf = "q,ん\nxn,ん\n";
    const result = parseConfToUserConfig(conf);
    expect(result.entries["ん"]?.mode).toBe("replace");
    expect(result.entries["ん"]?.replacementKeys).toContain("q");
    expect(result.entries["ん"]?.replacementKeys).toContain("xn");
  });

  it("<okuri> 行はスキップ", () => {
    const conf = "kq,か<okuri>い\n";
    const result = parseConfToUserConfig(conf);
    // かい エントリは conf に kq がないため disable
    expect(result.entries["かい"]?.mode).toBe("disable");
  });

  it("矢印など非ひらがなのかなへのマッピングはスキップ", () => {
    const conf = "wp,↑\n";
    const result = parseConfToUserConfig(conf);
    // wp → ↑ は非ひらがなのためスキップ → うぉー は conf になし → disable
    // (辞書に存在する場合)
    if (AZIK_DICTIONARY["うぉー"]) {
      expect(result.entries["うぉー"]?.mode).toBe("disable");
    }
  });

  it("コメント行は無視", () => {
    const conf = "# これはコメント\nq,ん\n";
    const result = parseConfToUserConfig(conf);
    expect(result.entries["ん"]?.mode).toBe("keep");
  });

  it("わん: wz が conf に存在すれば keep", () => {
    const conf = "wz,わん\n";
    const result = parseConfToUserConfig(conf);
    expect(result.entries["わん"]?.mode).toBe("keep");
  });

  it("TSV形式（Google 日本語入力）: タブ区切りを認識する", () => {
    const tsv = "q\tん\nwz\tわん\n";
    const result = parseConfToUserConfig(tsv);
    expect(result.entries["ん"]?.mode).toBe("keep");
    expect(result.entries["わん"]?.mode).toBe("keep");
    // TSV にないかなは disable
    expect(result.entries["かん"]?.mode).toBe("disable");
  });

  it("TSV: xn のみ定義でも replace になる", () => {
    const tsv = "xn\tん\n";
    const result = parseConfToUserConfig(tsv);
    expect(result.entries["ん"]?.mode).toBe("replace");
    expect(result.entries["ん"]?.replacementKeys).toContain("xn");
  });
});
