import { describe, it, expect } from "vitest";
import { buildTweetUrl } from "./tweetUtils";
import type { GameStats } from "@/types/game";

const baseStats: GameStats = {
  time: 30.5,
  wpm: 120,
  accuracy: 95,
  totalKeys: 200,
  missCount: 3,
  azikRatio: 75,
  rank: "A",
  comment: "great",
  savedKeys: 40,
};

describe("buildTweetUrl", () => {
  it("training share: text mentions トレーニング中 and url has training=true param", () => {
    const url = buildTweetUrl(baseStats, "Lev1 子音", true, "https://example.com");
    const parsed = new URL(url);
    const text = parsed.searchParams.get("text") ?? "";
    const shareUrl = parsed.searchParams.get("url") ?? "";

    expect(text).toContain("トレーニング中");
    expect(text).toContain("Lev1 子音");
    expect(shareUrl).toContain("training=true");
    expect(shareUrl).not.toContain("wpm=");
  });

  it("score attack share: text mentions スコアアタック and url has wpm/acc/azik params", () => {
    const url = buildTweetUrl(baseStats, "Challenge", false, "https://example.com");
    const parsed = new URL(url);
    const text = parsed.searchParams.get("text") ?? "";
    const shareUrl = parsed.searchParams.get("url") ?? "";

    expect(text).toContain("スコアアタック");
    expect(text).toContain("120 WPM");
    expect(text).toContain("95%");
    expect(shareUrl).toContain("wpm=120");
    expect(shareUrl).toContain("acc=95");
    expect(shareUrl).toContain("azik=75");
  });

  it("PERFECT rank shows ✦PERFECT✦ label in tweet text", () => {
    const url = buildTweetUrl({ ...baseStats, rank: "PERFECT" }, "Stage", false, "https://example.com");
    const text = new URL(url).searchParams.get("text") ?? "";
    expect(text).toContain("✦PERFECT✦");
  });

  it("non-PERFECT rank shows ${rank}ランク label in tweet text", () => {
    const urlA = buildTweetUrl({ ...baseStats, rank: "A" }, "Stage", false, "https://example.com");
    const textA = new URL(urlA).searchParams.get("text") ?? "";
    expect(textA).toContain("Aランク");

    const urlC = buildTweetUrl({ ...baseStats, rank: "C" }, "Stage", true, "https://example.com");
    const textC = new URL(urlC).searchParams.get("text") ?? "";
    expect(textC).toContain("Cランク");
  });

  it("always posts to x.com/intent/tweet", () => {
    const url = buildTweetUrl(baseStats, "Stage", true, "https://example.com");
    expect(url.startsWith("https://x.com/intent/tweet?")).toBe(true);
  });
});
