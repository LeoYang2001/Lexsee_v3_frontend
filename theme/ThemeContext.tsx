import React, { createContext, useContext, useState, ReactNode } from "react";

const lightTheme = {
  background: "#131416",
  text: "#1A1A1A",
  border: "#E5E7EB",
  primary: "#FA541C",
  secondary: "#F59E42",
  accent: "#374151",
  card: "#F9FAFB",
  statusBar: "dark-content",
};

const darkTheme = {
  background: "#18181B",
  text: "#F3F4F6",
  border: "#27272A",
  primary: "#FA541C",
  secondary: "#F59E42",
  accent: "#F3F4F6",
  card: "#232326",
  statusBar: "light-content",
};

const ThemeContext = createContext({
  theme: lightTheme,
  setMode: (mode: "light" | "dark") => {},
  mode: "dark",
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const theme = mode === "light" ? lightTheme : darkTheme;
  return (
    <ThemeContext.Provider value={{ theme, setMode, mode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const { theme } = useContext(ThemeContext);
  return theme;
};

export const useThemeMode = () => {
  const { mode, setMode } = useContext(ThemeContext);
  return { mode, setMode };
};
