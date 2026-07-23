"use client";

import { createContext, useContext } from "react";
import { UiTheme } from "@/types/game";

const ThemeContext = createContext<UiTheme>("default");

export function ThemeProvider({ theme, children }: { theme: UiTheme; children: React.ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): UiTheme {
  return useContext(ThemeContext);
}

export function isSimpleTheme(theme: UiTheme): boolean {
  return theme !== "default";
}
