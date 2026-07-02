interface KeyPatternButtonsProps {
  patterns: string[];
  inputBuffer: string;
}

export default function KeyPatternButtons({ patterns, inputBuffer }: KeyPatternButtonsProps) {
  return (
    <div className="w-full flex flex-wrap gap-2 justify-center items-start font-pixel text-sm h-12 overflow-y-auto pb-1 chip-scroll">
      {patterns.map(pattern => {
        const remaining = pattern.slice(inputBuffer.length);
        return (
          <div
            key={pattern}
            className="bg-zinc-800 px-3 py-1.5 border border-zinc-700 rounded text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span className="text-zinc-500">{inputBuffer}</span>
            <span className="text-green-400 font-bold animate-pulse uppercase">{remaining}</span>
          </div>
        );
      })}
    </div>
  );
}
