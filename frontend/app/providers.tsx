"use client";

import { AuthProvider } from "../lib/auth-context";
import { PwaProvider } from "../lib/pwa-context";
import { ThemeProvider } from "../lib/theme-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PwaProvider>
        <AuthProvider>{children}</AuthProvider>
      </PwaProvider>
    </ThemeProvider>
  );
}
