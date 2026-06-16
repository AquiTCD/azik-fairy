#!/usr/bin/env python3
"""
AzikT データを読み込んでステージ JSON の words を全語句で更新するスクリプト。

Usage: python3 scripts/import-azikt-words.py
"""

import os
import re
import json

AZIKT_DATA_DIR = ".scratch/azikt100/data"
STAGES_DIR = "src/data/stages"

# 各ステージに対応する AzikT ソースファイル
STAGE_SOURCES = {
    "lev1-sokuon":           ["x0101tt.txt"],
    "lev1-hatsuon-q":        ["x0102Q.txt"],
    "lev1-sha":              ["x0103X.txt"],
    "lev1-cha":              ["x0104C.txt"],
    "lev1-summary":          ["x0109.txt"],
    "lev2a-an-z":            ["x0201Z2.txt", "x0301N2.txt"],  # Z + N互換 (同 Lev2a)
    "lev2a-in-k":            ["x0202K2.txt"],
    "lev2a-un-j":            ["x0203J2.txt"],
    "lev2a-en-d":            ["x0204D2.txt"],
    "lev2a-on-l":            ["x0205L2.txt"],
    "lev2a-summary":         ["x0209.txt"],
    "lev2b-ai-q":            ["x0211Q2.txt"],
    "lev2b-uu-h":            ["x0212H2.txt"],
    "lev2b-ei-w":            ["x0213W2.txt"],
    "lev2b-ou-p":            ["x0214P2.txt"],
    "lev2b-summary":         ["x0219.txt"],
    "lev3a-chouon-colon":    ["x03010bo.txt"],
    "lev3a-g-youon":         ["x0302G2.txt"],
    "lev3a-summary":         ["x0309.txt"],
    "lev3b-zc-zf-za-ze":    ["x0311ZC.txt", "x0312ZF.txt"],
    "lev3b-zv-zx-zai-zei":  ["x0321ZV.txt", "x0322ZX.txt"],
    "lev3b-sf-ss-sai-sei":  ["x0331SF.txt", "x0332SS.txt"],
    "lev3b-summary":         ["x0349.txt"],
    "lev4-special-ext-1":   ["x0401word1.txt"],
    "lev4-summary":          ["x0401word2.txt"],
    "practice-words-1":      ["x0229.txt"],      # Lev2 まとめ全語
    "practice-words-2":      ["x0399.txt"],      # Lev3 まとめ全語
    "practice-sentences":    ["x0499all.txt"],   # 全レベルまとめ
    "practice-long-text":    [],                 # 桃太郎等は変更しない
}

# 有効なひらがな文字集合 (ー長音含む)
HIRAGANA = set(
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"
    "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ"
    "ぁぃぅぇぉっゃゅょゎ"
    "ー"
)


def parse_azikt_file(filepath: str) -> list[dict]:
    """SHIFT_JIS エンコードの AzikT ファイルから kana/kanji ペアを抽出する。"""
    try:
        with open(filepath, 'rb') as f:
            content = f.read().decode('shift_jis', errors='replace')
    except FileNotFoundError:
        print(f"  WARNING: file not found: {filepath}")
        return []

    in_data = False
    entries = []
    seen_kana = set()

    for line in content.split('\n'):
        line = line.rstrip('\r')

        if line.strip() == '[data]':
            in_data = True
            continue
        if line.strip().startswith('[') and in_data:
            break  # 次のセクション開始 = [data] 終了

        if not in_data:
            continue
        if not line.strip() or line.strip().startswith(';') or line.strip().startswith('#'):
            continue

        # タブで分割 (シングルまたはダブルタブ)
        parts = re.split(r'\t+', line.rstrip())
        if len(parts) < 2:
            continue

        kana = parts[0].strip()
        # 末尾の []AZIK注釈を除去 (例: "かも[KM]" → "かも")
        kanji = re.sub(r'\[.*?\]', '', parts[-1].strip()).strip()
        if not kanji:
            kanji = kana

        # kana バリデーション: ひらがなと ー のみ許可、最低2文字
        if len(kana) < 2:
            continue
        if not all(c in HIRAGANA for c in kana):
            continue

        # 重複除去
        if kana in seen_kana:
            continue
        seen_kana.add(kana)

        entries.append({"kanji": kanji, "kana": kana})

    return entries


def update_stage_json(stage_id: str, source_files: list[str]) -> None:
    json_path = os.path.join(STAGES_DIR, f"{stage_id}.json")

    if not os.path.exists(json_path):
        print(f"  SKIP: {json_path} not found")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        stage = json.load(f)

    # words を収集
    all_words = []
    seen_kana = set()
    for filename in source_files:
        filepath = os.path.join(AZIKT_DATA_DIR, filename)
        entries = parse_azikt_file(filepath)
        for entry in entries:
            if entry["kana"] not in seen_kana:
                seen_kana.add(entry["kana"])
                all_words.append(entry)

    if not all_words:
        print(f"  SKIP (no words): {stage_id}")
        return

    stage["words"] = all_words

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(stage, f, ensure_ascii=False, indent=2)

    print(f"  {stage_id}: {len(all_words)} words written")


def main():
    print("AzikT → Stage JSON インポート開始\n")

    for stage_id, source_files in STAGE_SOURCES.items():
        if not source_files:
            print(f"  SKIP (no source): {stage_id}")
            continue
        update_stage_json(stage_id, source_files)

    print("\n完了!")


if __name__ == "__main__":
    main()
