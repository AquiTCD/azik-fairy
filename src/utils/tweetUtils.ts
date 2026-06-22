import type { GameStats } from "@/types/game";

export function buildTimeAttackTweetUrl(wpm: number, accuracy: number, origin: string): string {
  const shareParams = new URLSearchParams({ theme: "af", title: "TIME ATTACK", wpm: String(wpm), acc: String(accuracy) });
  const shareText = `AZIKタイピング養成妖精 #AZIK_Fairy のタイムアタック！\nWPM: ${wpm} / ACC: ${accuracy}%`;
  return `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(`${origin}/share?${shareParams}`)}`;
}

export function buildTweetUrl(
  stats: GameStats,
  stageTitle: string,
  isTrainingShare: boolean,
  origin: string,
): string {
  const rankLabel = stats.rank === "PERFECT" ? "✦PERFECT✦" : `${stats.rank}ランク`;

  if (isTrainingShare) {
    const shareParams = new URLSearchParams({ theme: "af", title: stageTitle, rank: stats.rank, training: "true" });
    const tweetText = `AZIKタイピング養成妖精 #AZIK_Fairy でトレーニング中！\nステージ: 「${stageTitle}」\n【 ${rankLabel} 】`;
    return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(`${origin}/share?${shareParams}`)}`;
  }

  const shareParams = new URLSearchParams({
    theme: "af", wpm: String(stats.wpm), acc: String(stats.accuracy),
    azik: String(stats.azikRatio), title: stageTitle, rank: stats.rank, comment: stats.comment,
  });
  const tweetText = `AZIKタイピング養成妖精 #AZIK_Fairy でスコアアタック！\nステージ: 「${stageTitle}」\n【 ${rankLabel} 】\nスピード: ${stats.wpm} WPM | 正確率: ${stats.accuracy}% | AZIK率: ${stats.azikRatio}%`;
  return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(`${origin}/share?${shareParams}`)}`;
}
