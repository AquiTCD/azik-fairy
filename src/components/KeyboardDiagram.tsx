"use client";

interface KeyboardDiagramProps {
  activeKeys: string[];
  typedKeys?: string[];
  normalKeys?: string[];
  layout: "US" | "JIS";
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

export default function KeyboardDiagram({ activeKeys, typedKeys = [], normalKeys = [], layout }: KeyboardDiagramProps) {
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
    return "bg-zinc-800 text-zinc-400 border-zinc-700";
  };

  return (
    <div className="flex flex-col items-center gap-1 my-3 select-none">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1" style={{ marginLeft: `${rowIdx * 10}px` }}>
          {row.map((key) => (
            <div
              key={key}
              className={`w-7 h-7 flex items-center justify-center text-[10px] border rounded transition-all duration-100 font-pixel uppercase ${getKeyStyle(key)}`}
            >
              {key}
            </div>
          ))}
        </div>
      ))}
      {(activeKeys.length > 0 || normalKeys.length > 0) && (
        <div className="flex gap-3 mt-1 text-[9px] text-zinc-500">
          {activeKeys.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-sm inline-block" />AZIK</span>}
          {normalKeys.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 bg-zinc-600 rounded-sm inline-block" />通常ローマ字</span>}
        </div>
      )}
    </div>
  );
}
