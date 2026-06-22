import { describe, it, expect } from "vitest";
import { AZIK_DICTIONARY } from "./azikRules";
import {
  applyUserDictConfig,
  parseTableToUserDictConfig,
  UserDictConfig,
  EMPTY_USER_DICT_CONFIG,
} from "./userDictConfig";

describe("applyUserDictConfig", () => {
  it("azik を上書きする", () => {
    const config: UserDictConfig = {
      "ん": { normal: ["nn", "xn"], azik: ["wn"] },
    };
    const result = applyUserDictConfig(AZIK_DICTIONARY, config);
    expect(result["ん"].azik).toEqual(["wn"]);
  });

  it("normal を上書きする", () => {
    const config: UserDictConfig = {
      "ん": { normal: ["nn"], azik: ["q"] },
    };
    const result = applyUserDictConfig(AZIK_DICTIONARY, config);
    expect(result["ん"].normal).toEqual(["nn"]);
  });

  it("baseDict にないかなは無視する", () => {
    const config: UserDictConfig = {
      "なぁ": { normal: [], azik: ["xx"] },
    };
    const result = applyUserDictConfig(AZIK_DICTIONARY, config);
    expect(result["なぁ"]).toBeUndefined();
  });

  it("純粋関数: 元の辞書を変更しない", () => {
    const originalAzik = [...AZIK_DICTIONARY["ん"].azik];
    const config: UserDictConfig = {
      "ん": { normal: ["nn", "xn"], azik: ["wn"] },
    };
    applyUserDictConfig(AZIK_DICTIONARY, config);
    expect(AZIK_DICTIONARY["ん"].azik).toEqual(originalAzik);
  });

  it("空設定: 辞書は変化しない", () => {
    const result = applyUserDictConfig(AZIK_DICTIONARY, EMPTY_USER_DICT_CONFIG);
    expect(result["ん"].azik).toEqual(AZIK_DICTIONARY["ん"].azik);
    expect(result["ん"].normal).toEqual(AZIK_DICTIONARY["ん"].normal);
  });
});

describe("parseTableToUserDictConfig", () => {
  it("q,ん → ん は keep（ベースと同じなので entries に存在しない）", () => {
    const conf = "q,ん\n";
    const result = parseTableToUserDictConfig(conf);
    // ベースと同一の場合は差分なし → エントリが存在しない
    expect(result["ん"]).toBeUndefined();
  });

  it("conf に存在しないかな → azik が空になる（entries[kana].azik === []）", () => {
    const conf = "q,ん\n"; // わん は conf に存在しない
    const result = parseTableToUserDictConfig(conf);
    expect(result["わん"]).toBeDefined();
    expect(result["わん"]!.azik).toEqual([]);
  });

  it("TSV 形式（タブ区切り）も同じ動作", () => {
    const tsv = "q\tん\nwz\tわん\n";
    const result = parseTableToUserDictConfig(tsv);
    // ん: ベースと同じ → 差分なし
    expect(result["ん"]).toBeUndefined();
    // わん: ベースと同じ → 差分なし
    expect(result["わん"]).toBeUndefined();
    // かん は conf にない → azik が空
    expect(result["かん"]).toBeDefined();
    expect(result["かん"]!.azik).toEqual([]);
  });

  it("base.normal のキーは azik に入らない", () => {
    // xn は ん の base.normal → azik に含まれない → azik は空 → disable
    const conf = "xn,ん\n";
    const result = parseTableToUserDictConfig(conf);
    expect(result["ん"]).toBeDefined();
    expect(result["ん"]!.azik).toEqual([]);
  });

  it("base.azik にないキー (wn) は新しい AZIK ショートカットとして採用", () => {
    // わん の base: normal=["wan"], azik=["wz"]
    // conf に wn が入った場合: wn は base.normal/azik にない → azik に追加
    const conf = "wn,わん\n";
    const result = parseTableToUserDictConfig(conf);
    expect(result["わん"]).toBeDefined();
    expect(result["わん"]!.azik).toContain("wn");
    expect(result["わん"]!.azik).not.toContain("wz"); // wz は conf にないので除外
  });

  it("コメント行は無視される", () => {
    const conf = "# これはコメント\nq,ん\n";
    const result = parseTableToUserDictConfig(conf);
    // q は base.azik と一致 → 差分なし
    expect(result["ん"]).toBeUndefined();
  });

  it("<okuri> 行はスキップ", () => {
    const conf = "kq,か<okuri>い\n";
    const result = parseTableToUserDictConfig(conf);
    // かい は conf にないため azik が空になる
    expect(result["かい"]).toBeDefined();
    expect(result["かい"]!.azik).toEqual([]);
  });

  it("q と xn 両方 conf にある: xn は normal なので azik には q のみ → ベースと同一 → 差分なし", () => {
    const conf = "q,ん\nxn,ん\n";
    const result = parseTableToUserDictConfig(conf);
    // azikKeys = ["q"] = base.azik → sameAzik → 差分なし
    expect(result["ん"]).toBeUndefined();
  });
});
