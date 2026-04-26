"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isMobileDevice: boolean;
  isAppleMobile: boolean;
  installApp: () => Promise<boolean>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isAppleMobile, setIsAppleMobile] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsMobileDevice(window.matchMedia("(max-width: 1080px)").matches || /android|iphone|ipad|ipod/.test(userAgent));
    setIsAppleMobile(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: Boolean(deferredPrompt) && !isInstalled,
      isInstalled,
      isMobileDevice,
      isAppleMobile,
      installApp: async () => {
        if (!deferredPrompt) return false;

        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        const accepted = choice.outcome === "accepted";

        if (accepted) {
          setIsInstalled(true);
        }

        setDeferredPrompt(null);
        return accepted;
      }
    }),
    [deferredPrompt, isInstalled, isMobileDevice, isAppleMobile]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);

  if (!context) {
    throw new Error("usePwa deve ser usado dentro de PwaProvider");
  }

  return context;
}
