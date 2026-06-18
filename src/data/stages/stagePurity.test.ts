import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { isWordPureForStage, STAGE_PURITY_RULES, hasWordTargetKey, STAGE_KEY_PREDS } from "./wordValidator";

const STAGES_DIR = join(import.meta.dirname, ".");

describe("Stage purity (Lev1/Lev2: 他ステージAZIKキーなし)", () => {
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

describe("Stage target key presence (Lev3a/Lev3b: ターゲットキーを含む語のみ)", () => {
  for (const stageId of Object.keys(STAGE_KEY_PREDS)) {
    it(`${stageId} の全語がステージのターゲットキーを含む`, () => {
      const filePath = join(STAGES_DIR, `${stageId}.json`);
      const stage = JSON.parse(readFileSync(filePath, "utf-8"));

      const violations = stage.words.filter(
        (w: { kana: string }) => !hasWordTargetKey(w.kana, stageId),
      );

      if (violations.length > 0) {
        const examples = violations
          .slice(0, 5)
          .map((w: { kana: string; kanji: string }) => `${w.kana}(${w.kanji})`)
          .join(", ");
        expect.fail(
          `${violations.length}語にターゲットキーがありません: ${examples}${violations.length > 5 ? " ..." : ""}`,
        );
      }

      expect(violations).toHaveLength(0);
    });
  }
});
