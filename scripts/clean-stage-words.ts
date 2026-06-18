/**
 * Lev1/Lev2 ステージ語彙の純粋性クリーンアップ
 *
 * お題以外のAZIKショートカットを含む語を除去する。
 * 許容: Lev0（基本ローマ字）/ Lev3a・3b・4（互換）/ お題のショートカット
 *
 * 実行方法:
 *   ./node_modules/.bin/jiti scripts/clean-stage-words.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { isWordPureForStage, STAGE_PURITY_RULES } from "../src/data/stages/wordValidator";

const STAGES_DIR = join(import.meta.dirname ?? __dirname, "../src/data/stages");

async function main() {
  console.log("ステージ語彙クリーンアップ開始...\n");

  let totalRemoved = 0;

  for (const stageId of Object.keys(STAGE_PURITY_RULES)) {
    const filePath = join(STAGES_DIR, `${stageId}.json`);
    const stage = JSON.parse(readFileSync(filePath, "utf-8"));
    const before = stage.words.length;

    stage.words = stage.words.filter((w: { kana: string }) =>
      isWordPureForStage(w.kana, stageId)
    );

    const after = stage.words.length;
    const removed = before - after;
    totalRemoved += removed;

    writeFileSync(filePath, JSON.stringify(stage, null, 2) + "\n", "utf-8");

    const mark = removed === 0 ? "✅" : "🧹";
    console.log(`${mark} ${stageId.padEnd(15)}: ${before} → ${after} 語 (-${removed})`);
  }

  console.log(`\n合計削除: ${totalRemoved} 語`);
  console.log("完了。src/data/stages/index.ts の wordCount を更新してください。");
}

main().catch(e => { console.error(e); process.exit(1); });
