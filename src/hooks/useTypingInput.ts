"use client";

import { useState, useEffect, useRef } from "react";
import { AzikSegment } from "@/data/azikRules";

// ---------- 純粋関数 (テスト可能なコア) ----------

export interface TypingKeyState {
  wordIndex: number;
  segmentIndex: number;
  inputBuffer: string;
  totalCorrectKeys: number;
  totalMissKeys: number;
}

export interface TypingKeyResult {
  state: TypingKeyState;
  segmentCompleted: boolean;
  wordCompleted: boolean;
  allCompleted: boolean;
  isMiss: boolean;
  expectedKey: string | undefined;
}

export function processTypingKey(
  state: TypingKeyState,
  key: string,
  allowedPatterns: string[],
  totalSegmentsInWord: number,
  totalWords: number,
): TypingKeyResult {
  const { wordIndex, segmentIndex, inputBuffer, totalCorrectKeys, totalMissKeys } = state;

  // allowedPatterns の次のキャラクターを expected として算出
  const expectedKey = allowedPatterns
    .map(p => p[inputBuffer.length])
    .filter(Boolean)[0];

  const nextBuffer = inputBuffer + key;
  const isValidPrefix = allowedPatterns.some(p => p.startsWith(nextBuffer));

  if (!isValidPrefix) {
    return {
      state: { ...state, totalMissKeys: totalMissKeys + 1 },
      segmentCompleted: false,
      wordCompleted: false,
      allCompleted: false,
      isMiss: true,
      expectedKey,
    };
  }

  const isCompleted = allowedPatterns.includes(nextBuffer);

  if (!isCompleted) {
    return {
      state: { ...state, inputBuffer: nextBuffer, totalCorrectKeys: totalCorrectKeys + 1 },
      segmentCompleted: false,
      wordCompleted: false,
      allCompleted: false,
      isMiss: false,
      expectedKey,
    };
  }

  // セグメント完了
  const isLastSegment = segmentIndex + 1 >= totalSegmentsInWord;
  const isLastWord = wordIndex + 1 >= totalWords;

  if (!isLastSegment) {
    return {
      state: { ...state, inputBuffer: "", segmentIndex: segmentIndex + 1, totalCorrectKeys: totalCorrectKeys + 1 },
      segmentCompleted: true,
      wordCompleted: false,
      allCompleted: false,
      isMiss: false,
      expectedKey,
    };
  }

  // 単語完了
  const nextWordIndex = wordIndex + 1;
  return {
    state: {
      ...state,
      inputBuffer: "",
      segmentIndex: 0,
      wordIndex: nextWordIndex,
      totalCorrectKeys: totalCorrectKeys + 1,
    },
    segmentCompleted: true,
    wordCompleted: true,
    allCompleted: isLastWord,
    isMiss: false,
    expectedKey,
  };
}

// ---------- React hook (純粋関数のラッパー) ----------

export interface UseTypingInputOptions {
  segments: AzikSegment[] | null;
  getAllowedPatterns: (seg: AzikSegment) => string[];
  totalWords: number;
  disabled?: boolean;
  onSegmentComplete?: () => void;
  onWordComplete?: (wordIndex: number) => void;
  onAllComplete?: () => void;
  onCorrectKey?: (key: string, expectedKey: string | undefined) => void;
  onMissKey?: (key: string, expectedKey: string | undefined) => void;
  onFirstKey?: () => void;
}

export interface UseTypingInputReturn {
  wordIndex: number;
  segmentIndex: number;
  inputBuffer: string;
  totalCorrectKeys: number;
  totalMissKeys: number;
  isWiggling: boolean;
  startedAt: number | null;
  reset: (overrides?: Partial<TypingKeyState>) => void;
}

export function useTypingInput({
  segments,
  getAllowedPatterns,
  totalWords,
  disabled = false,
  onSegmentComplete,
  onWordComplete,
  onAllComplete,
  onCorrectKey,
  onMissKey,
  onFirstKey,
}: UseTypingInputOptions): UseTypingInputReturn {
  const [typingState, setTypingState] = useState<TypingKeyState>({
    wordIndex: 0,
    segmentIndex: 0,
    inputBuffer: "",
    totalCorrectKeys: 0,
    totalMissKeys: 0,
  });
  const [isWiggling, setIsWiggling] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // stale closure 回避用 ref
  const stateRef = useRef(typingState);
  stateRef.current = typingState;

  const reset = (overrides?: Partial<TypingKeyState>) => {
    const next: TypingKeyState = { wordIndex: 0, segmentIndex: 0, inputBuffer: "", totalCorrectKeys: 0, totalMissKeys: 0, ...overrides };
    setTypingState(next);
    setIsWiggling(false);
    setStartedAt(null);
  };

  useEffect(() => {
    if (disabled || !segments) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key.toLowerCase();
      const state = stateRef.current;
      const currentSeg = segments[state.segmentIndex];
      if (!currentSeg) return;

      if (startedAt === null) {
        setStartedAt(Date.now());
        onFirstKey?.();
      }

      const allowedPatterns = getAllowedPatterns(currentSeg);
      const result = processTypingKey(state, key, allowedPatterns, segments.length, totalWords);

      setTypingState(result.state);

      if (result.isMiss) {
        onMissKey?.(key, result.expectedKey);
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 300);
      } else {
        onCorrectKey?.(key, result.expectedKey);
        if (result.allCompleted) {
          onAllComplete?.();
        } else if (result.wordCompleted) {
          onWordComplete?.(result.state.wordIndex - 1);
        } else if (result.segmentCompleted) {
          onSegmentComplete?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [segments, getAllowedPatterns, totalWords, disabled, startedAt, onFirstKey, onSegmentComplete, onWordComplete, onAllComplete, onCorrectKey, onMissKey]);

  return {
    ...typingState,
    isWiggling,
    startedAt,
    reset,
  };
}
