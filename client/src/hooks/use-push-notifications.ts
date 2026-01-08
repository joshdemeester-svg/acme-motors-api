import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

interface PushPreferences {
  preferredMakes?: string[];
  notifyNewListings?: boolean;
  notifyPriceDrops?: boolean;
  notifySpecialOffers?: boolean;
  notifyHotListings?: boolean;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = () => {
      if (!('serviceWorker' in navigator)) {
        setUnsupportedReason("Service workers not supported");
        return false;
      }
      if (!('PushManager' in window)) {
        setUnsupportedReason("Push notifications not supported");
        return false;
      }
      if (!('Notification' in window)) {
        setUnsupportedReason("Notifications not supported");
        return false;
      }
      
      if (isIOS()) {
        setUnsupportedReason("iOS requires adding this site to your Home Screen for push notifications");
        return true;
      }
      
      if (isSafari()) {
        setUnsupportedReason("Safari on macOS requires adding this site to your Dock for push notifications");
        return true;
      }
      
      return true;
    };
    
    const supported = checkSupport();
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      let registration: ServiceWorkerRegistration | null = null;
      for (const reg of registrations) {
        if (reg.active?.scriptURL?.includes('sw.js')) {
          registration = reg;
          break;
        }
      }
      
      if (!registration) {
        setIsSubscribed(false);
        setSubscriptionEndpoint(null);
        setIsLoading(false);
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      setSubscriptionEndpoint(subscription?.endpoint || null);
    } catch (error: any) {
      console.error("Error checking subscription:", error?.message || error);
      setIsSubscribed(false);
      setSubscriptionEndpoint(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (preferences?: PushPreferences) => {
    if (!isSupported) {
      const error = unsupportedReason || "Push notifications not supported in this browser";
      setLastError(error);
      return { success: false, error };
    }

    try {
      setIsLoading(true);
      setLastError(null);

      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        const error = "Push notifications require HTTPS. Please use the published site.";
        setLastError(error);
        return { success: false, error };
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== "granted") {
        const error = perm === "denied" 
          ? "Notification permission was denied. Please enable notifications in your browser settings."
          : "Notification permission was not granted";
        setLastError(error);
        return { success: false, error };
      }

      let registration: ServiceWorkerRegistration;
      try {
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        let existingReg: ServiceWorkerRegistration | null = null;
        
        for (const reg of existingRegistrations) {
          if (reg.active?.scriptURL?.includes('sw.js')) {
            existingReg = reg;
            break;
          }
        }
        
        if (existingReg) {
          registration = existingReg;
        } else {
          registration = await navigator.serviceWorker.register('/sw.js');
        }
        
        if (registration.installing) {
          await new Promise<void>((resolve, reject) => {
            const sw = registration.installing!;
            const timeout = setTimeout(() => reject(new Error("Service worker activation timeout")), 10000);
            
            sw.addEventListener('statechange', () => {
              if (sw.state === 'activated') {
                clearTimeout(timeout);
                resolve();
              } else if (sw.state === 'redundant') {
                clearTimeout(timeout);
                reject(new Error("Service worker became redundant"));
              }
            });
            
            if (sw.state === 'activated') {
              clearTimeout(timeout);
              resolve();
            }
          });
        }
        
        await navigator.serviceWorker.ready;
      } catch (swError: any) {
        let error = `Service worker registration failed: ${swError.message}`;
        
        if (swError.message?.includes('scope')) {
          error = "Push notifications are only available from the homepage. Please navigate there to enable notifications.";
        }
        
        console.error("Service worker error:", swError);
        setLastError(error);
        return { success: false, error };
      }

      let vapidPublicKey: string;
      try {
        const vapidResponse = await fetch('/api/push/vapid-key');
        if (!vapidResponse.ok) {
          const contentType = vapidResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await vapidResponse.json().catch(() => ({}));
            const error = errorData.error || "Failed to get VAPID key from server";
            setLastError(error);
            return { success: false, error };
          } else {
            const error = "Push notification server not configured";
            setLastError(error);
            return { success: false, error };
          }
        }
        vapidPublicKey = await vapidResponse.text();
        
        if (!vapidPublicKey || vapidPublicKey.length < 20) {
          const error = "Invalid VAPID key received from server";
          setLastError(error);
          return { success: false, error };
        }
      } catch (vapidError: any) {
        const error = `Failed to fetch VAPID key: ${vapidError.message}`;
        setLastError(error);
        return { success: false, error };
      }

      let subscription: PushSubscription;
      try {
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      } catch (pushError: any) {
        let error = pushError.message || "Push subscription failed";
        
        if (pushError.name === 'NotAllowedError') {
          error = "Push notifications were blocked. Please check your browser settings.";
        } else if (pushError.name === 'AbortError') {
          error = "Push subscription was aborted. Please try again.";
        } else if (pushError.name === 'InvalidStateError') {
          error = "Push subscription is in an invalid state. Try refreshing the page.";
        } else if (pushError.message?.includes('applicationServerKey')) {
          error = "Invalid server configuration for push notifications.";
        }
        
        console.error("Push subscription error:", pushError);
        setLastError(error);
        return { success: false, error };
      }

      try {
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subscription: subscription.toJSON(), 
            preferences 
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = errorData.error || "Server failed to save subscription";
          setLastError(error);
          return { success: false, error };
        }
      } catch (serverError: any) {
        const error = `Failed to save subscription: ${serverError.message}`;
        setLastError(error);
        return { success: false, error };
      }

      setIsSubscribed(true);
      setSubscriptionEndpoint(subscription.endpoint);
      return { success: true, endpoint: subscription.endpoint };
    } catch (error: any) {
      const errorMessage = error.message || "Subscription failed";
      console.error("Subscription error:", error);
      setLastError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, unsupportedReason]);

  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true);
      setLastError(null);
      
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
          });
        }
      }
      
      setIsSubscribed(false);
      setSubscriptionEndpoint(null);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || "Unsubscribe failed";
      console.error("Unsubscribe error:", error);
      setLastError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscriptionEndpoint,
    lastError,
    unsupportedReason,
    subscribe,
    unsubscribe,
  };
}
