import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { SiteSettings } from "@shared/schema";
import { 
  Plug, 
  MessageSquare, 
  Check, 
  Eye, 
  EyeOff, 
  Loader2,
  ExternalLink,
  Bell
} from "lucide-react";

export default function IntegrationsPage() {
  const [ghlApiToken, setGhlApiToken] = useState("");
  const [showGhlToken, setShowGhlToken] = useState(false);
  const [ghlTestStatus, setGhlTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [ghlTestMessage, setGhlTestMessage] = useState("");
  const [formData, setFormData] = useState<Partial<SiteSettings>>({});
  const [initialized, setInitialized] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings && !initialized) {
      setFormData({
        ghlLocationId: settings.ghlLocationId || "",
        liveChatEnabled: settings.liveChatEnabled || false,
        liveChatWidgetId: settings.liveChatWidgetId || "",
      });
      setInitialized(true);
    }
  }, [settings, initialized]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SiteSettings>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  const testGhlConnection = async () => {
    setGhlTestStatus("testing");
    try {
      const res = await fetch("/api/settings/test-ghl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: ghlApiToken || undefined,
          locationId: formData.ghlLocationId || settings?.ghlLocationId || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGhlTestStatus("success");
        setGhlTestMessage(data.message || "Connection verified!");
        toast({ title: "Connection Successful", description: data.message });
      } else {
        setGhlTestStatus("error");
        setGhlTestMessage(data.error || "Connection failed");
        toast({ title: "Connection Failed", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      setGhlTestStatus("error");
      setGhlTestMessage("Failed to test connection");
      toast({ title: "Error", description: "Failed to test connection", variant: "destructive" });
    }
  };

  const handleSave = () => {
    const dataToSave = { ...settings, ...formData };
    if (ghlApiToken) {
      (dataToSave as any).ghlApiToken = ghlApiToken;
    }
    console.log("[Integrations] Saving data:", { liveChatEnabled: dataToSave.liveChatEnabled, liveChatWidgetId: dataToSave.liveChatWidgetId });
    saveMutation.mutate(dataToSave);
  };

  const currentSettings = { ...settings, ...formData };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif">Integrations</h1>
          <p className="text-muted-foreground">Connect external services to enhance your platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              GoHighLevel Integration
            </CardTitle>
            <CardDescription>Connect your GoHighLevel CRM for lead management, SMS, and automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  ghlTestStatus === "success" ? "bg-green-500/10" : 
                  (settings as any)?.ghlConfigured ? "bg-green-500/10" : "bg-orange-500/10"
                }`}>
                  <Plug className={`h-5 w-5 ${
                    ghlTestStatus === "success" ? "text-green-500" : 
                    (settings as any)?.ghlConfigured ? "text-green-500" : "text-orange-500"
                  }`} />
                </div>
                <div>
                  <h4 className="font-medium">GoHighLevel (GHL)</h4>
                  <p className="text-sm text-muted-foreground">CRM & Marketing Automation</p>
                </div>
                {ghlTestStatus === "success" ? (
                  <Badge className="gap-1 ml-auto bg-green-600 hover:bg-green-700">
                    <Check className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (settings as any)?.ghlConfigured ? (
                  <Badge className="gap-1 ml-auto bg-green-600 hover:bg-green-700">
                    <Check className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-auto">
                    Not Configured
                  </Badge>
                )}
              </div>
              
              {(settings as any)?.ghlConfigured && (
                <div className="text-sm text-muted-foreground">
                  <p>Configuration source: <span className="font-medium">{(settings as any)?.ghlSource === "env" ? "Environment Variables" : "Database"}</span></p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ghlApiToken">
                API Token {(settings as any)?.ghlConfigured && !ghlApiToken && (
                  <span className="text-green-600 text-xs">(configured)</span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="ghlApiToken"
                    type={showGhlToken ? "text" : "password"}
                    value={ghlApiToken}
                    onChange={(e) => setGhlApiToken(e.target.value)}
                    placeholder={(settings as any)?.ghlConfigured ? "Enter new token to update" : "Enter your GoHighLevel API token"}
                    className="pr-10"
                    data-testid="input-ghl-api-token"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGhlToken(!showGhlToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showGhlToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API token from GHL Settings → Integrations → Private Integrations
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ghlLocationId">Location ID</Label>
              <Input
                id="ghlLocationId"
                value={formData.ghlLocationId ?? settings?.ghlLocationId ?? ""}
                onChange={(e) => setFormData({ ...formData, ghlLocationId: e.target.value })}
                placeholder="Enter your GoHighLevel location ID"
                data-testid="input-ghl-location-id"
              />
              <p className="text-xs text-muted-foreground">Find this in your GHL Settings → Business Profile</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              disabled={ghlTestStatus === "testing"}
              onClick={testGhlConnection}
              data-testid="button-test-ghl-connection"
            >
              {ghlTestStatus === "testing" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</>
              ) : ghlTestStatus === "success" ? (
                <><Check className="h-4 w-4 mr-2 text-green-500" /> Connected</>
              ) : (
                "Test Connection"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Live Chat Widget
            </CardTitle>
            <CardDescription>Enable GoHighLevel live chat on your public website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  (currentSettings.liveChatEnabled) ? "bg-green-500/10" : "bg-muted"
                }`}>
                  <MessageSquare className={`h-5 w-5 ${
                    (currentSettings.liveChatEnabled) ? "text-green-500" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <h4 className="font-medium">Chat Widget Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentSettings.liveChatEnabled ? "Visible on public pages" : "Currently disabled"}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.liveChatEnabled ?? settings?.liveChatEnabled ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, liveChatEnabled: checked })}
                data-testid="switch-live-chat-enabled"
              />
            </div>
            
            {currentSettings.liveChatEnabled && (
              <div className="space-y-2">
                <Label htmlFor="liveChatWidgetId">Widget ID</Label>
                <Input
                  id="liveChatWidgetId"
                  value={formData.liveChatWidgetId ?? settings?.liveChatWidgetId ?? ""}
                  onChange={(e) => setFormData({ ...formData, liveChatWidgetId: e.target.value })}
                  placeholder="Enter your GHL chat widget ID"
                  data-testid="input-live-chat-widget-id"
                />
                <p className="text-xs text-muted-foreground">
                  Find this in GHL → Sites → Chat Widget → Get Code
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications (VAPID)
            </CardTitle>
            <CardDescription>Browser push notification configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-500/10">
                  <Bell className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium">VAPID Keys</h4>
                  <p className="text-sm text-muted-foreground">
                    Required for browser push notifications
                  </p>
                </div>
                <Badge className="gap-1 ml-auto bg-green-600 hover:bg-green-700">
                  <Check className="h-3 w-3" />
                  Configured
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              VAPID keys are managed through environment variables. Contact your administrator to update them.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground">More Integrations Coming Soon</CardTitle>
            <CardDescription>
              We're working on additional integrations including payment processing, 
              inventory syndication, and more.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AdminLayout>
  );
}
