import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for push notifications on all pages
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('[SW] Service worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
