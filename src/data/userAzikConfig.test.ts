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

  it("xn のみ定義: base.normal のキーは azik に入らない → disable", () => {
    // ん の base: normal=["nn","xn"], azik=["q"]
    // conf は xn のみ → xn は base.normal なので azikKeys に入らない → disable
    const conf = "xn,ん\n";
    const result = parseConfToUserConfig(conf);
    expect(result.entries["ん"]?.mode).toBe("disable");
  });

  it("q と xn の両方が conf にある: xn は normal なので azik には q のみ → keep", () => {
    // q は base.azik → keep、xn は base.normal なので azikKeys から除外
    // 結果 azikKeys=["q"] = base.azik → keep
    const conf = "q,ん\nxn,ん\n";
    const result = parseConfToUserConfig(conf);
    expect(result.entries["ん"]?.mode).toBe("keep");
  });

  it("base.normal にも azik にも無い新キー → replace として採用", () => {
    // わん の base: normal=["wan"], azik=["wz"]
    // conf に wn が入った場合: wn は base.normal/azik にない → azikKeys に入る
    // wz も conf にあれば keep 候補だが、ここでは wn のみ
    const conf = "wn,わん\n";
    const result = parseConfToUserConfig(conf);
    expect(result.entries["わん"]?.mode).toBe("replace");
    expect(result.entries["わん"]?.replacementKeys).toContain("wn");
    expect(result.entries["わん"]?.replacementKeys).not.toContain("wz");
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

  it("TSV: xn のみ定義は base.normal なので disable になる", () => {
    // xn は ん の base.normal → azikKeys に入らない → disable
    const tsv = "xn\tん\n";
    const result = parseConfToUserConfig(tsv);
    expect(result.entries["ん"]?.mode).toBe("disable");
  });
});
