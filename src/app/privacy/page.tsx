import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | AZIK-Fairy",
  description: "AZIK-Fairy のプライバシーポリシーです。",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 font-sans px-6 py-12 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-green-400 font-pixel tracking-wider">
          PRIVACY POLICY
        </h1>
        <p className="text-xs text-zinc-500">最終更新: 2026-06-19</p>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-green-300 border-b border-zinc-800 pb-1">
            1. 収集する情報について
          </h2>
          <p className="text-sm leading-relaxed">
            本サービス（AZIK-Fairy）はサーバーを持たない静的Webアプリケーションです。
            ユーザーのプレイ設定・スコア・進捗データは、<strong>お使いのブラウザのLocalStorageにのみ保存</strong>され、外部サーバーへの送信は一切行いません。
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-green-300 border-b border-zinc-800 pb-1">
            2. Amazonアソシエイト・プログラム
          </h2>
          <p className="text-sm leading-relaxed">
            本サイトはAmazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである「Amazonアソシエイト・プログラム」の参加者です。
            Amazonに関連したCookieがお使いのブラウザに保存される場合があります。
            詳細は <a href="https://www.amazon.co.jp/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Amazon のプライバシー規約</a> をご参照ください。
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-green-300 border-b border-zinc-800 pb-1">
            3. X（Twitter）シェア機能について
          </h2>
          <p className="text-sm leading-relaxed">
            結果画面の「POST RESULT」ボタンを押すと、ゲームスコア（WPM・正確率・ランクなど）がURLパラメータとして X（Twitter）のサーバーへ送信されます。
            この操作は任意であり、ボタンを押さない限りデータは送信されません。
            X による情報の取り扱いについては <a href="https://twitter.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">X のプライバシーポリシー</a> をご確認ください。
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-green-300 border-b border-zinc-800 pb-1">
            4. フィードバックフォームについて
          </h2>
          <p className="text-sm leading-relaxed">
            フィードバックの収集にはGoogleフォームを使用しています。フォームに入力・送信した情報はGoogleのサーバーに保存されます。
            Googleによる情報の取り扱いについては <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Googleのプライバシーポリシー</a> をご確認ください。
            フォームへのアクセスは任意であり、強制されるものではありません。
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-green-300 border-b border-zinc-800 pb-1">
            5. お問い合わせ
          </h2>
          <p className="text-sm leading-relaxed">
            本ポリシーに関するお問い合わせは、
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeX8QOLxetOJ9GgAiByaZGesA_EExHvHs07xmdX1gttuHsvVQ/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline"
            >
              フィードバックフォーム
            </a> よりご連絡ください。
          </p>
        </section>

        <div className="pt-4 border-t border-zinc-800">
          <Link href="/" className="text-sm text-green-600 hover:text-green-400 hover:underline font-pixel">
            ← BACK TO TITLE
          </Link>
        </div>
      </div>
    </main>
  );
}
