# azik-fairy デプロイ・ホスティング手順

本アプリケーションは Next.js の静的エクスポート機能を利用しており、ビルド後の成果物は完全に静的なHTML/CSS/JSで構成されます。そのため、無料の静的ホスティングサービスで簡単に公開できます。

---

## 1. GitHub Pages へのデプロイ（推奨・全自動）

リポジトリに `.github/workflows/deploy.yml` が配置されているため、GitHub Actions を有効にすることで、`main` ブランチにプッシュするだけで自動的にデプロイが行われます。

### 手順
1. GitHub でリポジトリの **Settings** タブを開きます。
2. 左メニューの **Pages** を選択します。
3. **Build and deployment** の項目内の **Source** を `Deploy from a branch` から **`GitHub Actions`** に変更します。
4. これにより、以降の `main` ブランチへのプッシュで自動ビルドとデプロイが走り、`https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます。

---

## 2. Cloudflare Pages へのデプロイ

より高速な配信や、カスタムドメインの設定を行いたい場合は Cloudflare Pages もおすすめです。

### 手順
1. Cloudflare ダッシュボードにログインし、**Workers & Pages** ➔ **Create application** ➔ **Pages** タブを開きます。
2. **Connect to Git** をクリックし、`azik-fairy` のリポジトリを連携します。
3. ビルド設定で以下を入力します：
   - **Framework preset**: `Next.js (Static HTML Export)` または `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Node.js version** (Environment variables): `NODE_VERSION` を `20` に設定
4. **Save and Deploy** をクリックするとビルドが始まり、専用のサブドメインで公開されます。

---

## 3. アフィリエイトID（Amazon）の差し替えについて

タイトル画面とリザルト画面に、AZIK習得に推奨されるキーボードの広告（紹介リンク）を配置しています。
これらのリンクを自身のAmazonアソシエイトIDなどに差し替える場合は、以下のファイルを編集してください。

- **対象ファイル**: `src/app/page.tsx`
- **対象行**:
  - タイトル画面用：267行目付近（`href="https://amzn.to/3F3Y6bH"` 等の `href` 属性）
  - リザルト画面用：373行目付近（`href="https://amzn.to/3F3Y6bH"` 等の `href` 属性）

各 `href` を自身のアフィリエイトリンクまたは製品紹介リンクに書き換えてコミット・プッシュしてください。
