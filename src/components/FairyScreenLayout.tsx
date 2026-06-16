"use client";

import React from "react";
import FairyHelper, { FairyEmotion } from "./FairyHelper";

interface FairyScreenLayoutProps {
  fairy: { message: string; emotion: FairyEmotion };
  children: React.ReactNode;
  /** Extra content rendered below FairyHelper in the fairy column */
  fairySlot?: React.ReactNode;
  /** Border accent color. Default: "green" */
  accent?: "green" | "yellow";
  /** true → max-w-6xl p-4 lg:p-6, false (default) → max-w-5xl p-6 md:p-8 */
  wide?: boolean;
  /** Extra className on the outer wrapper */
  className?: string;
  /** Extra className on the fairy column */
  fairyColClassName?: string;
}

export default function FairyScreenLayout({
  fairy,
  children,
  fairySlot,
  accent = "green",
  wide = false,
  className = "",
  fairyColClassName = "",
}: FairyScreenLayoutProps) {
  const borderColor = accent === "yellow" ? "border-yellow-400" : "border-green-500";
  const sizeClass   = wide
    ? "max-w-6xl p-4 lg:p-6"
    : "max-w-5xl p-6 md:p-8";

  return (
    <div className={`flex flex-col lg:flex-row-reverse gap-4 lg:gap-6 w-full ${sizeClass} bg-zinc-900 border-4 border-double ${borderColor} rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-green-400 ${className}`}>
      {/* 右カラム: 妖精 */}
      <div className={`w-56 xl:w-64 flex-shrink-0 mx-auto lg:mx-0 ${fairyColClassName}`}>
        <FairyHelper message={fairy.message} emotion={fairy.emotion} />
        {fairySlot}
      </div>
      {/* 左カラム: コンテンツ */}
      {children}
    </div>
  );
}
