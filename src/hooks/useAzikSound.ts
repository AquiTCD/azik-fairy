let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new AudioContext();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

export type SoundThemeName = "off" | "default" | "typewriter" | "8bit" | "soft";

type SoundEvent = "correct" | "miss" | "wordComplete" | "gameStart" | "button" | "countdown" | "stageClear";

function playTone(
  ctx: AudioContext,
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
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration);
}

function playNoise(ctx: AudioContext, gainVal: number, duration: number, startOffset = 0) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, ctx.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + startOffset);
  source.stop(ctx.currentTime + startOffset + duration);
}

type ThemeSounds = Record<SoundEvent, (ctx: AudioContext) => void>;

const SOUND_THEMES: Record<Exclude<SoundThemeName, "off">, ThemeSounds> = {
  default: {
    correct: (ctx) => playTone(ctx, "sine", 880, 0.08, 0.06),
    miss: (ctx) => playTone(ctx, "square", 110, 0.15, 0.12),
    wordComplete: (ctx) => {
      playTone(ctx, "sine", 880, 0.06, 0.07);
      playTone(ctx, "sine", 1100, 0.06, 0.07, 0.07);
      playTone(ctx, "sine", 1320, 0.08, 0.12, 0.14);
    },
    gameStart: (ctx) => {
      playTone(ctx, "sine", 440, 0.06, 0.07);
      playTone(ctx, "sine", 660, 0.06, 0.07, 0.08);
    },
    button: (ctx) => playTone(ctx, "triangle", 440, 0.06, 0.05),
    countdown: (ctx) => playTone(ctx, "triangle", 660, 0.06, 0.05),
    stageClear: (ctx) => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        playTone(ctx, "sine", freq, 0.08, 0.15, i * 0.12);
      });
    },
  },

  typewriter: {
    correct: (ctx) => playNoise(ctx, 0.3, 0.04),
    miss: (ctx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    },
    wordComplete: (ctx) => {
      // チン！ bell
      playTone(ctx, "triangle", 1760, 0.12, 0.4);
      playTone(ctx, "sine", 3520, 0.04, 0.3);
    },
    gameStart: (ctx) => {
      // carriage return sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    },
    button: (ctx) => playNoise(ctx, 0.2, 0.03),
    countdown: (ctx) => playNoise(ctx, 0.15, 0.025),
    stageClear: (ctx) => {
      [1320, 1760, 2093, 2637].forEach((freq, i) => {
        playTone(ctx, "triangle", freq, 0.1, 0.25, i * 0.15);
      });
    },
  },

  "8bit": {
    correct: (ctx) => playTone(ctx, "square", 880, 0.08, 0.04),
    miss: (ctx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    },
    wordComplete: (ctx) => {
      // coin pickup
      playTone(ctx, "square", 988, 0.08, 0.06);
      playTone(ctx, "square", 1319, 0.1, 0.1, 0.06);
    },
    gameStart: (ctx) => {
      [330, 440, 523, 659].forEach((freq, i) => {
        playTone(ctx, "square", freq, 0.08, 0.07, i * 0.07);
      });
    },
    button: (ctx) => playTone(ctx, "square", 440, 0.07, 0.03),
    countdown: (ctx) => playTone(ctx, "square", 660, 0.08, 0.04),
    stageClear: (ctx) => {
      [523, 659, 784, 659, 784, 1047].forEach((freq, i) => {
        playTone(ctx, "square", freq, 0.1, 0.1, i * 0.1);
      });
    },
  },

  soft: {
    correct: (ctx) => playTone(ctx, "sine", 1046, 0.06, 0.1),
    miss: (ctx) => playTone(ctx, "sine", 220, 0.05, 0.12),
    wordComplete: (ctx) => {
      playTone(ctx, "sine", 784, 0.05, 0.12);
      playTone(ctx, "sine", 988, 0.05, 0.12, 0.1);
      playTone(ctx, "sine", 1175, 0.05, 0.18, 0.2);
    },
    gameStart: (ctx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    },
    button: (ctx) => playTone(ctx, "sine", 880, 0.04, 0.05),
    countdown: (ctx) => playTone(ctx, "sine", 660, 0.04, 0.06),
    stageClear: (ctx) => {
      [523, 659, 784, 880, 1046].forEach((freq, i) => {
        playTone(ctx, "sine", freq, 0.05, 0.18, i * 0.1);
      });
    },
  },
};

export function useAzikSound(theme: SoundThemeName) {
  const play = (event: SoundEvent) => {
    if (theme === "off") return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      SOUND_THEMES[theme][event](ctx);
    } catch {
      // AudioContext errors are silently ignored
    }
  };

  return {
    playCorrect: () => play("correct"),
    playMiss: () => play("miss"),
    playWordComplete: () => play("wordComplete"),
    playGameStart: () => play("gameStart"),
    playButton: () => play("button"),
    playCountdown: () => play("countdown"),
    playStageClear: () => play("stageClear"),
  };
}
