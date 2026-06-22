"use client";

interface KeyboardDiagramProps {
  activeKeys: string[];
  typedKeys?: string[];
  normalKeys?: string[];
  layout: "US" | "JIS";
  showLegend?: boolean;
  heatmap?: Record<string, { miss: number; attempt: number }>;
  compact?: boolean;
}

const US_ROWS: string[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

const JIS_ROWS: string[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "@", "["],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", ":", "]"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

export default function KeyboardDiagram({ activeKeys, typedKeys = [], normalKeys = [], layout, showLegend = true, heatmap, compact = false }: KeyboardDiagramProps) {
  const rows = layout === "JIS" ? JIS_ROWS : US_ROWS;

  const getKeyStyle = (key: string) => {
    if (activeKeys.includes(key)) {
      return "bg-yellow-400 text-black border-yellow-300 shadow-[0_3px_0_#ca8a04] font-bold scale-110";
    }
    if (normalKeys.includes(key)) {
      return "bg-zinc-600 text-zinc-300 border-zinc-500 font-bold";
    }
    if (typedKeys.includes(key)) {
      return "bg-zinc-700 text-zinc-500 border-zinc-600";
    }
    if (heatmap) {
      const entry = heatmap[key];
      if (entry && entry.attempt >= 3) {
        const missRate = entry.miss / entry.attempt;
        if (missRate >= 0.6) return "bg-red-600 text-white border-red-500 font-bold";
        if (missRate >= 0.4) return "bg-red-800 text-red-200 border-red-700";
        if (missRate >= 0.2) return "bg-red-950 text-red-400 border-red-900";
      }
    }
    return "bg-zinc-800 text-zinc-400 border-zinc-700";
  };

  const hasHeatData = heatmap && Object.values(heatmap).some(e => e.attempt >= 3 && e.miss / e.attempt >= 0.2);

  const keySize = compact ? "w-4 h-4 text-[7px]" : "w-7 h-7 text-[10px]";
  const gapRow = compact ? "gap-[1px]" : "gap-1";
  const rowOffset = compact ? 7 : 10;

  return (
    <div className={`flex flex-col items-center ${compact ? "gap-[1px] my-1" : "gap-1 my-3"} select-none`}>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className={`flex ${gapRow}`} style={{ marginLeft: `${rowIdx * rowOffset}px` }}>
          {row.map((key) => (
            <div
              key={key}
              className={`${keySize} flex items-center justify-center border rounded transition-all duration-100 font-pixel uppercase ${getKeyStyle(key)}`}
            >
              {key}
            </div>
          ))}
        </div>
      ))}
      {showLegend && (activeKeys.length > 0 || normalKeys.length > 0 || hasHeatData) && (
        <div className="flex gap-3 mt-1 text-[9px] text-zinc-500">
          {activeKeys.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-sm inline-block" />AZIK</span>}
          {normalKeys.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-zinc-600 rounded-sm inline-block" />通常ローマ字</span>}
          {hasHeatData && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-600 rounded-sm inline-block" />ミスが多かったキー</span>}
        </div>
      )}
    </div>
  );
}
