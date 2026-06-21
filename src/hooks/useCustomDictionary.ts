"use client";

import { useMemo } from "react";
import { mergeCustomAzikRules, AzikMapping } from "@/data/azikRules";
import { GameSettings } from "@/types/game";

export function useCustomDictionary(settings: GameSettings): Record<string, AzikMapping> {
  return useMemo(
    () =>
      mergeCustomAzikRules(settings.customRules, {
        enableSpecial: settings.enableSpecial,
        enableForeign: settings.enableForeign,
        nAlternative: settings.nAlternative,
        smallKanaPrefix: settings.smallKanaPrefix,
      }),
    [settings.customRules, settings.enableSpecial, settings.enableForeign, settings.nAlternative, settings.smallKanaPrefix],
  );
}
