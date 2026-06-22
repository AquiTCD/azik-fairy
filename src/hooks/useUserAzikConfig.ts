"use client";

import { useState, useCallback, useMemo } from "react";
import { AZIK_DICTIONARY, AzikMapping } from "@/data/azikRules";
import {
  UserAzikConfig,
  EMPTY_USER_AZIK_CONFIG,
  applyUserConfig,
  parseConfToUserConfig,
} from "@/data/userAzikConfig";

const STORAGE_KEY = "azik-fairy:user-azik-config";

function loadFromStorage(): UserAzikConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_USER_AZIK_CONFIG;
    return JSON.parse(raw) as UserAzikConfig;
  } catch {
    return EMPTY_USER_AZIK_CONFIG;
  }
}

export function useUserAzikConfig() {
  const [config, setConfig] = useState<UserAzikConfig>(() =>
    typeof window !== "undefined" ? loadFromStorage() : EMPTY_USER_AZIK_CONFIG,
  );

  const save = useCallback((next: UserAzikConfig) => {
    setConfig(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  const importConf = useCallback((confText: string) => {
    const parsed = parseConfToUserConfig(confText, AZIK_DICTIONARY);
    save(parsed);
  }, [save]);

  const reset = useCallback(() => {
    save(EMPTY_USER_AZIK_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [save]);

  const effectiveDict = useMemo(
    (): Record<string, AzikMapping> => applyUserConfig(AZIK_DICTIONARY, config),
    [config],
  );

  const isCustomized = Object.keys(config.entries).length > 0;

  return { config, effectiveDict, isCustomized, importConf, reset, save };
}
