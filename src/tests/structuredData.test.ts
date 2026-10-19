import { describe, it, expect } from "vitest";
import { videoGameJsonLd } from "../data/structuredData";
import { SITE_DESCRIPTION } from "../data/siteMetadata";

describe("videoGameJsonLd", () => {
  it("schema.org VideoGame として必要なフィールドを持つ", () => {
    expect(videoGameJsonLd["@context"]).toBe("https://schema.org");
    expect(videoGameJsonLd["@type"]).toBe("VideoGame");
    expect(videoGameJsonLd.genre).toBe("Typing");
    expect(videoGameJsonLd.applicationCategory).toBe("Game");
  });

  it("無料であることを offers で明示する", () => {
    expect(videoGameJsonLd.offers.price).toBe("0");
    expect(videoGameJsonLd.offers.priceCurrency).toBe("JPY");
  });

  it("description は siteMetadata の SITE_DESCRIPTION と同期している（実際に持っていない情報は書かない）", () => {
    expect(videoGameJsonLd.description).toBe(SITE_DESCRIPTION);
  });

  it("JSON.stringify して妥当なJSONになる", () => {
    expect(() => JSON.parse(JSON.stringify(videoGameJsonLd))).not.toThrow();
  });
});
