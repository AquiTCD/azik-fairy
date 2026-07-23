import { describe, it, expect } from "vitest";
import { classifyKeyState } from "./keyboardDiagramState";

const noKeys = { activeKeys: [], normalKeys: [], typedKeys: [] };

describe("classifyKeyState", () => {
  it("activeKeys に含まれる場合は active", () => {
    expect(classifyKeyState("a", { ...noKeys, activeKeys: ["a"] })).toBe("active");
  });

  it("normalKeys に含まれる場合は normal", () => {
    expect(classifyKeyState("a", { ...noKeys, normalKeys: ["a"] })).toBe("normal");
  });

  it("typedKeys に含まれる場合は typed", () => {
    expect(classifyKeyState("a", { ...noKeys, typedKeys: ["a"] })).toBe("typed");
  });

  it("優先順位: active > normal > typed", () => {
    expect(classifyKeyState("a", { activeKeys: ["a"], normalKeys: ["a"], typedKeys: ["a"] })).toBe("active");
    expect(classifyKeyState("a", { activeKeys: [], normalKeys: ["a"], typedKeys: ["a"] })).toBe("normal");
  });

  it("heatmap のミス率 60%以上は heat-severe", () => {
    const heatmap = { a: { miss: 3, attempt: 5 } };
    expect(classifyKeyState("a", { ...noKeys, heatmap })).toBe("heat-severe");
  });

  it("heatmap のミス率 40%以上60%未満は heat-mid", () => {
    const heatmap = { a: { miss: 2, attempt: 5 } };
    expect(classifyKeyState("a", { ...noKeys, heatmap })).toBe("heat-mid");
  });

  it("heatmap のミス率 20%以上40%未満は heat-light", () => {
    const heatmap = { a: { miss: 1, attempt: 5 } };
    expect(classifyKeyState("a", { ...noKeys, heatmap })).toBe("heat-light");
  });

  it("heatmap の attempt が 3 未満は default（ミス率が高くても対象外）", () => {
    const heatmap = { a: { miss: 2, attempt: 2 } };
    expect(classifyKeyState("a", { ...noKeys, heatmap })).toBe("default");
  });

  it("heatmap のミス率が 20% 未満は default", () => {
    const heatmap = { a: { miss: 0, attempt: 5 } };
    expect(classifyKeyState("a", { ...noKeys, heatmap })).toBe("default");
  });

  it("該当なし・heatmapなしは default", () => {
    expect(classifyKeyState("a", noKeys)).toBe("default");
  });

  it("typed は heatmap より優先される", () => {
    const heatmap = { a: { miss: 5, attempt: 5 } };
    expect(classifyKeyState("a", { ...noKeys, typedKeys: ["a"], heatmap })).toBe("typed");
  });
});
