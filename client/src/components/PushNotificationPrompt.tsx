import { useState } from "react";
import { Bell, X, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";

const PREFERENCE_OPTIONS = [
  { key: "notifyNewListings", label: "New Listings", description: "New vehicles added" },
  { key: "notifyPriceDrops", label: "Price Drops", description: "Price reductions" },
  { key: "notifyHotListings", label: "Hot Vehicles", description: "Popular listings" },
  { key: "notifySpecialOffers", label: "Special Offers", description: "Deals & promotions" },
];

export function PushNotificationPrompt() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('push-prompt-dismissed') === 'true';
    }
    return false;
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    notifyNewListings: true,
    notifyPriceDrops: true,
    notifyHotListings: true,
    notifySpecialOffers: true,
  });
  
  const { isSupported, isSubscribed, isLoading, subscribe, lastError } = usePushNotifications();
  const { toast } = useToast();

  if (!isSupported || isSubscribed || dismissed || isLoading) {
    return null;
  }

  const handleSubscribe = async () => {
    const result = await subscribe(preferences);

    if (result.success) {
      const enabledCount = Object.values(preferences).filter(Boolean).length;
      toast({
        title: "Notifications enabled!",
        description: `You'll receive ${enabledCount} type${enabledCount !== 1 ? 's' : ''} of alerts.`,
      });
    } else {
      toast({
        title: "Could not enable notifications",
        description: result.error || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('push-prompt-dismissed', 'true');
  };

  const togglePreference = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const hasAnyPreference = Object.values(preferences).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="push-notification-prompt">
      <Card className="max-w-sm shadow-lg border-[#D4AF37]/30 bg-gray-900 mx-4">
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
            
            {showPreferences && (
              <div className="space-y-2 mb-3 p-2 bg-gray-800/50 rounded-md">
                {PREFERENCE_OPTIONS.map((opt) => (
                  <label 
                    key={opt.key} 
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <Checkbox
                      checked={preferences[opt.key as keyof typeof preferences]}
                      onCheckedChange={() => togglePreference(opt.key)}
                      className="border-gray-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                    />
                    <span className="text-gray-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSubscribe}
                disabled={isLoading || !hasAnyPreference}
                className="bg-[#D4AF37] hover:bg-[#B8960C] text-black text-xs"
                data-testid="button-enable-notifications"
              >
                <Check className="w-3 h-3 mr-1" />
                Enable
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowPreferences(!showPreferences)}
                className="text-gray-400 text-xs"
                data-testid="button-customize-notifications"
              >
                <Settings className="w-3 h-3 mr-1" />
                {showPreferences ? 'Hide' : 'Customize'}
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
    </div>
  );
}
