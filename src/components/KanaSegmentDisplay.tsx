import { AzikSegment } from "@/data/azikRules";

interface KanaSegmentDisplayProps {
  segments: AzikSegment[];
  currentIndex: number;
  sizeClass?: string;
}

export default function KanaSegmentDisplay({
  segments,
  currentIndex,
  sizeClass = "text-xl",
}: KanaSegmentDisplayProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-2 ${sizeClass} tracking-widest font-sans`}>
      {segments.map((seg, idx) => {
        const isTyped = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <span
            key={idx}
            className={`px-1 py-0.5 rounded transition-all duration-150 ${
              isTyped
                ? "text-zinc-600 line-through"
                : isCurrent
                ? "bg-green-900/50 text-green-300 font-bold border-b-4 border-green-400"
                : "text-green-500"
            }`}
          >
            {seg.kana}
          </span>
        );
      })}
    </div>
  );
}
