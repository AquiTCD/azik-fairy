import type { AzikSegment, AzikMapping } from "../data/azikRules";
import { buildValidKeys } from "../data/azikRules";
import { STAGE_MAX_LEVELS, AzikLevel, isTargetSegment, STAGE_KEY_PREDS, containsTargetLevel } from "../data/stages/wordValidator";

export interface AllowedPatternsOpts {
  stageId: string;
  stageCategory: string | undefined;
  isTraining: boolean;
  isFullTraining: boolean;
  dict: Record<string, AzikMapping>;
}

export function getAllowedPatterns(seg: AzikSegment, opts: AllowedPatternsOpts): string[] {
  const { stageId, stageCategory, isTraining, isFullTraining, dict } = opts;
  const isPracticeOrChallenge = stageCategory === "Practice" || stageCategory === "Challenge";
  const effectivelyTraining = !isPracticeOrChallenge || isTraining;

  // 非トレーニングモード: AZIKパターン優先、続いて通常ローマ字
  if (!effectivelyTraining) {
    const azikOnly = buildValidKeys(seg.kana, dict, (sub, _) => dict[sub]?.azik ?? []);
    const allPatterns = buildValidKeys(seg.kana, dict, (_sub, keys) => keys);
    const azikSet = new Set(azikOnly);
    return [...azikOnly, ...allPatterns.filter(p => !azikSet.has(p))];
  }

  const stageLevel = STAGE_MAX_LEVELS[stageId];

  // レベル未定義 / Practice: azik キーのみ（全分割経由で）
  if (!stageLevel || stageLevel === AzikLevel.Practice || isPracticeOrChallenge) {
    return buildValidKeys(seg.kana, dict, (sub, allKeys) => {
      const entry = dict[sub];
      return entry ? entry.azik : allKeys;
    }, true);
  }

  const isSummaryStage = stageId.includes("summary");
  const getCore = (k: string) => k.startsWith(";") && k.length > 1 ? k.slice(1) : k;
  const stagePred = STAGE_KEY_PREDS[stageId];

  const filter = (sub: string, allKeys: string[]): string[] => {
    const entry = dict[sub];
    if (!entry) return [];
    const pseudoSeg: AzikSegment = { kana: sub, normal: entry.normal, azik: entry.azik };

    if (!isSummaryStage && stagePred) {
      const targetKeys = pseudoSeg.azik.filter(k => stagePred(getCore(k)));
      if (targetKeys.length > 0) return targetKeys;
      return isFullTraining ? pseudoSeg.azik : allKeys;
    }

    const isTarget = isTargetSegment(pseudoSeg, stageLevel, isSummaryStage);
    if (!isTarget) {
      return isFullTraining ? pseudoSeg.azik : allKeys;
    }
    if (!isSummaryStage) {
      return pseudoSeg.azik.filter(k => containsTargetLevel(k, stageLevel));
    }
    return pseudoSeg.azik;
  };

  const subTargetPred = (sub: string): boolean => {
    const entry = dict[sub];
    if (!entry) return false;
    const pseudoSeg: AzikSegment = { kana: sub, normal: entry.normal, azik: entry.azik };
    if (!isSummaryStage && stagePred) {
      return pseudoSeg.azik.some(k => stagePred(getCore(k)));
    }
    return isTargetSegment(pseudoSeg, stageLevel, isSummaryStage);
  };

  const result = buildValidKeys(seg.kana, dict, filter, true, subTargetPred);
  if (result.length > 0) return result;
  return buildValidKeys(seg.kana, dict, (sub, _) => dict[sub]?.normal ?? [], true);
}
