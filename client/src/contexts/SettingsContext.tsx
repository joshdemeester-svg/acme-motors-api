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

const SETTINGS_CACHE_KEY = "site-settings-cache";

function applyCSSVariables(settings: Partial<SiteSettings>) {
  if (settings.primaryColor) {
    document.documentElement.style.setProperty("--primary-custom", settings.primaryColor);
    const hsl = hexToHSL(settings.primaryColor);
    if (hsl) {
      document.documentElement.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      const foregroundL = hsl.l < 50 ? 100 : 0;
      document.documentElement.style.setProperty("--primary-foreground", `0 0% ${foregroundL}%`);
    }
  }
  if (settings.backgroundColor) {
    const bgHsl = hexToHSL(settings.backgroundColor);
    if (bgHsl) {
      document.documentElement.style.setProperty("--background", `${bgHsl.h} ${bgHsl.s}% ${bgHsl.l}%`);
      const cardL = Math.min(bgHsl.l + 5, 100);
      document.documentElement.style.setProperty("--card", `${bgHsl.h} ${bgHsl.s}% ${cardL}%`);
      const mutedL = Math.min(bgHsl.l + 10, 100);
      document.documentElement.style.setProperty("--muted", `${bgHsl.h} ${bgHsl.s}% ${mutedL}%`);
    }
  }
  if (settings.mainMenuColor) {
    document.documentElement.style.setProperty("--main-menu-color", settings.mainMenuColor);
  }
  if (settings.mainMenuHoverColor) {
    document.documentElement.style.setProperty("--main-menu-hover-color", settings.mainMenuHoverColor);
  }
  if (settings.contactButtonColor) {
    document.documentElement.style.setProperty("--contact-button-color", settings.contactButtonColor);
    const contactHsl = hexToHSL(settings.contactButtonColor);
    if (contactHsl) {
      const contactForegroundL = contactHsl.l < 50 ? 100 : 0;
      document.documentElement.style.setProperty("--contact-button-foreground", `${contactForegroundL}%`);
    }
  }
  if (settings.contactButtonHoverColor) {
    document.documentElement.style.setProperty("--contact-button-hover-color", settings.contactButtonHoverColor);
  }
  if (settings.menuFontSize) {
    document.documentElement.style.setProperty("--menu-font-size", `${settings.menuFontSize}px`);
  }
  if (settings.bodyFontSize) {
    document.documentElement.style.setProperty("--body-font-size", `${settings.bodyFontSize}px`);
  }
  document.documentElement.style.setProperty("--menu-text-transform", settings.menuAllCaps !== false ? "uppercase" : "none");
  if (settings.vehicleTitleColor) {
    document.documentElement.style.setProperty("--vehicle-title-color", settings.vehicleTitleColor);
  }
  if (settings.vehiclePriceColor) {
    document.documentElement.style.setProperty("--vehicle-price-color", settings.vehiclePriceColor);
  }
  if (settings.stepBgColor) {
    document.documentElement.style.setProperty("--step-bg-color", settings.stepBgColor);
  }
  if (settings.stepNumberColor) {
    document.documentElement.style.setProperty("--step-number-color", settings.stepNumberColor);
  }
  if (settings.socialIconBgColor) {
    document.documentElement.style.setProperty("--social-icon-bg-color", settings.socialIconBgColor);
  }
  if (settings.socialIconHoverColor) {
    document.documentElement.style.setProperty("--social-icon-hover-color", settings.socialIconHoverColor);
  }
  if (settings.calculatorAccentColor) {
    document.documentElement.style.setProperty("--calculator-accent-color", settings.calculatorAccentColor);
  }
  if (settings.calculatorBgColor) {
    document.documentElement.style.setProperty("--calculator-bg-color", settings.calculatorBgColor);
  }
}

function loadCachedSettings(): Partial<SiteSettings> | null {
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return null;
}

function saveCachedSettings(settings: SiteSettings) {
  try {
    const colorSettings = {
      primaryColor: settings.primaryColor,
      backgroundColor: settings.backgroundColor,
      mainMenuColor: settings.mainMenuColor,
      mainMenuHoverColor: settings.mainMenuHoverColor,
      contactButtonColor: settings.contactButtonColor,
      contactButtonHoverColor: settings.contactButtonHoverColor,
      menuFontSize: settings.menuFontSize,
      bodyFontSize: settings.bodyFontSize,
      menuAllCaps: settings.menuAllCaps,
      vehicleTitleColor: settings.vehicleTitleColor,
      vehiclePriceColor: settings.vehiclePriceColor,
      stepBgColor: settings.stepBgColor,
      stepNumberColor: settings.stepNumberColor,
      socialIconBgColor: settings.socialIconBgColor,
      socialIconHoverColor: settings.socialIconHoverColor,
      calculatorAccentColor: settings.calculatorAccentColor,
      calculatorBgColor: settings.calculatorBgColor,
    };
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(colorSettings));
  } catch {}
}

const cachedSettings = loadCachedSettings();
if (cachedSettings) {
  applyCSSVariables(cachedSettings);
}

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
    if (settings) {
      applyCSSVariables(settings);
      saveCachedSettings(settings);
    }
  }, [settings]);

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
