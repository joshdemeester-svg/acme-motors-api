import { useState } from "react";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";

export function PushNotificationPrompt() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('push-prompt-dismissed') === 'true';
    }
    return false;
  });
  
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const { toast } = useToast();

  if (!isSupported || isSubscribed || dismissed || isLoading) {
    return null;
  }

  const handleSubscribe = async () => {
    const result = await subscribe({
      notifyNewListings: true,
      notifyPriceDrops: true,
      notifySpecialOffers: true,
    });

    if (result.success) {
      toast({
        title: "Notifications enabled!",
        description: "You'll receive alerts for new listings and price drops.",
      });
    } else if (result.error === "Permission denied") {
      toast({
        title: "Notifications blocked",
        description: "You can enable them in your browser settings.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('push-prompt-dismissed', 'true');
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-sm shadow-lg border-[#D4AF37]/30 bg-gray-900" data-testid="push-notification-prompt">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-[#D4AF37]/20">
            <Bell className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-white text-sm mb-1">Stay Updated</h3>
            <p className="text-gray-400 text-xs mb-3">
              Get instant alerts for new luxury listings and price drops
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="bg-[#D4AF37] hover:bg-[#B8960C] text-black text-xs"
                data-testid="button-enable-notifications"
              >
                <Check className="w-3 h-3 mr-1" />
                Enable
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="text-gray-400 text-xs"
                data-testid="button-dismiss-notifications"
              >
                Not now
              </Button>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-300"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
