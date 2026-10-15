import { describe, it, expect } from "vitest";
import { metadata } from "../data/siteMetadata";

describe("layout metadata SEO keywords", () => {
  it("title に「タイピング練習」を含む（ゲーム要素は本質ではないため「タイピングゲーム」は不要）", () => {
    expect(String(metadata.title)).toContain("タイピング練習");
  });

  it("description に「タイピング練習」と「タイピングゲーム」の両方を含む", () => {
    const description = String(metadata.description);
    expect(description).toContain("タイピング練習");
    expect(description).toContain("タイピングゲーム");
  });

  it("openGraph / twitter の title・description は本体のmetadataと同一文言を保つ", () => {
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.twitter?.title).toBe(metadata.title);
    expect(metadata.twitter?.description).toBe(metadata.description);
  });
});
