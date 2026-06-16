---
type: Feature
feature: external-vocab-import
title: 外部辞書データインポート 利用・運用ガイド
status: draft
---

# 外部辞書データインポート 利用・運用ガイド

本作の語彙データを更新・追加するための手順ガイドです。

## インポートスクリプトの実行

TypeScript スクリプトの実行には、プロジェクトに同梱されている `jiti` を使用します（`tsx` や `ts-node` のグローバルインストールは不要です）。

```bash
# 実行の基本構造
./node_modules/.bin/jiti scripts/import-external-words.ts <source_type> [file_path]
```

### 1. ギャル語 / カスタムTSVのインポート

TSVファイル（`よみ\t表層形`、ヘッダーなし）を用意し、以下を実行します。

```bash
./node_modules/.bin/jiti scripts/import-external-words.ts custom scripts/gyaru.tsv
```

### 2. Mozc OSS辞書のインポート

GoogleのMozcリポジトリを一時的にクローンし、中の辞書テキストを流し込みます。

```bash
git clone --depth=1 https://github.com/google/mozc.git /tmp/mozc
cat /tmp/mozc/src/data/dictionary_oss/dictionary*.txt | ./node_modules/.bin/jiti scripts/import-external-words.ts mozc
rm -rf /tmp/mozc
```

### 3. NEologd (新語辞書) のインポート

NEologdの最新のシードデータ（xz圧縮）を直接展開しながらストリーム入力します。

```bash
curl -L -s "https://raw.githubusercontent.com/neologd/mecab-ipadic-neologd/master/seed/mecab-user-dict-seed.20200910.csv.xz" \
  | xz -d -c \
  | ./node_modules/.bin/jiti scripts/import-external-words.ts neologd
```

### 4. SKK 辞書 (L, station, geo) のインポート

SKK辞書はEUC-JPで提供されているため、`iconv` を通してUTF-8に変換してから流し込みます。

```bash
# SKK-JISYO.L
curl -L -s "https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L" \
  | iconv -f euc-jp -t utf-8 \
  | ./node_modules/.bin/jiti scripts/import-external-words.ts skk

# SKK-JISYO.station (駅名)
curl -L -s "https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.station" \
  | iconv -f euc-jp -t utf-8 \
  | ./node_modules/.bin/jiti scripts/import-external-words.ts skk

# SKK-JISYO.geo (地名)
curl -L -s "https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.geo" \
  | iconv -f euc-jp -t utf-8 \
  | ./node_modules/.bin/jiti scripts/import-external-words.ts skk
```

## トラブルシューティング

### Q. インポートが途中でエラーになる
- **原因**: パイプで繋いでいる `xz` や `iconv` コマンドがシステムにインストールされていない可能性があります。
- **対処**: `which xz` や `which iconv` でコマンドの存在を確認し、無い場合は Homebrew 等でインストールしてください。

### Q. インポートしたのにチャンクファイルが増えない
- **原因**: インポートしようとした語彙データがすべて既存のデータと重複していたため、追加が 0 件となり書き戻し処理がスキップされた可能性があります。
- **対処**: 完全に新規の単語を含むTSVなどを読み込ませて動作するか確認してください。新規追加があればマニフェストとチャンクが更新されます。
