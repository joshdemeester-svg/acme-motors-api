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

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
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
      // Add timeout to prevent indefinite waiting for service worker
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Service worker timeout")), 3000)
      );
      
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise
      ]) as ServiceWorkerRegistration;
      
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      setSubscriptionEndpoint(subscription?.endpoint || null);
    } catch (error) {
      console.error("Error checking subscription:", error);
      // If service worker isn't ready yet, that's ok - user can still subscribe
      setIsSubscribed(false);
      setSubscriptionEndpoint(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (preferences?: PushPreferences) => {
    if (!isSupported) return { success: false, error: "Push notifications not supported" };

    try {
      setIsLoading(true);

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== "granted") {
        return { success: false, error: "Permission denied" };
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidResponse = await fetch('/api/push/vapid-key');
      if (!vapidResponse.ok) {
        return { success: false, error: "Failed to get VAPID key" };
      }
      const vapidPublicKey = await vapidResponse.text();

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON(), preferences })
      });

      if (!response.ok) {
        throw new Error("Server subscription failed");
      }

      setIsSubscribed(true);
      setSubscriptionEndpoint(subscription.endpoint);
      return { success: true, endpoint: subscription.endpoint };
    } catch (error: any) {
      console.error("Subscription error:", error);
      return { success: false, error: error.message || "Subscription failed" };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
      
      setIsSubscribed(false);
      setSubscriptionEndpoint(null);
      return { success: true };
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      return { success: false, error: error.message };
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
    subscribe,
    unsubscribe,
  };
}
