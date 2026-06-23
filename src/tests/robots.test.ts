import { describe, it, expect } from "vitest";
import robots from "../app/robots";

describe("robots.txt metadata route", () => {
  it("should allow Twitterbot for all paths and block standard crawlers for /share", () => {
    const res = robots();
    
    // rules should be an array to support multiple user agents differently
    expect(Array.isArray(res.rules)).toBe(true);
    const rules = res.rules as Array<{
      userAgent?: string | string[];
      allow?: string | string[];
      disallow?: string | string[];
    }>;

    // Should have Twitterbot allowed for everything (or at least /share)
    const twitterBotRule = rules.find(
      (r) =>
        r.userAgent === "Twitterbot" ||
        (Array.isArray(r.userAgent) && r.userAgent.includes("Twitterbot"))
    );
    expect(twitterBotRule).toBeDefined();
    expect(twitterBotRule!.allow).toBe("/");
    expect(twitterBotRule!.disallow).toBeUndefined();

    // Should have wildcard blocking /share
    const wildcardRule = rules.find(
      (r) =>
        r.userAgent === "*" ||
        (Array.isArray(r.userAgent) && r.userAgent.includes("*"))
    );
    expect(wildcardRule).toBeDefined();
    expect(wildcardRule!.disallow).toBe("/share");
  });
});
