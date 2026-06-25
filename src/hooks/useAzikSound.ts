import { useCallback, useMemo } from "react";

let sharedCtx: AudioContext | null = null;
let sharedMasterGain: GainNode | null = null;

function getAudio(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx || sharedCtx.state === "closed") {
      // Declare ambient session so sound effects don't interrupt background audio (e.g. YouTube)
      // https://w3c.github.io/audio-session/
      if ("audioSession" in navigator) {
        (navigator as { audioSession: { type: string } }).audioSession.type = "ambient";
      }
      sharedCtx = new AudioContext();
      sharedMasterGain = sharedCtx.createGain();
      sharedMasterGain.connect(sharedCtx.destination);
    }
    return { ctx: sharedCtx, master: sharedMasterGain! };
  } catch {
    return null;
  }
}

export type SoundThemeName = "soft" | "8bit" | "typewriter";

type SoundEvent = "correct" | "miss" | "wordComplete" | "stageClear";

function playTone(
  ctx: AudioContext,
  master: GainNode,
  type: OscillatorType,
  freq: number,
  gainVal: number,
  duration: number,
  startOffset = 0,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
  gain.gain.setValueAtTime(gainVal, ctx.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration);
}

function playNoise(
  ctx: AudioContext,
  master: GainNode,
  gainVal: number,
  duration: number,
  startOffset = 0,
  filterFreq = 1200,
  filterQ = 0.5,
) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, ctx.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(ctx.currentTime + startOffset);
  source.stop(ctx.currentTime + startOffset + duration);
}

type ThemeSounds = Record<SoundEvent, (ctx: AudioContext, master: GainNode) => void>;

const SOUND_THEMES: Record<SoundThemeName, ThemeSounds> = {
  typewriter: {
    // タイプバーがプラテンを叩く音（高域バンドパス）
    correct: (ctx, m) => playNoise(ctx, m, 0.3, 0.04, 0, 1200, 0.5),
    // キーが詰まったときの重い打鍵（低域バンドパス）
    miss: (ctx, m) => playNoise(ctx, m, 0.45, 0.07, 0, 250, 1.5),
    // スペースバーの重い打鍵（中低域、より長い余韻）
    wordComplete: (ctx, m) => playNoise(ctx, m, 0.4, 0.09, 0, 420, 2.0),
    // キャリッジリターン: ラチェット音×7 → ドン
    stageClear: (ctx, m) => {
      for (let i = 0; i < 7; i++) {
        playNoise(ctx, m, 0.18, 0.022, i * 0.055, 700 + i * 40, 0.9);
      }
      playNoise(ctx, m, 0.4, 0.06, 0.42, 280, 1.8);
    },
  },

  "8bit": {
    correct: (ctx, m) => playTone(ctx, m, "square", 880, 0.08, 0.04),
    miss: (ctx, m) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(m);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    },
    wordComplete: (ctx, m) => {
      // coin pickup
      playTone(ctx, m, "square", 988, 0.08, 0.06);
      playTone(ctx, m, "square", 1319, 0.1, 0.1, 0.06);
    },
    stageClear: (ctx, m) => {
      [523, 659, 784, 659, 784, 1047].forEach((freq, i) => {
        playTone(ctx, m, "square", freq, 0.1, 0.1, i * 0.1);
      });
    },
  },

  soft: {
    correct: (ctx, m) => playTone(ctx, m, "sine", 1046, 0.06, 0.1),
    miss: (ctx, m) => playTone(ctx, m, "sine", 220, 0.05, 0.12),
    wordComplete: (ctx, m) => {
      playTone(ctx, m, "sine", 784, 0.05, 0.12);
      playTone(ctx, m, "sine", 988, 0.05, 0.12, 0.1);
      playTone(ctx, m, "sine", 1175, 0.05, 0.18, 0.2);
    },
    stageClear: (ctx, m) => {
      [523, 659, 784, 880, 1046].forEach((freq, i) => {
        playTone(ctx, m, "sine", freq, 0.05, 0.18, i * 0.1);
      });
    },
  },
};

function executePlay(theme: SoundThemeName, volume: number, event: SoundEvent) {
  if (volume === 0) return;
  const audio = getAudio();
  if (!audio) return;
  try {
    audio.master.gain.value = volume / 100;
    SOUND_THEMES[theme][event](audio.ctx, audio.master);
  } catch {
    // AudioContext errors are silently ignored
  }
}

export function playPreview(theme: SoundThemeName, volume: number) {
  executePlay(theme, volume, "correct");
}

export function useAzikSound(theme: SoundThemeName, volume: number) {
  const play = useCallback((event: SoundEvent) => {
    executePlay(theme, volume, event);
  }, [theme, volume]);

  return useMemo(() => ({
    playCorrect: () => play("correct"),
    playMiss: () => play("miss"),
    playWordComplete: () => play("wordComplete"),
    playStageClear: () => play("stageClear"),
  }), [play]);
}
