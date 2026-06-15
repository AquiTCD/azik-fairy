import { describe, it, expect } from "vitest";
import { ADS, getRandomAds } from "./adData";

describe("ADS data", () => {
  it("has at least one ad per category", () => {
    const categories = ["keyboard", "parts", "mouse", "wristrest", "accessories"] as const;
    categories.forEach(cat => {
      expect(ADS.some(ad => ad.category === cat)).toBe(true);
    });
  });

  it("every ad has required fields", () => {
    ADS.forEach(ad => {
      expect(ad.label).toBeTruthy();
      expect(ad.url).toBeTruthy();
      expect(ad.emoji).toBeTruthy();
      expect(ad.category).toBeTruthy();
    });
  });
});

describe("getRandomAds", () => {
  it("returns the requested count", () => {
    expect(getRandomAds(2)).toHaveLength(2);
    expect(getRandomAds(1)).toHaveLength(1);
  });

  it("returns valid Ad objects", () => {
    getRandomAds(3).forEach(ad => {
      expect(ad.label).toBeTruthy();
      expect(ad.url).toBeTruthy();
    });
  });

  it("does not return more ads than the total pool", () => {
    const all = getRandomAds(9999);
    expect(all.length).toBeLessThanOrEqual(ADS.length);
  });
});
