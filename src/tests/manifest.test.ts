import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SITE_DESCRIPTION } from "../data/siteMetadata";

describe("public/manifest.json", () => {
  it("description は src/data/siteMetadata.ts の SITE_DESCRIPTION と同期している", () => {
    const manifestPath = resolve(__dirname, "../../public/manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest.description).toBe(SITE_DESCRIPTION);
  });
});
