import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Phone, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Bell, 
  Plug, 
  FileText,
  Users,
  Shield,
  Loader2,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SiteSettings } from "@shared/schema";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("branding");
  const [ghlApiToken, setGhlApiToken] = useState("");
  const [showGhlToken, setShowGhlToken] = useState(false);
  const [ghlTestStatus, setGhlTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [ghlTestMessage, setGhlTestMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const { data: session } = useQuery({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const isMasterAdmin = session?.isMasterAdmin;

  const [formData, setFormData] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

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
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif">Settings</h1>
          <p className="text-muted-foreground">
            Configure your dealership website
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-max min-w-full sm:w-auto gap-1">
              <TabsTrigger value="branding" className="gap-1.5 px-3 whitespace-nowrap">
                <Palette className="h-4 w-4" />
                <span>Branding</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-1.5 px-3 whitespace-nowrap">
                <Phone className="h-4 w-4" />
                <span>Contact</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 px-3 whitespace-nowrap">
                <Bell className="h-4 w-4" />
                <span>Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="gap-1.5 px-3 whitespace-nowrap">
                <FileText className="h-4 w-4" />
                <span>Legal</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-1.5 px-3 whitespace-nowrap">
                <Plug className="h-4 w-4" />
                <span>Integrations</span>
              </TabsTrigger>
              {isMasterAdmin && (
                <TabsTrigger value="users" className="gap-1.5 px-3 whitespace-nowrap">
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="branding" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Identity</CardTitle>
                <CardDescription>Basic branding settings for your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={formData.siteName || ""}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                    placeholder="Your Dealership Name"
                    data-testid="input-site-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor || "#000000"}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-16 h-10 p-1"
                      data-testid="input-primary-color"
                    />
                    <Input
                      value={formData.primaryColor || ""}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How customers can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone || ""}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      data-testid="input-contact-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail || ""}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="sales@yourdealership.com"
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactAddress1">Address Line 1</Label>
                  <Input
                    id="contactAddress1"
                    value={formData.contactAddress1 || ""}
                    onChange={(e) => setFormData({ ...formData, contactAddress1: e.target.value })}
                    placeholder="123 Main Street"
                    data-testid="input-address-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactAddress2">Address Line 2</Label>
                  <Input
                    id="contactAddress2"
                    value={formData.contactAddress2 || ""}
                    onChange={(e) => setFormData({ ...formData, contactAddress2: e.target.value })}
                    placeholder="City, State ZIP"
                    data-testid="input-address-2"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Links to your social profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" /> Facebook
                    </Label>
                    <Input
                      value={formData.facebookUrl || ""}
                      onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/yourdealership"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram
                    </Label>
                    <Input
                      value={formData.instagramUrl || ""}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/yourdealership"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" /> Twitter/X
                    </Label>
                    <Input
                      value={formData.twitterUrl || ""}
                      onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                      placeholder="https://twitter.com/yourdealership"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" /> YouTube
                    </Label>
                    <Input
                      value={formData.youtubeUrl || ""}
                      onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                      placeholder="https://youtube.com/@yourdealership"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive alerts for new submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPhone1">Admin Phone 1</Label>
                  <Input
                    id="adminPhone1"
                    value={formData.adminNotifyPhone1 || ""}
                    onChange={(e) => setFormData({ ...formData, adminNotifyPhone1: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPhone2">Admin Phone 2 (Optional)</Label>
                  <Input
                    id="adminPhone2"
                    value={formData.adminNotifyPhone2 || ""}
                    onChange={(e) => setFormData({ ...formData, adminNotifyPhone2: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  These numbers will receive SMS notifications for new consignment submissions and buyer inquiries.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <CardDescription>Your dealership's privacy policy (Markdown supported)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.privacyPolicy || ""}
                  onChange={(e) => setFormData({ ...formData, privacyPolicy: e.target.value })}
                  placeholder="Enter your privacy policy..."
                  rows={10}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terms of Service</CardTitle>
                <CardDescription>Your dealership's terms of service (Markdown supported)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.termsOfService || ""}
                  onChange={(e) => setFormData({ ...formData, termsOfService: e.target.value })}
                  placeholder="Enter your terms of service..."
                  rows={10}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="h-5 w-5" /> GoHighLevel Integration
                </CardTitle>
                <CardDescription>Connect your GoHighLevel CRM for lead management and automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      ghlTestStatus === "success" ? "bg-green-500/10" : 
                      settings?.ghlApiToken ? "bg-green-500/10" : "bg-orange-500/10"
                    }`}>
                      <Plug className={`h-5 w-5 ${
                        ghlTestStatus === "success" ? "text-green-500" : 
                        settings?.ghlApiToken ? "text-green-500" : "text-orange-500"
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
                    ) : settings?.ghlApiToken ? (
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ghlApiToken">
                    API Token {settings?.ghlApiToken && !ghlApiToken && <span className="text-green-600 text-xs">(configured)</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="ghlApiToken"
                        type={showGhlToken ? "text" : "password"}
                        value={ghlApiToken}
                        onChange={(e) => setGhlApiToken(e.target.value)}
                        placeholder={settings?.ghlApiToken ? "Enter new token to update" : "Enter your GoHighLevel API token"}
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ghlLocationId">Location ID</Label>
                  <Input
                    id="ghlLocationId"
                    value={formData.ghlLocationId || ""}
                    onChange={(e) => setFormData({ ...formData, ghlLocationId: e.target.value })}
                    placeholder="Enter your GoHighLevel location ID"
                    data-testid="input-ghl-location-id"
                  />
                  <p className="text-xs text-muted-foreground">Find this in your GHL Settings → Business Profile</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => {
                    const dataToSave = { ...formData };
                    if (ghlApiToken) {
                      (dataToSave as any).ghlApiToken = ghlApiToken;
                    }
                    saveMutation.mutate(dataToSave);
                  }} 
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  disabled={ghlTestStatus === "testing"}
                  onClick={async () => {
                    setGhlTestStatus("testing");
                    try {
                      const res = await fetch("/api/ghl/test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          apiToken: ghlApiToken || undefined,
                          locationId: formData.ghlLocationId || undefined
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
                  }}
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
          </TabsContent>

          {isMasterAdmin && (
            <TabsContent value="users" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage admin users (Master Admin only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    User management will be migrated here from the legacy admin panel.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
