"use client";

import { useState, useCallback, useMemo } from "react";
import { AZIK_DICTIONARY, AzikMapping } from "@/data/azikRules";
import {
  UserDictConfig,
  EMPTY_USER_DICT_CONFIG,
  applyUserDictConfig,
  parseTableToUserDictConfig,
} from "@/data/userDictConfig";

const STORAGE_KEY = "azik-fairy:user-dict-config";

export function useUserDictConfig() {
  const [config, setConfig] = useState<UserDictConfig>(() => {
    if (typeof window === "undefined") return EMPTY_USER_DICT_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserDictConfig) : EMPTY_USER_DICT_CONFIG;
    } catch {
      return EMPTY_USER_DICT_CONFIG;
    }
  });

  const save = useCallback((next: UserDictConfig) => {
    setConfig(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const importTable = useCallback((text: string) => {
    save(parseTableToUserDictConfig(text, AZIK_DICTIONARY));
  }, [save]);

  const setKanaKeys = useCallback((kana: string, cfg: { normal: string[]; azik: string[] }) => {
    setConfig(prev => {
      const next = { ...prev, [kana]: cfg };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setConfig(EMPTY_USER_DICT_CONFIG);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const effectiveDict = useMemo(
    (): Record<string, AzikMapping> => applyUserDictConfig(AZIK_DICTIONARY, config),
    [config],
  );

  const isCustomized = Object.keys(config).length > 0;

  return { config, effectiveDict, isCustomized, importTable, setKanaKeys, reset };
}
