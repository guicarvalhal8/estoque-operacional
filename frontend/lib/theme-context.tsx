"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("estoque-theme") as Theme | null;
    const nextTheme = storedTheme ?? "light";
    setTheme(nextTheme);
    document.body.dataset.theme = nextTheme;
  }, []);

  const value = {
    theme,
    toggleTheme: () => {
      setTheme((currentTheme) => {
        const nextTheme = currentTheme === "light" ? "dark" : "light";
        window.localStorage.setItem("estoque-theme", nextTheme);
        document.body.dataset.theme = nextTheme;
        return nextTheme;
      });
    }
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return context;
}
