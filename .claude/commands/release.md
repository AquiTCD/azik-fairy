---
description: azik-fairy のバージョン管理とリリース準備
---

# Release Command — azik-fairy

このコマンドはバージョン番号の決定・ファイル更新・コミット・PR/タグ作成までの一連のリリースフローを担う。

## 1. バージョン番号の決定

セマンティックバージョニング（MAJOR.MINOR.PATCH）に従う。

| 変更の種類 | バージョン |
|-----------|-----------|
| 新機能追加（後方互換） | MINOR（x.1.x） |
| バグ修正のみ | PATCH（x.x.1） |
| 破壊的変更 | MAJOR（1.x.x） |

現在のバージョンは `package.json` の `version` フィールドで確認する。

## 2. 更新対象ファイル（4箇所）

### `CHANGELOG.md`
ファイル先頭に新セクションを追加（**source of truth**）：
```markdown
## [vX.Y.Z] - YYYY-MM-DD

- 変更点1
- 変更点2
```

### `package.json`
```json
"version": "X.Y.Z"
```

### `src/app/page.tsx`
タイトル画面フッターのバージョン文字列：
```tsx
<p>© 2026 AquiTCD / azik-fairy &nbsp;|&nbsp; vX.Y.Z</p>
```

### `src/components/HelpFAQ.tsx`
`CHANGELOG` 配列の先頭に新エントリを追加（`CHANGELOG.md` と同内容）：
```ts
const CHANGELOG = [
  {
    version: "vX.Y.Z",
    date: "YYYY-MM-DD",
    items: [
      "変更点1",
      "変更点2",
    ],
  },
  // ...既存エントリ
];
```

リリースノートの粒度は「エンドユーザーが読む」前提で丸める。実装詳細は git log に任せる。

## 3. ビルド確認

```bash
npm run build
```

エラーがなければ次のステップへ。

## 4. コミット

`git-commit-craft` スキルに従い、version bump は単独コミットにまとめる：

```
chore: bump version to vX.Y.Z
```

このコミットを version bump の機能変更と同じ PR に含める（PR マージ = リリース）。

## 5. PR の作成

ブランチを push して PR を作成する：

```bash
git push -u origin <branch>

gh pr create \
  --title "feat: <概要> (vX.Y.Z)" \
  --body "$(cat <<'EOF'
## Summary

- 変更点1
- 変更点2

## Test plan

- [ ] `npm run build` 成功
- [ ] `npx vitest run` 全件 green
- [ ] TypeScript エラーなし（`tsc --noEmit`）
- [ ] バージョン表記が vX.Y.Z に統一されていることを確認
- [ ] マージ後に `git tag vX.Y.Z && git push origin vX.Y.Z` → `gh release create` を実行

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 6. タグ → リリース（PR マージ後）

PR のマージ後に実行：

```bash
# タグを打つ
git tag vX.Y.Z
git push origin vX.Y.Z

# GitHub Release を作成（CHANGELOG.md の該当バージョンセクションを抽出）
gh release create vX.Y.Z \
  --title "vX.Y.Z" \
  --notes "$(awk '/^## \[vX\.Y\.Z\]/{found=1; next} found && /^## /{exit} found{print}' CHANGELOG.md)"
```

## 備考

- PR = リリース前提のフロー。version bump は機能 PR に含め、別 PR は作らない。
- タグは PR マージ後の main に対して打つ。マージ前のブランチに打たない。
