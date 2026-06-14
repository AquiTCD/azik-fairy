import type { Metadata } from "next";
import { DotGothic16, Press_Start_2P } from "next/font/google";
import "./globals.css";

const dotGothic = DotGothic16({
  weight: "400",
  variable: "--font-dot-gothic",
  preload: false,
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

export const metadata: Metadata = {
  title: "azik-fairy | AZIKタイピング養成妖精",
  description: "AZIK入力をゲーム感覚で楽しく、強制モードでスパルタに養成してくれるタイピングゲーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${dotGothic.variable} ${pressStart.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-zinc-950 text-green-400 font-sans selection:bg-green-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
