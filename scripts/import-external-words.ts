#!/usr/bin/env npx tsx
/**
 * 外部辞書から語彙を取り込んでステージJSONに追加するスクリプト
 *
 * 実行方法: node_modules に同梱の jiti を使う (tsx/ts-node 不要)
 *   ./node_modules/.bin/jiti scripts/import-external-words.ts <source> [file]
 *
 * 使い方:
 *   # SKK JISYO.L (EUC-JP → UTF-8 変換してstdinへ)
 *   curl -L "https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L" \
 *     | iconv -f euc-jp -t utf-8 \
 *     | ./node_modules/.bin/jiti scripts/import-external-words.ts skk
 *
 *   # Mozc OSS辞書 (Apache 2.0)
 *   # https://github.com/google/mozc/tree/master/src/data/dictionary_oss
 *   cat path/to/mozc/dictionary*.txt \
 *     | ./node_modules/.bin/jiti scripts/import-external-words.ts mozc
 *
 *   # カスタムTSV (よみ\t表層形, ヘッダー行不要) — ギャル語など
 *   ./node_modules/.bin/jiti scripts/import-external-words.ts custom path/to/gyaru.tsv
 *
 * ソースフォーマット:
 *   skk    : SKK辞書形式 (UTF-8)   — よみ /漢字1/漢字2/.../
 *   mozc   : Mozc辞書形式 (UTF-8)  — 読み\tpos\tpos\tcost\t表層形
 *   custom : 汎用TSV (UTF-8)       — よみ\t表層形
 *
 * 処理フロー:
 *   1. stdin or ファイルから (よみ, 表層形) ペアを抽出
 *   2. よみをひらがなフィルタ (ひらがな+ー, 2〜10文字)
 *   3. findMinimumLevel(よみ) でAZIKレベルを自動分類
 *   4. レベルに対応するサマリーステージJSONに追記 (重複除外)
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { findMinimumLevel, AzikLevel } from "../src/data/stages/wordValidator";

// ─────────────────────────────────────────────────────────────
// 設定
// ─────────────────────────────────────────────────────────────

const STAGES_DIR = path.resolve(__dirname, "../src/data/stages");
const CHUNK_SIZE = 3000;
const CHUNKS_DIR = path.join(STAGES_DIR, "chunks");

/** AZIKレベル → 追記対象ステージ（サマリーのみ。フォーカスステージはAzikTデータを維持） */
const LEVEL_TO_STAGE: Partial<Record<AzikLevel, string>> = {
  [AzikLevel.Lev1a]:    "lev1-summary",
  [AzikLevel.Lev1b]:    "lev1-summary",
  [AzikLevel.Lev1c]:    "lev1-summary",
  [AzikLevel.Lev1d]:    "lev1-summary",
  [AzikLevel.Lev2a]:    "lev2a-summary",
  [AzikLevel.Lev2b]:    "lev2b-summary",
  [AzikLevel.Lev3a]:    "lev3a-summary",
  [AzikLevel.Lev3b]:    "lev3b-summary",
  [AzikLevel.Lev4]:     "lev4-summary",
  [AzikLevel.Practice]: "practice-words-1", // フォールバック
};

/** ひらがな+長音符のみ、2〜10文字 */
const VALID_KANA = /^[ぁ-んー]{2,10}$/;

// ─────────────────────────────────────────────────────────────
// パーサー
// ─────────────────────────────────────────────────────────────

type WordPair = { kana: string; kanji: string };

/** SKK JISYO形式: `よみ /漢字1/漢字2/.../ ` */
function parseSKKLine(line: string): WordPair | null {
  if (line.startsWith(";")) return null;
  const spaceIdx = line.indexOf(" /");
  if (spaceIdx < 0) return null;

  const kana = line.slice(0, spaceIdx).trim();
  // 送り仮名あり (よみに大文字 or ローマ字が混じる) → スキップ
  if (/[A-Za-z]/.test(kana)) return null;

  const rest = line.slice(spaceIdx + 2);
  const candidates = rest.split("/").map(s => s.trim()).filter(Boolean);
  
  // 有効な候補を探す (#で始まる注釈行候補はスキップ)
  const rawKanji = candidates.find(c => !c.startsWith("#"));
  if (!rawKanji) return null;

  // 注釈 (`;`以降) や 品詞タグ (`[`以降) をトリミングしてクリーンにする
  const kanji = rawKanji.split(";")[0].split("[")[0].trim();
  
  // トリミングの結果、空になったり、送り仮名用アルファベット等が残っていたらスキップ
  if (!kanji || /[a-zA-Z]/.test(kanji)) return null;

  return { kana, kanji };
}

/** Mozc OSS辞書形式: `読み\tpos_id\tpos_id\tcost\t表層形` */
function parseMozcLine(line: string): WordPair | null {
  if (line.startsWith("#") || line.startsWith("!")) return null;
  const cols = line.split("\t");
  if (cols.length < 5) return null;
  // 列順: 読み / 左コンテキスト / 右コンテキスト / コスト / 表層形
  const kana = cols[0].trim();
  const kanji = cols[4].trim();
  if (!kana || !kanji) return null;
  return { kana, kanji };
}

/** 汎用TSV: `よみ\t表層形` (ギャル語・カスタム語彙等) */
function parseTSVLine(line: string): WordPair | null {
  if (line.startsWith("#") || !line.trim()) return null;
  const cols = line.split("\t");
  if (cols.length < 2) return null;
  const kana = cols[0].trim();
  const kanji = cols[1].trim();
  if (!kana || !kanji) return null;
  return { kana, kanji };
}

