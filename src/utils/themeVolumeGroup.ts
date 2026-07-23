import { UiTheme } from "@/types/game";

export type ThemeGroup = "default" | "office";

export interface ThemeVolumeState {
  theme: UiTheme;
  soundVolume: number;
  officeSoundVolume: number;
}

export function themeGroup(theme: UiTheme): ThemeGroup {
  return theme === "default" ? "default" : "office";
}

/**
 * officeSoundVolume acts as a swap register for "the other group's volume".
 * Crossing a group boundary swaps it with the active soundVolume; switching
 * within the same group (office-light <-> office-dark) leaves volume untouched.
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
