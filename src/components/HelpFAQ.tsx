"use client";

import React, { useState } from "react";
import KeyboardDiagram from "./KeyboardDiagram";
import GameButton from "./GameButton";
import FairyScreenLayout from "./FairyScreenLayout";

interface HelpFAQProps {
  onBackToTitle: () => void;
}

type TabType = "ABOUT_AZIK" | "GAME_RULES" | "CUSTOM_RULES" | "FAQ" | "CHANGELOG";

const CHANGELOG = [
  {
    version: "v1.4.0",
    date: "2026-06-18",
    items: [
      "入力モード制御を刷新",
      "ステージを整理",
      "SNS(X)シェアを改善",
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-06-17",
    items: [
      "入力と変換規則の改善",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-06-16",
    items: [
      "実戦、お題ステージで AZIK キー入力強制モード無効化",
      "AZIK 入力により省力化できたキー数（SAVED KEYS）の算出とリザルト画面への表示",
      "タイピング中の全スコア統計のリアルタイム表示機能を追加",
      "X（Twitter）でのシェア時のツイート文面、ハッシュタグ（#AZIK_Fairy）、スコア表示順の調整",
    ],
  },
  {
    version: "v1.1.1",
    date: "2026-06-16",
    items: [
      "「ゅ」入力に関する問題を修正",
      "X（Twitter）でシェアした際に OGP 画像が表示されない問題を修正",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-06-16",
    items: [
      "入力不可能な問題の修正",
      "「外来語拡張 [TGI/DCI/TGU]」レッスンを追加",
      "ゲーム画面に音声 ON/OFF ボタンを追加",
      "いくつかの画面でキーボード操作に対応",
      "実践レッスンから AZIK ショートカット不要の単語を除外",
      "その他軽微なUIの修正",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-06-14",
    items: [
      "初回リリース",
      "AZIK 辞書エンジン、各種レッスン",
      "カスタムキー設定、厳格モード、音声フィードバック",
    ],
  },
];

export default function HelpFAQ({ onBackToTitle }: HelpFAQProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ABOUT_AZIK");

  const getFairyMessage = () => {
    switch (activeTab) {
      case "ABOUT_AZIK":
        return "AZIKは、いつものローマ字キーのままで入力速度を爆速にする魔法のキー配列だよ！✨";
      case "GAME_RULES":
        return "強制モードでは、AZIKの短縮キー以外は妖精の魔法でシャットアウトしちゃうからね！🧚‍♀️";
      case "CUSTOM_RULES":
        return "自分のこだわり配列があるなら、OPTION画面から自由にカスタマイズしてオッケー！💖";
      case "FAQ":
        return "何か気になることがあるなら、ここで確認してみてね！👀";
      case "CHANGELOG":
        return "アップデートで何が変わったか気になる？ここでチェックしてね！📋";
      default:
        return "アタシと一緒にAZIKを完全マスターしちゃお！💎✨";
    }
  };

  return (
    <FairyScreenLayout fairy={{ message: getFairyMessage(), emotion: "idle" }}>
      <div className="flex-1 flex flex-col gap-4">
      <h2 className="text-2xl md:text-3xl font-bold text-center animate-pulse tracking-widest border-b-2 border-green-500 pb-2 w-full font-pixel">
        = GAME MANUAL =
      </h2>

      {/* タブ切り替え */}
      <div className="flex flex-wrap gap-2 w-full border-b border-green-900 pb-4 justify-center">
        {(
          [
            { id: "ABOUT_AZIK", label: "ABOUT AZIK" },
            { id: "GAME_RULES", label: "PLAY RULES" },
            { id: "CUSTOM_RULES", label: "CUSTOM MAP" },
            { id: "FAQ", label: "FAQ" },
            { id: "CHANGELOG", label: "CHANGELOG" },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-pixel font-bold border-2 transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
              activeTab === tab.id
                ? "bg-green-500 text-black border-green-500"
                : "bg-zinc-800 text-green-400 border-zinc-700 hover:border-green-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* コンテンツエリア */}
      <div className="w-full bg-zinc-950 border-2 border-green-500 p-6 rounded-md min-h-[280px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] text-zinc-300 font-sans text-sm leading-relaxed overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-zinc-950">
        
        {activeTab === "ABOUT_AZIK" && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-green-400">■ AZIK（エイジック）ってなに？</h3>
            <p>
              AZIKは、木村清氏が考案したQWERTY配列ベースの拡張ローマ字入力方式です。<strong>「日本語のよく使う打鍵パターンを極限まで短縮した」</strong>設計で、通常のローマ字比で打鍵数を約30%削減できます。
            </p>
            <p>
              普段のローマ字入力のスキルをそのまま活かしながら、一部のキーを置き換えるだけで、タイピング速度が爆速になります！
            </p>

            <h4 className="font-bold text-green-400 mt-2">✨ 代表的な短縮ルール</h4>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-xs">
              <li><strong>撥音拡張（〜ん）</strong>: 母音キーの「1つ下のキー」を押すだけで入力可能！<br />(例：「かん」➔ <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">kz</code>、「しん」➔ <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">sk</code>)</li>
              <li><strong>二重母音短縮</strong>: 母音キーの「隣のキー」などを押すだけで二重母音を短縮！<br />(例：「かい」➔ <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">kq</code>、「こう」➔ <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">kp</code>)</li>
              <li><strong>「っ」と「ん」の単打</strong>: 「っ」は <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">[;]</code> 、「ん」は <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">[q]</code> で一発入力！</li>
              <li><strong>拗音2打鍵短縮</strong>: シャ行は <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">[x]</code>、チャ行は <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">[c]</code> を子音として使う！<br />(例：「しゃ」➔ <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">xa</code>、「ちゅ」➔ <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">cu</code>)</li>
            </ul>

            <h4 className="font-bold text-green-400 mt-2">⌨️ キーボード上の対応関係</h4>
            <p className="text-xs text-zinc-400">撥音拡張キー（各母音の1段下）と二重母音キー（各母音の隣）の位置：</p>
            <div className="overflow-x-auto">
              <KeyboardDiagram
                activeKeys={["z", "k", "j", "d", "l", "q", "h", "w", "p", ";"]}
                layout="US"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-300">
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                <span className="text-green-400 font-bold block mb-1">撥音拡張（〜ん）</span>
                <span>あん=Z / いん=K / うん=J</span><br />
                <span>えん=D / おん=L</span>
              </div>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                <span className="text-green-400 font-bold block mb-1">二重母音 / 単打</span>
                <span>あい=Q / えい=H / うう=W / おう=P</span><br />
                <span>ん単体=[Q] / っ単体=[;]</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 mt-1">
              参考: <a href="https://note.com/actbemu/n/n74f1c04c9a2e" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">AZIK解説 by 木村清氏（note）</a>
            </p>
          </div>
        )}

        {activeTab === "GAME_RULES" && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-green-400">■ 遊び方と入力強制モード</h3>
            <p>
              このゲームは、AZIKの各ルールを <strong>基礎から達人まで順にクリア</strong>していくステップレッスン方式です。
            </p>
            
            <h4 className="font-bold text-green-400 mt-2">🛡 強制スルーモード (STRICT) - デフォルト</h4>
            <p>
              本来AZIKで打てる文字（例：「かん」に対する <code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">kz</code>）に対して、通常のローマ字（<code className="text-green-300 bg-zinc-800 px-1 rounded font-mono">kan</code>）を入力しようとすると、<strong>キーダウンが無視（無効化）されます</strong>。
            </p>
            <p>
              この無視された打鍵はミス数や打鍵速度のペナルティにはなりませんが、画面が揺れ、正しいAZIKキーを押すまでゲームが進まなくなります。<br />
              <strong>「絶対に通常入力をさせない」</strong>ことで、頭と指に強制的にAZIKを覚え込ませるスパルタ仕様です！
            </p>

            <h4 className="font-bold text-green-400 mt-2">⚠️ 通常ミスモード (NORMAL)</h4>
            <p>
              オプション（OPTIONS）から通常ミスモードに切り替えることも可能です。この場合、通常のローマ字入力も許容されますが、押し間違いのキーを入力した時はしっかりと「ミス」としてカウントされます。
            </p>
          </div>
        )}

        {activeTab === "CUSTOM_RULES" && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-green-400">■ カスタムルール設定について</h3>
            <p>
              自分独自のキー設定や、他の拡張ローマ字配列を使っている方のために、本ゲームではキーマッピングを自由にカスタマイズ可能です。
            </p>
            <p>
              タイトル画面の <strong>OPTIONS（設定画面）</strong> に行き、「KEY CONFIG」セクションから設定できます。
            </p>

            <h4 className="font-bold text-green-400 mt-2">1. 個別フォーム（クリックでキャプチャ）</h4>
            <p>
              「単音 ん」「単音 っ」「長音 ー」の3キーをGUI で変更できます。<br />
              キーキャップアイコンをクリックすると黄色くなってキー入力待ち状態になり、そのまま登録したいキーを押すと即座に設定されます。<strong>ESC</strong> でキャンセルできます。
            </p>

            <h4 className="font-bold text-green-400 mt-2">2. JSONテキスト一括入力</h4>
            <p>
              設定用のJSONテキストを直接貼り付けて一括適用できます。複数キー対応（配列形式）です。
            </p>

            <h4 className="font-bold text-green-400 mt-2">3. TSV / SKKインポート</h4>
            <p>
              Google日本語入力のローマ字表（TSV）や macSKK の <kbd className="bg-zinc-800 px-1 border border-zinc-700">kana-rule.conf</kbd> をそのまま貼り付けてインポートできます。
              AZIK関連のキー定義（ん・っ・撥音拡張など）のみを自動で抽出して現在の設定にマージします。
            </p>

            <p className="text-xs opacity-75 mt-2 bg-zinc-900 p-2 border border-zinc-800 rounded">
              ※「〜あん」のキー（例: z➔y）を変更すると、対応する「かん(ky)」「さん(sy)」といったすべての子音との組み合わせルールも<strong>自動で芋づる式に書き換えられます</strong>。
            </p>
          </div>
        )}

        {activeTab === "FAQ" && (
          <div className="flex flex-col gap-4 text-xs">
            <div>
              <h4 className="font-bold text-green-400">Q. キーを押しても全く進まない文字がある！</h4>
              <p className="pl-3 opacity-90 mt-1">
                A. それは<strong>AZIK強制モード</strong>が作動しているサインです！<br />
                画面の下部にある「💡 AZIK FAIRY HINT」を確認し、二重母音や撥音などの短縮キー（例：「ん」なら <kbd className="bg-zinc-800 px-1 border border-zinc-700">q</kbd>）を押してください。
              </p>
            </div>
            
            <div className="border-t border-zinc-900 pt-3">
              <h4 className="font-bold text-green-400">Q. 設定したカスタムルールが消えてしまう</h4>
              <p className="pl-3 opacity-90 mt-1">
                A. 設定はブラウザの <strong>LocalStorage</strong> に自動で保存されます。<br />
                シークレットモードや、ブラウザのクッキー/ストレージ消去を行うとリセットされることがあります。
              </p>
            </div>

            <div className="border-t border-zinc-900 pt-3">
              <h4 className="font-bold text-green-400">Q. スマホやタブレットでも遊べる？</h4>
              <p className="pl-3 opacity-90 mt-1">
                A. 本作はキーボードによる物理的なタイピング入力を前提として設計されています。物理キーボードを接続したPCやMacでのプレイを強く推奨します。
              </p>
            </div>

            <div className="border-t border-zinc-900 pt-3">
              <h4 className="font-bold text-green-400">Q. このアプリはオープンソースですか？</h4>
              <p className="pl-3 opacity-90 mt-1">
                A. はい、本作はオープンソースソフトウェア（GNU GPL v3.0）です。ソースコードはGitHubで公開されており、誰でも開発への参加や改変を行うことができます。また、外部辞書データとして Mozc OSS 辞書および SKK-JISYO.L を活用しています。<br />
                🔗 <a href="https://github.com/AquiTCD/azik-fairy" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">GitHub - AquiTCD/azik-fairy</a>
              </p>
            </div>
          </div>
        )}

        {activeTab === "CHANGELOG" && (
          <div className="flex flex-col gap-6 text-xs">
            {CHANGELOG.map(release => (
              <div key={release.version}>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-pixel font-bold text-green-400 text-sm">{release.version}</span>
                  <span className="text-zinc-500 font-sans">{release.date}</span>
                </div>
                <ul className="pl-3 flex flex-col gap-1">
                  {release.items.map((item, i) => (
                    <li key={i} className="flex gap-2 opacity-90 font-sans">
                      <span className="text-green-600 flex-shrink-0">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

      </div>

      <GameButton variant="danger" size="sm" onClick={onBackToTitle}>
        BACK TO TITLE
      </GameButton>
      </div>{/* 左カラム end */}
    </FairyScreenLayout>
  );
}
