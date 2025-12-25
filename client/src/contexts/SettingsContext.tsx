import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";

interface SettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty("--primary-custom", settings.primaryColor);
      const hsl = hexToHSL(settings.primaryColor);
      if (hsl) {
        document.documentElement.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        const foregroundL = hsl.l < 50 ? 100 : 0;
        document.documentElement.style.setProperty("--primary-foreground", `0 0% ${foregroundL}%`);
      }
    }
    if (settings?.backgroundColor) {
      const bgHsl = hexToHSL(settings.backgroundColor);
      if (bgHsl) {
        document.documentElement.style.setProperty("--background", `${bgHsl.h} ${bgHsl.s}% ${bgHsl.l}%`);
        const cardL = Math.min(bgHsl.l + 5, 100);
        document.documentElement.style.setProperty("--card", `${bgHsl.h} ${bgHsl.s}% ${cardL}%`);
        const mutedL = Math.min(bgHsl.l + 10, 100);
        document.documentElement.style.setProperty("--muted", `${bgHsl.h} ${bgHsl.s}% ${mutedL}%`);
      }
    }
    if (settings?.mainMenuColor) {
      document.documentElement.style.setProperty("--main-menu-color", settings.mainMenuColor);
    }
    if (settings?.mainMenuHoverColor) {
      document.documentElement.style.setProperty("--main-menu-hover-color", settings.mainMenuHoverColor);
    }
    if (settings?.contactButtonColor) {
      document.documentElement.style.setProperty("--contact-button-color", settings.contactButtonColor);
      const contactHsl = hexToHSL(settings.contactButtonColor);
      if (contactHsl) {
        const contactForegroundL = contactHsl.l < 50 ? 100 : 0;
        document.documentElement.style.setProperty("--contact-button-foreground", `${contactForegroundL}%`);
      }
    }
    if (settings?.contactButtonHoverColor) {
      document.documentElement.style.setProperty("--contact-button-hover-color", settings.contactButtonHoverColor);
    }
    if (settings?.menuFontSize) {
      document.documentElement.style.setProperty("--menu-font-size", `${settings.menuFontSize}px`);
    }
    if (settings?.bodyFontSize) {
      document.documentElement.style.setProperty("--body-font-size", `${settings.bodyFontSize}px`);
    }
  }, [settings?.primaryColor, settings?.backgroundColor, settings?.mainMenuColor, settings?.mainMenuHoverColor, settings?.contactButtonColor, settings?.contactButtonHoverColor, settings?.menuFontSize, settings?.bodyFontSize]);

  return (
    <SettingsContext.Provider value={{ settings: settings || null, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
