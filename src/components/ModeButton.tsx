"use client";

import React from "react";

type ModeColor = "green" | "yellow" | "sky" | "purple";

interface ModeButtonProps {
  color: ModeColor;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const SCHEME: Record<ModeColor, { text: string; sub: string; border: string; hover: string; focus: string }> = {
  green:  { text: "text-green-300",  sub: "text-green-500",  border: "border-green-500",  hover: "hover:bg-green-950",  focus: "focus:bg-green-950  focus:ring-green-400"  },
  yellow: { text: "text-yellow-300", sub: "text-yellow-500", border: "border-yellow-500", hover: "hover:bg-yellow-950", focus: "focus:bg-yellow-950 focus:ring-yellow-400" },
  sky:    { text: "text-sky-300",    sub: "text-sky-500",    border: "border-sky-500",    hover: "hover:bg-sky-950",    focus: "focus:bg-sky-950    focus:ring-sky-400"    },
  purple: { text: "text-purple-300", sub: "text-purple-500", border: "border-purple-500", hover: "hover:bg-purple-950", focus: "focus:bg-purple-950 focus:ring-purple-400" },
};

export default function ModeButton({ color, title, subtitle, onClick }: ModeButtonProps) {
  const s = SCHEME[color];
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center gap-1 font-pixel font-bold tracking-wider rounded bg-zinc-900 ${s.text} border-4 ${s.border} ${s.hover} ${s.focus} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 px-6 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 cursor-pointer`}
    >
      <span className="text-xl">{title}</span>
      <span className={`text-[10px] font-sans font-normal ${s.sub}`}>{subtitle}</span>
    </button>
  );
}
