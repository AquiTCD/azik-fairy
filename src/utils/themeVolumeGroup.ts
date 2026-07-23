import { UiTheme } from "@/types/game";

export type ThemeGroup = "default" | "simple";

export interface ThemeVolumeState {
  theme: UiTheme;
  soundVolume: number;
  officeSoundVolume: number;
}

export function themeGroup(theme: UiTheme): ThemeGroup {
  return theme === "default" ? "default" : "simple";
}

/**
 * officeSoundVolume acts as a swap register for "the other group's volume".
 * Crossing the default/simple boundary swaps it with the active soundVolume.
 */
export function applyThemeChange(state: ThemeVolumeState, newTheme: UiTheme): ThemeVolumeState {
  if (themeGroup(state.theme) === themeGroup(newTheme)) {
    return { ...state, theme: newTheme };
  }
  return {
    theme: newTheme,
    soundVolume: state.officeSoundVolume,
    officeSoundVolume: state.soundVolume,
  };
}
