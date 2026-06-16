/**
 * ステージ語句のAZIKレベル違反チェック
 *
 * 実行方法:
 *   ./node_modules/.bin/jiti scripts/check-level-violations.ts
 *   または
 *   ./node_modules/.bin/jiti scripts/check-level-violations.ts 2>&1 | tee .scratch/main/violation-report.txt
 */

import { canWordAppearAtLevel, AzikLevel, STAGE_MAX_LEVELS } from "../src/data/stages/wordValidator";
import { STAGES, loadStage } from "../src/data/stages";

const PRACTICE_LEVELS = new Set([AzikLevel.Practice]);

async function main() {
  console.log("AZIKレベル違反チェック開始...\n");

  let totalViolations = 0;
  let totalChecked = 0;

  for (const stageMeta of STAGES) {
    const maxLevel = STAGE_MAX_LEVELS[stageMeta.id];
    if (!maxLevel || PRACTICE_LEVELS.has(maxLevel)) {
      console.log(`  SKIP  ${stageMeta.id} (Practice)`);
      continue;
    }

    const stage = await loadStage(stageMeta.id);
    const violations = stage.words.filter(w => !canWordAppearAtLevel(w.kana, maxLevel));
    totalChecked += stage.words.length;

    if (violations.length > 0) {
      totalViolations += violations.length;
      console.log(`  FAIL  ${stageMeta.id} (max=${maxLevel}) — ${violations.length}/${stage.words.length} 件違反`);
      violations.slice(0, 5).forEach(w => console.log(`        ${w.kana} (${w.kanji})`));
      if (violations.length > 5) console.log(`        ... 他 ${violations.length - 5} 件`);
    } else {
      console.log(`  OK    ${stageMeta.id} (${stage.words.length}語)`);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  if (totalViolations === 0) {
    console.log(`✅ 違反なし！ (${totalChecked} 語チェック済み)`);
  } else {
    console.log(`❌ 合計違反: ${totalViolations}/${totalChecked} 語`);
    console.log(`\n→ 違反を除外するには scripts/import-azikt-words.py にフィルタを追加して再実行`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
