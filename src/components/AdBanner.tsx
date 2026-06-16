import React from "react";
import { Ad } from "@/data/adData";

interface AdBannerProps {
  ads: Ad[];
  layout?: "horizontal" | "vertical";
}

export default function AdBanner({ ads, layout = "horizontal" }: AdBannerProps) {
  const padding   = layout === "horizontal" ? "p-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]" : "p-3";
  const innerList = layout === "horizontal"
    ? "flex justify-center gap-4 text-xs flex-wrap"
    : "flex flex-col gap-2 text-xs";

  return (
    <div className={`w-full ${padding} bg-zinc-950 border-2 border-dashed border-green-800 rounded text-center`}>
      <span className="text-[10px] text-zinc-500 block mb-2 font-bold tracking-wider">💡 PICK UP FOR TYPISTS:</span>
      <div className={innerList}>
        {ads.map(ad => (
          <a
            key={ad.url + ad.label}
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:underline font-bold"
          >
            {ad.emoji} {ad.label} ➔
          </a>
        ))}
      </div>
    </div>
  );
}
