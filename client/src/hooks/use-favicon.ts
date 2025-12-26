import { useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export function useFavicon() {
  const { settings } = useSettings();

  useEffect(() => {
    const faviconUrl = settings?.faviconUrl;
    
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    
    if (faviconUrl) {
      link.href = faviconUrl;
    } else {
      link.href = "/favicon.ico";
    }
  }, [settings?.faviconUrl]);
}
