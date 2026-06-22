"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  words: Array<{ segments: AzikSegment[] }>;
  getAllowedPatterns: (seg: AzikSegment) => string[];
  disabled?: boolean;
  wiggleOnMiss?: boolean;
  onFirstKey?: () => void;
  onSegmentComplete?: () => void;
  onWordComplete?: (completedWordIndex: number) => void;
  onAllComplete?: (finalState: TypingKeyState) => void;
  onCorrectKey?: (key: string, expectedKey: string | undefined) => void;
  onMissKey?: (key: string, expectedKey: string | undefined) => void;
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
  words,
  getAllowedPatterns,
  disabled = false,
  wiggleOnMiss = true,
  onFirstKey,
  onSegmentComplete,
  onWordComplete,
  onAllComplete,
  onCorrectKey,
  onMissKey,
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

  // すべての外部値を ref で持つ → useEffect dep array が [] になり、
  // keydown ハンドラは一度だけ登録される
  const stateRef = useRef(typingState);
  stateRef.current = typingState;

  const startedAtRef = useRef(startedAt);
  startedAtRef.current = startedAt;

  const wordsRef = useRef(words);
  wordsRef.current = words;

  const getAllowedPatternsRef = useRef(getAllowedPatterns);
  getAllowedPatternsRef.current = getAllowedPatterns;

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const wiggleOnMissRef = useRef(wiggleOnMiss);
  wiggleOnMissRef.current = wiggleOnMiss;

  const onFirstKeyRef = useRef(onFirstKey);
  onFirstKeyRef.current = onFirstKey;
  const onSegmentCompleteRef = useRef(onSegmentComplete);
  onSegmentCompleteRef.current = onSegmentComplete;
  const onWordCompleteRef = useRef(onWordComplete);
  onWordCompleteRef.current = onWordComplete;
  const onAllCompleteRef = useRef(onAllComplete);
  onAllCompleteRef.current = onAllComplete;
  const onCorrectKeyRef = useRef(onCorrectKey);
  onCorrectKeyRef.current = onCorrectKey;
  const onMissKeyRef = useRef(onMissKey);
  onMissKeyRef.current = onMissKey;

  const reset = useCallback((overrides?: Partial<TypingKeyState>) => {
    const next: TypingKeyState = {
      wordIndex: 0,
      segmentIndex: 0,
      inputBuffer: "",
      totalCorrectKeys: 0,
      totalMissKeys: 0,
      ...overrides,
    };
    setTypingState(next);
    stateRef.current = next;
    setIsWiggling(false);
    setStartedAt(null);
    startedAtRef.current = null;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabledRef.current || e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;

      const ws = wordsRef.current;
      const s = stateRef.current;
      if (ws.length === 0 || s.wordIndex >= ws.length) return;

      const currentWord = ws[s.wordIndex];
      const currentSeg = currentWord?.segments[s.segmentIndex];
      if (!currentSeg) return;

      if (startedAtRef.current === null) {
        const now = Date.now();
        setStartedAt(now);
        startedAtRef.current = now;
        onFirstKeyRef.current?.();
      }

      const key = e.key.toLowerCase();
      const allowedPatterns = getAllowedPatternsRef.current(currentSeg);
      const result = processTypingKey(s, key, allowedPatterns, currentWord.segments.length, ws.length);

      setTypingState(result.state);
      stateRef.current = result.state;

      if (result.isMiss) {
        onMissKeyRef.current?.(key, result.expectedKey);
        if (wiggleOnMissRef.current) {
          setIsWiggling(true);
          setTimeout(() => setIsWiggling(false), 300);
        }
      } else {
        onCorrectKeyRef.current?.(key, result.expectedKey);
        if (result.allCompleted) {
          onAllCompleteRef.current?.(result.state);
        } else if (result.wordCompleted) {
          onWordCompleteRef.current?.(result.state.wordIndex - 1);
        } else if (result.segmentCompleted) {
          onSegmentCompleteRef.current?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    ...typingState,
    isWiggling,
    startedAt,
    reset,
  };
}
