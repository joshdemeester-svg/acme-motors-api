import { useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export function useLiveChat() {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings?.liveChatEnabled || !settings?.liveChatWidgetId) {
      const existingScript = document.getElementById("highlevel-chat-widget");
      if (existingScript) {
        existingScript.remove();
      }
      return;
    }

    const existingScript = document.getElementById("highlevel-chat-widget");
    if (existingScript) {
      const existingWidgetId = existingScript.getAttribute("data-widget-id");
      if (existingWidgetId === settings.liveChatWidgetId) {
        return;
      }
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "highlevel-chat-widget";
    script.src = "https://widgets.leadconnectorhq.com/loader.js";
    script.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com");
    script.setAttribute("data-widget-id", settings.liveChatWidgetId);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("highlevel-chat-widget");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [settings?.liveChatEnabled, settings?.liveChatWidgetId]);
}
