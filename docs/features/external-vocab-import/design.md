---
type: Feature
feature: external-vocab-import
title: 外部辞書データインポート 技術設計
status: draft
---

# 外部辞書データインポート 技術設計

## アーキテクチャ概要

辞書データのインポートから、アプリ内での動的ロードまでは以下のフローで実現されています。

```mermaid
graph TD
    subgraph インポート時 (Build/Dev)
        Mozc[Mozc OSS辞書] --> Script[import-external-words.ts]
        SKK[SKK辞書 L/station/geo] --> Script
        NEologd[NEologd 新語・固有名詞] --> Script
        Custom[カスタムTSV ギャル語等] --> Script
        Script --> Filter[1. AZIKレベル選別 & 重複除外]
        Filter --> Shuffle[2. Fisher-Yatesシャッフル]
        Shuffle --> Split[3. 3000語ごとのチャンク分割]
        Split --> ChunksDir[(src/data/stages/chunks/)]
        Split --> Manifest[manifest.json 生成]
    end

    subgraph アプリ実行時 (Browser)
        User[プレイヤーがステージを選択] --> Game[Game Controller]
        Game --> Load[loadStage]
        Load --> ReadManifest{manifest.json を確認}
        ReadManifest -- チャンクが存在する --> Random[インデックスをランダム決定]
        Random --> ImportChunk[chunks/id-N.json を動的インポート]
        ReadManifest -- チャンクなし (個別ステージ) --> ImportNormal[id.json を直接動的インポート]
        ImportChunk --> Play[ゲーム開始]
        ImportNormal --> Play
    end
```

## 主要モジュールとデータ構造

### 1. インポートスクリプト (`scripts/import-external-words.ts`)

- **AZIKレベル選別 (`LEVEL_TO_STAGE`)**:
  `findMinimumLevel(kana)` によって、単語を入力するのに必要な「最小AZIKレベル」を判定し、対応するサマリーステージに振り分けます。
  ※ AZIK拡張キーを一切含まない基本ローマ字単語（`Lev0`）は、アプリサイズ軽量化のためインポートから除外されます。
- **SKK注釈・タグの除去 (`parseSKKLine`)**:
  SKK辞書に特有の `候補;注釈` や `候補[品詞]` のフォーマットから、`;` や `[` 以降をトリミングし、純粋な漢字表記のみを抽出します。
- **既存チャンクデータの復元**:
  スクリプトを複数回（Mozc ➔ NEologd ➔ SKK ➔ カスタムのように）実行した際にも語彙データが引き継がれるよう、既存の `chunks/*.json` および `manifest.json` からデータをメモリ上に一度復元した上で、新しいデータを重複排除しつつ追加します。
- **Fisher-Yates シャッフル**:
  元の辞書が50音順に並んでいることによる出題の偏りを防ぐため、チャンクにスライスする直前で語彙配列全体をランダムに並び替えます。

### 2. アプリケーション側ローダー (`src/data/stages/index.ts`)

- **`manifest.json` による読み分け**:
  `chunks/manifest.json` にステージIDが含まれている場合、ランダムにチャンクインデックス（`0` 〜 `chunkCount - 1`）を選択し、対応する JSON を `await import(...)` します。

## 設計上の決定事項 (ADR)

### 決定: クライアント側での静的チャンク分割の採用
- **背景**: 当初は190万語規模のデータを1つのJSONに書き戻していたため、ファイルサイズが数十MBに肥大化し、ブラウザのパース負荷が異常に高くなりました。
- **代替案**: サーバーサイドAPIによるオンデマンド取得。しかし、静的ホスティング（Cloudflare Pages / Static Export）のメリットを失うことになります。
- **選定したアプローチ**: 3,000語ずつの静的チャンク分割。ビルド時にNext.jsがJSONファイルを別ファイルとして出力するため、Static Export でも完璧に動作し、かつクライアントは常に数百KB以内の転送・パースで済むようになります。
