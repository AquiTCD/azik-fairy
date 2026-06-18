/**
 * Lev1/Lev2 ステージ語彙の純粋性クリーンアップ
 *
 * お題以外のAZIKショートカットを含む語を除去する。
 * 許容: Lev0（基本ローマ字）/ Lev3a・3b・4（互換）/ お題のショートカット
 * チャンクステージ（summary等）はchunks/ディレクトリ内の全チャンクファイルを処理する。
 *
 * 実行方法:
 *   ./node_modules/.bin/jiti scripts/clean-stage-words.ts
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import { isWordPureForStage, STAGE_PURITY_RULES } from "../src/data/stages/wordValidator";

const STAGES_DIR = join(import.meta.dirname ?? __dirname, "../src/data/stages");
const CHUNKS_DIR = join(STAGES_DIR, "chunks");

function getChunkFiles(stageId: string): string[] {
  const prefix = `${stageId}-`;
  try {
    return readdirSync(CHUNKS_DIR)
      .filter(f => f.startsWith(prefix) && f.endsWith(".json"))
      .map(f => join(CHUNKS_DIR, f));
  } catch {
    return [];
  }
}

async function main() {
  console.log("ステージ語彙クリーンアップ開始...\n");

  let totalRemoved = 0;

  for (const stageId of Object.keys(STAGE_PURITY_RULES)) {
    const chunkFiles = getChunkFiles(stageId);

    if (chunkFiles.length > 0) {
      // チャンクステージ: 全チャンクファイルを処理
      let stageTotal = 0;
      let stageRemoved = 0;

      for (const filePath of chunkFiles) {
        const stage = JSON.parse(readFileSync(filePath, "utf-8"));
        const before = stage.words.length;

        stage.words = stage.words.filter((w: { kana: string }) =>
          isWordPureForStage(w.kana, stageId)
        );

        const after = stage.words.length;
        stageTotal += after;
        stageRemoved += before - after;

        writeFileSync(filePath, JSON.stringify(stage, null, 2) + "\n", "utf-8");
      }

      totalRemoved += stageRemoved;
      const mark = stageRemoved === 0 ? "✅" : "🧹";
      const totalBefore = stageTotal + stageRemoved;
      console.log(`${mark} ${stageId.padEnd(16)}: ${totalBefore} → ${stageTotal} 語 (-${stageRemoved}) [${chunkFiles.length} chunks]`);
    } else {
      // 通常ステージ: JSON直接処理
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
      console.log(`${mark} ${stageId.padEnd(16)}: ${before} → ${after} 語 (-${removed})`);
    }
  }

  console.log(`\n合計削除: ${totalRemoved} 語`);
  console.log("完了。チャンクステージの wordCount は chunks 内の総語数を確認してください。");
}

main().catch(e => { console.error(e); process.exit(1); });
