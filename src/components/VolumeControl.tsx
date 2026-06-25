"use client";

import React, { useRef } from "react";
import { SpeakerHigh, SpeakerLow, SpeakerNone, SpeakerSlash } from "@phosphor-icons/react";
import { SoundThemeName, playPreview } from "@/hooks/useAzikSound";

const DEFAULT_RESTORE_VOLUME = 70;

interface VolumeControlProps {
  volume: number;
  theme: SoundThemeName;
  onVolumeChange: (vol: number) => void;
}

export default function VolumeControl({ volume, theme, onVolumeChange }: VolumeControlProps) {
  const lastNonZeroRef = useRef(volume > 0 ? volume : DEFAULT_RESTORE_VOLUME);

  const SpeakerIcon = volume === 0
    ? SpeakerSlash
    : volume < 40
    ? SpeakerNone
    : volume < 75
    ? SpeakerLow
    : SpeakerHigh;

  const toggleMute = () => {
    if (volume > 0) {
      lastNonZeroRef.current = volume;
      onVolumeChange(0);
    } else {
      const restore = lastNonZeroRef.current || DEFAULT_RESTORE_VOLUME;
      onVolumeChange(restore);
      playPreview(theme, restore);
    }
  };

  const handleSlider = (val: number) => {
    if (val > 0) lastNonZeroRef.current = val;
    onVolumeChange(val);
    playPreview(theme, val);
  };

  return (
    <div className="flex items-center gap-1.5 border border-zinc-700 rounded px-2 py-1.5">
      <button
        onClick={toggleMute}
        title={volume > 0 ? "クリックでミュート" : "クリックでミュート解除"}
        className="text-zinc-400 hover:text-green-400 transition-colors duration-150 shrink-0"
      >
        <SpeakerIcon size={16} weight="bold" />
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={volume}
        onChange={e => handleSlider(Number(e.target.value))}
        className="w-16 accent-green-400 cursor-pointer"
      />
      <span className="text-[10px] font-pixel text-zinc-400 w-6 text-right shrink-0">
        {volume === 0 ? "M" : volume}
      </span>
    </div>
  );
}