/** カタカナからひらがなへの変換ヘルパー */
function katakanaToHiragana(src: string): string {
  return src.replace(/[\u30a1-\u30f6]/g, match => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

/** NEologd CSV形式: `表層形,*,*,*,*,*,*,*,*,*,*,読み,*` */
function parseNEologdLine(line: string): WordPair | null {
  if (line.startsWith("#") || !line.trim()) return null;
  const cols = line.split(",");
  if (cols.length < 12) return null;
  const kanji = cols[0].trim();
  const katakana = cols[11].trim();
  if (!kanji || !katakana) return null;
  const kana = katakanaToHiragana(katakana);
  return { kana, kanji };
}

// ─────────────────────────────────────────────────────────────
// stdin / ファイル → 行イテレーター
// ─────────────────────────────────────────────────────────────

async function* readLines(filepath?: string): AsyncGenerator<string> {
  const input = filepath
    ? fs.createReadStream(filepath, "utf-8")
    : process.stdin;
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  for await (const line of rl) yield line;
}

// ─────────────────────────────────────────────────────────────
// メイン
// ─────────────────────────────────────────────────────────────

async function main() {
  const [, , source, filepath] = process.argv;

  if (!source || !["skk", "mozc", "custom", "neologd"].includes(source)) {
    console.error("Usage: import-external-words.ts <skk|mozc|custom|neologd> [file]");
    console.error("  (ファイル省略時はstdinから読み込み)");
    process.exit(1);
  }

  const parseLine =
    source === "skk"  ? parseSKKLine  :
    source === "mozc" ? parseMozcLine :
    source === "neologd" ? parseNEologdLine :
    parseTSVLine;

  // ── SKK: 送り仮名なしセクションだけを処理 ──
  let inOkuriNasiSection = source !== "skk"; // skk以外は最初からtrue

  // ── 既存ステージのkanaセットをメモリに読み込む（重複除外用）──
  const existingKana: Record<string, Set<string>> = {};
  const stageWords: Record<string, WordPair[]> = {};

  const manifestPath = path.join(CHUNKS_DIR, "manifest.json");
  const manifest: Record<string, number> = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
    : {};

  const targetStageIds = new Set(Object.values(LEVEL_TO_STAGE).filter(Boolean) as string[]);
  for (const id of targetStageIds) {
    const jsonPath = path.join(STAGES_DIR, `${id}.json`);
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    let words = data.words || [];

    // すでにチャンク分割されている場合は、チャンクからも読み込む
    const chunkCount = manifest[id];
    if (chunkCount !== undefined) {
      words = [];
      for (let i = 0; i < chunkCount; i++) {
        const chunkPath = path.join(CHUNKS_DIR, `${id}-${i}.json`);
        if (fs.existsSync(chunkPath)) {
          const chunkData = JSON.parse(fs.readFileSync(chunkPath, "utf-8"));
          words.push(...chunkData.words);
        }
      }
    }

    existingKana[id] = new Set(words.map((w: WordPair) => w.kana));
    stageWords[id] = words;
  }

  // ── パース & 分類 ──
  let parsed = 0, skipped = 0, added = 0;
  const addedByStage: Record<string, number> = {};

  for await (const line of readLines(filepath)) {
    // SKKの送り仮名なしセクション判定
    if (source === "skk") {
      if (line.includes("okuri-nasi entries")) { inOkuriNasiSection = true; continue; }
      if (!inOkuriNasiSection) continue;
    }

    const pair = parseLine(line);
    if (!pair) { skipped++; continue; }

    const { kana, kanji } = pair;
    parsed++;

    // ひらがなフィルタ
    if (!VALID_KANA.test(kana)) { skipped++; continue; }

    // AZIKレベル分類
    const level = findMinimumLevel(kana);
    const stageId = LEVEL_TO_STAGE[level];
    if (!stageId) { skipped++; continue; }

    // 重複除外
    if (existingKana[stageId].has(kana)) { skipped++; continue; }

    // 追加
    stageWords[stageId].push({ kanji, kana });
    existingKana[stageId].add(kana);
    addedByStage[stageId] = (addedByStage[stageId] ?? 0) + 1;
    added++;
  }

  // ── JSONに書き戻す ──
  if (!fs.existsSync(CHUNKS_DIR)) {
    fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  }

  for (const id of targetStageIds) {
    if (!addedByStage[id]) continue; // 変更なし
    const jsonPath = path.join(STAGES_DIR, `${id}.json`);
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const words = shuffle(stageWords[id]);

    if (words.length > CHUNK_SIZE) {
      // チャンク分割して保存
      const chunkCount = Math.ceil(words.length / CHUNK_SIZE);
      manifest[id] = chunkCount;

      for (let i = 0; i < chunkCount; i++) {
        const chunkWords = words.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkData = {
          ...data,
          words: chunkWords,
        };
        const chunkPath = path.join(CHUNKS_DIR, `${id}-${i}.json`);
        fs.writeFileSync(chunkPath, JSON.stringify(chunkData, null, 2) + "\n", "utf-8");
      }

      // 元のJSONファイルは words を空にして保存 (Git差分肥大化防止)
      data.words = [];
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    } else {
      // 通常保存
      data.words = words;
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
      delete manifest[id]; // チャンク化されない場合はマニフェストから削除
    }
  }

  // マニフェストの保存
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

  // ── レポート ──
  console.log(`\n外部語彙インポート完了 (ソース: ${source})`);
  console.log(`  解析行数: ${parsed + skipped}`);
  console.log(`  有効ペア: ${parsed}`);
  console.log(`  追加語数: ${added}`);
  console.log(`  スキップ: ${skipped}`);
  if (added > 0) {
    console.log("\nステージ別追加数:");
    for (const [id, count] of Object.entries(addedByStage).sort()) {
      console.log(`  ${id}: +${count}`);
    }
  }
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

main().catch(e => { console.error(e); process.exit(1); });
