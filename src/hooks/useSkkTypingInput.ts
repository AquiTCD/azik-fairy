import { useState, useCallback, useRef } from "react";
import type { SkkTypingWord, SkkKey } from "@/data/skkRules";

// -------------------------------------------------------------
// 純粋関数: SKKキー入力の状態遷移
// -------------------------------------------------------------

export interface SkkKeyState {
  wordIndex: number;
  keyIndex: number;
  missCount: number;
  totalKeys: number;
}

export interface SkkKeyResult {
  nextState: SkkKeyState;
  isMiss: boolean;
  wordCompleted: boolean;
  allCompleted: boolean;
}

/**
 * 1打鍵分のSKK入力を処理する純粋関数。
 * e.key.toLowerCase() と e.shiftKey を受け取り、期待キー列と照合する。
 */
export function processSkkKey(
  state: SkkKeyState,
  rawKey: string,
  shiftKey: boolean,
  words: SkkTypingWord[],
): SkkKeyResult {
  const word = words[state.wordIndex];
  if (!word) {
    return { nextState: state, isMiss: false, wordCompleted: false, allCompleted: true };
  }

  const key = rawKey.toLowerCase();
  const expected: SkkKey = word.keys[state.keyIndex];

  const isMatch = key === expected.key && !!shiftKey === !!expected.shift;

  if (!isMatch) {
    return {
      nextState: { ...state, missCount: state.missCount + 1 },
      isMiss: true,
      wordCompleted: false,
      allCompleted: false,
    };
  }

  const nextKeyIndex = state.keyIndex + 1;
  const nextTotalKeys = state.totalKeys + 1;
  const wordCompleted = nextKeyIndex >= word.keys.length;

  if (!wordCompleted) {
    return {
      nextState: { ...state, keyIndex: nextKeyIndex, totalKeys: nextTotalKeys },
      isMiss: false,
      wordCompleted: false,
      allCompleted: false,
    };
  }

  const nextWordIndex = state.wordIndex + 1;
  const allCompleted = nextWordIndex >= words.length;

  return {
    nextState: {
      wordIndex: nextWordIndex,
      keyIndex: 0,
      missCount: state.missCount,
      totalKeys: nextTotalKeys,
    },
    isMiss: false,
    wordCompleted: true,
    allCompleted,
  };
}

// -------------------------------------------------------------
// React Hook
// -------------------------------------------------------------

export interface SkkTypingStats {
  missCount: number;
  totalKeys: number;
  /** 標準SKK打鍵数合計に対するAZIK節約打鍵数 */
  savedKeys: number;
  /** AZIK短縮率: savedKeys / standardKeyCount_total */
  azikRatio: number;
}

export interface UseSkkTypingInputReturn {
  currentWordIndex: number;
  currentKeyIndex: number;
  isMiss: boolean;
  isCompleted: boolean;
  stats: SkkTypingStats;
  handleKeyDown: (e: KeyboardEvent) => void;
  reset: () => void;
}

const IGNORED_KEYS = new Set([
  "Shift", "Control", "Alt", "Meta", "CapsLock",
  "Tab", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
]);

export function useSkkTypingInput(words: SkkTypingWord[]): UseSkkTypingInputReturn {
  const [keyState, setKeyState] = useState<SkkKeyState>({
    wordIndex: 0,
    keyIndex: 0,
    missCount: 0,
    totalKeys: 0,
  });
  const [isMiss, setIsMiss] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const missTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const standardKeyTotal = words.reduce((sum, w) => sum + w.standardKeyCount, 0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isCompleted) return;
    if (IGNORED_KEYS.has(e.key)) return;

    setKeyState(prev => {
      const result = processSkkKey(prev, e.key, e.shiftKey, words);

      if (result.isMiss) {
        setIsMiss(true);
        if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
        missTimeoutRef.current = setTimeout(() => setIsMiss(false), 300);
      } else {
        setIsMiss(false);
      }

      if (result.allCompleted) {
        setIsCompleted(true);
      }

      return result.nextState;
    });
  }, [isCompleted, words]);

  const reset = useCallback(() => {
    setKeyState({ wordIndex: 0, keyIndex: 0, missCount: 0, totalKeys: 0 });
    setIsMiss(false);
    setIsCompleted(false);
  }, []);

  const savedKeys = standardKeyTotal - keyState.totalKeys + keyState.missCount;
  const azikRatio = standardKeyTotal > 0
    ? Math.max(0, savedKeys / standardKeyTotal)
    : 0;

  return {
    currentWordIndex: keyState.wordIndex,
    currentKeyIndex: keyState.keyIndex,
    isMiss,
    isCompleted,
    stats: {
      missCount: keyState.missCount,
      totalKeys: keyState.totalKeys,
      savedKeys: Math.max(0, savedKeys),
      azikRatio,
    },
    handleKeyDown,
    reset,
  };
}
