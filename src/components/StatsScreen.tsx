"use client";

import React, { lazy, Suspense } from "react";
import { DailySession } from "@/types/game";
import GameButton from "@/components/GameButton";
import FairyScreenLayout from "@/components/FairyScreenLayout";

const LineChart = lazy(() => import("recharts").then(m => ({ default: m.LineChart })));
const Line = lazy(() => import("recharts").then(m => ({ default: m.Line })));
const XAxis = lazy(() => import("recharts").then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import("recharts").then(m => ({ default: m.YAxis })));
const Tooltip = lazy(() => import("recharts").then(m => ({ default: m.Tooltip })));
const ResponsiveContainer = lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })));

interface StatsScreenProps {
  sessionHistory: DailySession[];
  onBackToTitle: () => void;
}

export default function StatsScreen({ sessionHistory, onBackToTitle }: StatsScreenProps) {
  const [range, setRange] = React.useState<7 | 30 | 90>(30);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - range);
  const cutoffStr = cutoff.toLocaleDateString("sv-SE");
  const filtered = [...sessionHistory]
    .filter(s => s.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 先週比 WPM
  const sorted = [...sessionHistory].sort((a, b) => a.date.localeCompare(b.date));
  const recent7 = sorted.slice(-7);
  const prev7 = sorted.slice(-14, -7);
  const recentAvg = recent7.length ? Math.round(recent7.reduce((s, d) => s + d.bestWpm, 0) / recent7.length) : null;
  const prevAvg = prev7.length ? Math.round(prev7.reduce((s, d) => s + d.bestWpm, 0) / prev7.length) : null;
  const diff = recentAvg !== null && prevAvg !== null ? recentAvg - prevAvg : null;

  // 短縮した日付表示
  const formatDate = (dateStr: string) => dateStr.slice(5); // "MM-DD"

  return (
    <FairyScreenLayout fairy={{ message: "成長グラフだよ！継続が力なんだよね！数字が上がってるの見ると超テンション上がる！💎", emotion: "idle" }}>
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="font-pixel text-2xl text-center border-b-2 border-green-500 pb-2 tracking-widest">= STATS =</h2>

        {diff !== null && (
          <p className="text-center text-sm font-pixel">
            先週比WPM:{" "}
            <span className={diff >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              {diff >= 0 ? "+" : ""}{diff} WPM
            </span>
          </p>
        )}

        {/* 期間切り替え */}
        <div className="flex gap-2 justify-center">
          {([7, 30, 90] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-pixel border-2 transition-colors duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${range === r
                ? "bg-green-500 text-black border-green-500"
                : "bg-zinc-800 text-green-400 border-green-800 hover:border-green-500"
                }`}
            >
              {r}日
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-zinc-500 font-pixel py-8">
            <p>まだデータがないよ！</p>
            <p className="text-xs mt-2 text-zinc-600">チャレンジモードで実戦練習・お題をプレイすると記録されるよ</p>
          </div>
        ) : (
          <Suspense fallback={<div className="text-green-400 font-pixel text-center py-4">グラフ読込中...</div>}>

            <div className="w-full">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={filtered.map(d => ({ ...d, date: formatDate(d.date) }))}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#71717a" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#71717a" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #22c55e", fontSize: 11 }}
                    labelStyle={{ color: "#4ade80" }}
                  />
                  <Line type="monotone" dataKey="bestWpm" stroke="#4ade80" name="WPM" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="avgAccuracy" stroke="#facc15" name="ACC%" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="avgAzikRatio" stroke="#22d3ee" name="AZIK%" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-1 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-400 inline-block" />WPM</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block" />ACC%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-400 inline-block" />AZIK%</span>
              </div>
            </div>
          </Suspense>
        )}

        {/* サマリー統計 */}
        {filtered.length > 0 && (() => {
          const maxWpm = Math.max(...filtered.map(d => d.bestWpm));
          const avgAcc = Math.round(filtered.reduce((s, d) => s + d.avgAccuracy, 0) / filtered.length);
          const avgAzik = Math.round(filtered.reduce((s, d) => s + d.avgAzikRatio, 0) / filtered.length);
          return (
            <div className="grid grid-cols-3 gap-2 w-full">
              {[
                { label: "PEAK WPM", value: maxWpm, color: "text-yellow-300", border: "border-yellow-700" },
                { label: "AVG ACC", value: `${avgAcc}%`, color: "text-green-300", border: "border-green-700" },
                { label: "AVG AZIK", value: `${avgAzik}%`, color: "text-cyan-300", border: "border-cyan-700" },
              ].map(({ label, value, color, border }) => (
                <div key={label} className={`flex flex-col items-center p-2 bg-zinc-800 border-2 ${border} rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                  <span className="text-[9px] font-pixel text-zinc-400">{label}</span>
                  <span className={`text-lg font-bold font-pixel ${color} mt-1`}>{value}</span>
                </div>
              ))}
            </div>
          );
        })()}

        <GameButton variant="danger" size="sm" onClick={onBackToTitle}>BACK TO TITLE</GameButton>
      </div>
    </FairyScreenLayout>
  );
}
