"use client";

import { useState, useCallback } from "react";
import { UserProgress } from "@/types/game";
import { PROGRESS_STORAGE_KEY } from "@/constants/game";

const DEFAULT_PROGRESS: UserProgress = {
  stageProgress: {},
  totalKeysTyped: 0,
  lastPlayDate: "",
  streak: 0,
  seenStageIntros: [],
  weaknessStats: {},
  sessionHistory: [],
  timeAttackBest: null,
};

export function useProgressStorage() {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);

  const load = useCallback(() => {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setProgress({ ...DEFAULT_PROGRESS, ...parsed });
    } catch (e) {
      console.error("Failed to load progress from localStorage:", e);
    }
  }, []);

  const saveProgress = useCallback((newProgress: UserProgress) => {
    setProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
  }, []);

  const clearProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  }, []);

  return { progress, setProgress, saveProgress, clearProgress, load };
}
