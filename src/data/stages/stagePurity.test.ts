import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { isWordPureForStage, STAGE_PURITY_RULES } from "./wordValidator";

const STAGES_DIR = join(import.meta.dirname, ".");

describe("Stage purity", () => {
  for (const stageId of Object.keys(STAGE_PURITY_RULES)) {
    it(`${stageId} にはお題以外のAZIKショートカットを含む語がない`, () => {
      const filePath = join(STAGES_DIR, `${stageId}.json`);
      const stage = JSON.parse(readFileSync(filePath, "utf-8"));

      const violations = stage.words.filter(
        (w: { kana: string }) => !isWordPureForStage(w.kana, stageId),
      );

      if (violations.length > 0) {
        const examples = violations
          .slice(0, 5)
          .map((w: { kana: string; kanji: string }) => `${w.kana}(${w.kanji})`)
          .join(", ");
        expect.fail(
          `${violations.length}語が汚染されています: ${examples}${violations.length > 5 ? " ..." : ""}`,
        );
      }

      expect(violations).toHaveLength(0);
    });
  }
});
