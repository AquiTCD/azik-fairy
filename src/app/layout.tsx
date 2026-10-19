import { Noto_Sans_JP, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { videoGameJsonLd } from "@/data/structuredData";

export { metadata } from "@/data/siteMetadata";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700"],
  variable: "--font-noto",
  preload: false,
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${pressStart.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-zinc-950 text-green-400 font-sans selection:bg-green-500 selection:text-black">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
