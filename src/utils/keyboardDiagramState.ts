export type KeyVisualState =
  | "active"
  | "normal"
  | "typed"
  | "heat-severe"
  | "heat-mid"
  | "heat-light"
  | "default";

export interface KeyClassificationInput {
  activeKeys: string[];
  normalKeys: string[];
  typedKeys: string[];
  heatmap?: Record<string, { miss: number; attempt: number }>;
}

export function classifyKeyState(key: string, input: KeyClassificationInput): KeyVisualState {
  if (input.activeKeys.includes(key)) return "active";
  if (input.normalKeys.includes(key)) return "normal";
  if (input.typedKeys.includes(key)) return "typed";

  const entry = input.heatmap?.[key];
  if (entry && entry.attempt >= 3) {
    const missRate = entry.miss / entry.attempt;
    if (missRate >= 0.6) return "heat-severe";
    if (missRate >= 0.4) return "heat-mid";
    if (missRate >= 0.2) return "heat-light";
  }

  return "default";
}
