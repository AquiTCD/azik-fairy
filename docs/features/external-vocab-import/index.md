---
type: Feature
feature: external-vocab-import
title: 外部辞書データインポートと動的チャンク配信
status: draft
tags: [vocab, dictionary, import, chunking, nextjs]
---

# 外部辞書データインポートと動的チャンク配信 (external-vocab-import)

> アプリケーションの語彙数を爆発的に増やしつつ、クライアントのパフォーマンスを極限まで保つための、外部辞書インポートシステムおよび静的チャンク分割・動的ロード設計です。

## ドキュメント一覧

- [概要 (Overview)](./overview.md) — 外部辞書（Mozc, SKK, ギャル語等）のインポート目的、仕組み、およびライセンス整合性に関する解説です。
- [技術設計 (Technical Design)](./design.md) — インポートスクリプトのパース・フィルタリング・シャッフル処理の流れ、およびNext.js側でのランダムな動的チャンク分割のデータフローとアーキテクチャ解説です。
- [利用ガイド (Guide)](./guide.md) — 各種辞書データのダウンロードから、インポートスクリプトの実行方法、トラブルシューティングに関する手順解説です。
