"use client";

import React from "react";
import ChromaKeyCanvas from "./ChromaKeyCanvas";

export type FairyEmotion = "idle" | "excited" | "happy" | "warning" | "proud" | "perfect";

interface FairyHelperProps {
  message: string;
  emotion: FairyEmotion;
}

const EMOTION_IMAGE: Record<FairyEmotion, string> = {
  idle:    "/images/fairy_base.png",
  excited: "/images/fairy_excited.png",
  happy:   "/images/fairy_happy.png",
  warning: "/images/fairy_warning.png",
  proud:   "/images/fairy_proud.png",
  perfect: "/images/fairy_perfect.png",
};

const FAIRY_ANIMATION: Record<FairyEmotion, string> = {
  idle:    "animate-[float_3s_ease-in-out_infinite]",
  excited: "animate-[float_1.5s_ease-in-out_infinite]",
  happy:   "animate-[smallbounce_0.6s_ease-in-out_infinite]",
  warning: "animate-[wiggle_0.1s_ease-in-out_infinite]",
  proud:   "animate-pulse drop-shadow-[0_0_16px_rgba(234,179,8,0.8)]",
  perfect: "animate-[float_1.5s_ease-in-out_infinite] drop-shadow-[0_0_24px_rgba(250,204,21,1)]",
};

const BUBBLE_COLOR: Record<FairyEmotion, string> = {
  idle:    "border-green-500 text-green-300",
  excited: "border-cyan-400 text-cyan-300",
  happy:   "border-yellow-400 text-yellow-300",
  warning: "border-red-500 text-red-400",
  proud:   "border-amber-400 text-amber-300",
  perfect: "border-yellow-300 text-yellow-200",
};

export default function FairyHelper({ message, emotion }: FairyHelperProps) {
  return (
    <div className="flex flex-col items-center gap-3 w-full select-none">
      {/* 吹き出し */}
      <div
        className={`relative w-full p-4 bg-zinc-900 border-4 border-double rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[64px] flex items-center justify-center text-center transition-colors duration-200 ${BUBBLE_COLOR[emotion]}`}
      >
        <p className="text-xs md:text-sm font-bold leading-relaxed tracking-wide font-sans whitespace-pre-line">
          {message}
        </p>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-r-4 border-b-4 border-double border-inherit rotate-45" />
      </div>

      {/* 妖精キャラクター */}
      <div className={`relative w-full mt-2 transition-all duration-300 ${FAIRY_ANIMATION[emotion]}`}>
        <ChromaKeyCanvas
          src={EMOTION_IMAGE[emotion]}
          alt={`AZIK Fairy - ${emotion}`}
          className="w-full"
        />

        {/* ミス時の衝撃波リング */}
        {emotion === "warning" && (
          <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping opacity-60" />
        )}
        {/* パーフェクト時の星エフェクト */}
        {emotion === "perfect" && (
          <div className="absolute inset-0 border-2 border-yellow-300 rounded-full animate-ping opacity-50" />
        )}
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes smallbounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes wiggle {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25%       { transform: translateX(-2px) rotate(-1deg); }
          75%       { transform: translateX(2px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
