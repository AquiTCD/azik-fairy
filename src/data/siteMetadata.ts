import type { Metadata } from "next";

const SITE_TITLE = "AZIK-Fairy｜AZIK入力養成妖精（タイピング練習）";
const SITE_DESCRIPTION =
  "日本語拡張入力AZIK習得のためのタイピング練習ゲーム。自由に打てるトレーニングモードから、本番仕様のチャレンジモードまで、タイピングゲームのように楽しみながら妖精がサポートします。";

export const metadata: Metadata = {
  metadataBase: new URL("https://azik-fairy.solunita.net"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://azik-fairy.solunita.net/",
    siteName: "AZIK-Fairy",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/images/og_image.png",
        width: 1200,
        height: 630,
        alt: "AZIK-Fairy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/images/og_image.png"],
  },
  alternates: {
    canonical: "https://azik-fairy.solunita.net/",
  },
  icons: {
    icon: [
      { url: "/images/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/images/favicon.ico",
    apple: { url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/manifest.json",
};
