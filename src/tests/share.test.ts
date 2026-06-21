import { describe, it, expect } from "vitest";
import { onRequest } from "../../functions/share";

describe("share function OGP response", () => {
  it("should return HTML with canonical and extra OGP tags for crawlers", async () => {
    const url = "https://azik-fairy.solunita.net/share?wpm=120&acc=98&azik=100&title=TestStage&rank=A";
    const request = new Request(url, {
      headers: {
        "User-Agent": "Twitterbot",
      },
    });

    const context = {
      request,
      env: {
        OGIG_URL: "https://ogig.solunita.net",
      },
      next: () => {},
      data: {},
      params: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const response = await onRequest(context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");

    const html = await response.text();
    
    // Check for noindex, site_name, and locale
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(html).not.toContain('<link rel="canonical"');
    expect(html).toContain('<meta property="og:site_name" content="AZIK-Fairy">');
    expect(html).toContain('<meta property="og:locale" content="ja_JP">');
    expect(html).toContain("TestStage チャレンジ！ | AZIK-Fairy");
    expect(html).toContain("Rank: A | WPM: 120 | Acc: 98% | AZIK: 100%");
  });

  it("should redirect human browsers to root", async () => {
    const url = "https://azik-fairy.solunita.net/share?wpm=120&acc=98&azik=100&title=TestStage&rank=A";
    const request = new Request(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    });

    const context = {
      request,
      env: {},
      next: () => {},
      data: {},
      params: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const response = await onRequest(context);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://azik-fairy.solunita.net/");
  });
});
