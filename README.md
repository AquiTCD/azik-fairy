<p align="center">
  <img src="public/images/fairy_idle.png" width="240" alt="AZIK Fairy" />
</p>

<h1 align="center">AZIK Fairy (AZIKタイピング養成妖精)</h1>

<p align="center">
  <strong>ギャル妖精と一緒に、日本語ローマ字拡張入力「AZIK」を爆速でマスターするタイピング練習ゲーム</strong>
</p>

<p align="center">
  <a href="#license">
    <img src="https://img.shields.io/badge/license-GPL--3.0-blue.svg" alt="License GPL-3.0" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg" alt="Tailwind CSS v4" />
</p>

---

## 🧚‍♀️ 概要 (About)

**AZIK Fairy** は、日本語の高速なローマ字入力方式である **AZIK** の習得を全力でサポートする、Next.js製のタイピング練習ゲームです。
モチベーションを爆上げしてくれる「ギャル妖精」が画面上でプレイヤーをナビゲートし、ゲームの進捗やスコアに応じて応援やフィードバックをくれます。

AZIKの初心者から上級者まで、ステップバイステップで練習できるステージ構成と、入力データをリアルタイムで分析する機能を備えています。

---

## 🌟 主な機能 (Features)

1. **リアルタイムAZIK率分析**
   - プレイヤーの打鍵を監視し、どれだけAZIKの短縮キーを活用できたかを「AZIK度 (AZIK Ratio)」としてリアルタイムで算出・表示します。

2. **レベル別の段階的ステージ構成**
   - AZIKの導入レベル（互換キー）から、二重母音短縮、特殊キー拡張（こと/もの/する/です/ます）、さらには外来語拡張まで、順序立てて学べるステージを用意しています。

3. **自由なキーカスタマイズ & 設定**
   - JIS/USキーボード配列の切り替えはもちろん、撥音（ん）の代替キー設定、促音（っ）や長音（ー）などのAZIKパターンのカスタマイズに対応しています。

4. **豊富な語彙とインポート機能**
   - 標準的な例文に加え、Mozc OSS辞書やSKK辞書からインポートされた数万語規模の本格的な語彙ステージを搭載しています。

5. **X (Twitter) シェア & OGP中継**
   - Cloudflare Pages Functions を利用したエッジでのクローラー中継機能を実装。Xでスコアをポストした際に、自分のリザルトが反映された動的なOGP画像付きでシェアすることができます。

---

## 🛠 技術スタック (Tech Stack)

- **フレームワーク**: Next.js 16 (App Router / Static Export 対応)
- **スタイリング**: Tailwind CSS v4
- **テストフレームワーク**: Vitest
- **インフラ**: Cloudflare Pages / Pages Functions

---

## 🚀 開発の始め方 (Getting Started)

### 前提条件
- Node.js (v18以上推奨)
- npm または pnpm / yarn

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動
ローカル環境でゲームを起動し、ブラウザで確認します。
```bash
npm run dev
```
起動後、 [http://localhost:3000](http://localhost:3000) にアクセスしてください。

### 3. テストの実行
Vitestを使用したユニットテストを実行します。
```bash
npm test
```

### 4. 本番用ビルドの作成
静的ファイルをビルドします。
```bash
npm run build
```

---

## 📂 ディレクトリ構成 (Directory Structure)

```text
azik-fairy/
├── src/
│   ├── app/             # Next.js ページコンポーネント (Home)
│   ├── components/      # UI・タイピングゲームコンポーネント (TypingGame, Settings等)
│   ├── data/            # ステージ辞書データ、アフィリエイト広告データ
│   │   └── stages/      # 各レベルごとのステージJSONファイル
│   ├── types/           # 型定義ファイル (GameStats, Settings等)
│   └── utils/           # タイピング判定、スコア・AZIK率計算などのロジック
├── scripts/             # 語彙インポートや整合性検証用の各種スクリプト
├── functions/           # Cloudflare Pages 用の OGP 中継Function (share.ts)
├── public/              # 静的アセット (妖精画像等のグラフィックス)
└── LICENSE              # GPL v3 ライセンスファイル
```

---

## 📝 スクリプトの利用方法 (Development Scripts)

### 外部語彙のインポート
SKKやMozcなどの辞書ファイルから、AZIK練習用のステージデータを生成するスクリプトです。

```bash
# 例: Mozc OSS辞書からのインポート
cat path/to/dictionary_oss/dictionary*.txt | npx tsx scripts/import-external-words.ts mozc

# 例: カスタムTSVファイルからのインポート
npx tsx scripts/import-external-words.ts custom path/to/vocabulary.tsv
```

### ステージ整合性のチェック
ステージデータが指定されたAZIKレベルの制約を満たしているか、逸脱した漢字や読みが含まれていないかをチェックします。
```bash
npx tsx scripts/check-level-violations.ts
```

---

## 📄 ライセンス (License)

本プロジェクトは **GNU General Public License v3.0 (GPLv3)** のもとで公開されています。詳細については、[LICENSE](LICENSE) ファイルを参照してください。

---

## 👤 開発者 / クレジット (Credits)

- 開発: **[AquiTCD](https://github.com/AquiTCD)**
- AZIK (ローマ字入力方式): 木村 清 氏 考案
