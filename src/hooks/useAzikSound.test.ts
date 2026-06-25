import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * useAzikSound / playPreview のテスト
 *
 * WebAudio API (AudioContext) は jsdom に存在しないため、
 * vi.resetModules() + vi.stubGlobal() で差し替えたうえで dynamic import する。
 *
 * AudioContext 内部の playTone/playNoise まで追うのは過度な結合なので、
 * ここでは以下の "契約" のみ確認する:
 *   1. volume === 0 のときは AudioContext を生成しない（早期リターン）
 *   2. volume > 0 のときは AudioContext を生成して master gain をセットする
 */

function makeAudioContextMock() {
  const masterGain = {
    gain: { value: 1 },
    connect: vi.fn(),
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    state: "running" as AudioContextState,
    createGain: vi.fn().mockReturnValue(masterGain),
    createOscillator: vi.fn().mockReturnValue({
      type: "" as OscillatorType,
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createBuffer: vi.fn().mockReturnValue({ getChannelData: vi.fn().mockReturnValue(new Float32Array(1)) }),
    createBufferSource: vi.fn().mockReturnValue({
      buffer: null as unknown,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createBiquadFilter: vi.fn().mockReturnValue({
      type: "bandpass" as BiquadFilterType,
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
    }),
  };
  // vi.fn() を new で呼ぶと mockReturnValue が効かない。
  // 正規関数を渡して return ctx; とすることで new でも ctx を返す
  const AudioContextMock = vi.fn(function(this: unknown) { return ctx; });
  return { AudioContextMock, ctx, masterGain };
}

describe("playPreview", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    // node 環境では window が存在しないため stub する（getAudio の早期リターンを回避）
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {});
  });

  it("volume 0 のとき AudioContext を生成せず早期リターンする", async () => {
    const { AudioContextMock } = makeAudioContextMock();
    vi.stubGlobal("AudioContext", AudioContextMock);
    const { playPreview } = await import("./useAzikSound");

    playPreview("soft", 0);

    expect(AudioContextMock).not.toHaveBeenCalled();
  });

  it("volume > 0 のとき AudioContext を生成して master gain に volume/100 をセットする", async () => {
    const { AudioContextMock, masterGain } = makeAudioContextMock();
    vi.stubGlobal("AudioContext", AudioContextMock);
    const { playPreview } = await import("./useAzikSound");

    playPreview("soft", 80);

    expect(AudioContextMock).toHaveBeenCalledOnce();
    expect(masterGain.gain.value).toBeCloseTo(0.8);
  });

  it("異なるテーマでも同じ master gain ルーティングが使われる", async () => {
    const { AudioContextMock, masterGain } = makeAudioContextMock();
    vi.stubGlobal("AudioContext", AudioContextMock);
    const { playPreview } = await import("./useAzikSound");

    playPreview("8bit", 50);

    expect(AudioContextMock).toHaveBeenCalledOnce();
    expect(masterGain.gain.value).toBeCloseTo(0.5);
  });

  it("typewriter テーマでも master gain がセットされる", async () => {
    const { AudioContextMock, masterGain } = makeAudioContextMock();
    vi.stubGlobal("AudioContext", AudioContextMock);
    const { playPreview } = await import("./useAzikSound");

    playPreview("typewriter", 60);

    expect(AudioContextMock).toHaveBeenCalledOnce();
    expect(masterGain.gain.value).toBeCloseTo(0.6);
  });
});
