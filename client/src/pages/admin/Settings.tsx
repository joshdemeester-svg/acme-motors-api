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
  EyeOff,
  Menu,
  Star,
  Plus,
  Trash2,
  Edit2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { SiteSettings, Testimonial } from "@shared/schema";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("branding");
  const [ghlApiToken, setGhlApiToken] = useState("");
  const [showGhlToken, setShowGhlToken] = useState(false);
  const [ghlTestStatus, setGhlTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [ghlTestMessage, setGhlTestMessage] = useState("");
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    customerName: "",
    customerLocation: "",
    vehicleSold: "",
    rating: 5,
    content: "",
    featured: false,
  });
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

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/all"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials/all");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: async (data: typeof testimonialForm) => {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, approved: true }),
      });
      if (!res.ok) throw new Error("Failed to create testimonial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/featured"] });
      setTestimonialDialogOpen(false);
      resetTestimonialForm();
      toast({ title: "Testimonial added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add testimonial", variant: "destructive" });
    },
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof testimonialForm> }) => {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update testimonial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/featured"] });
      setTestimonialDialogOpen(false);
      setEditingTestimonial(null);
      resetTestimonialForm();
      toast({ title: "Testimonial updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update testimonial", variant: "destructive" });
    },
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete testimonial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/featured"] });
      toast({ title: "Testimonial deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete testimonial", variant: "destructive" });
    },
  });

  const resetTestimonialForm = () => {
    setTestimonialForm({
      customerName: "",
      customerLocation: "",
      vehicleSold: "",
      rating: 5,
      content: "",
      featured: false,
    });
  };

  const openEditTestimonial = (t: Testimonial) => {
    setEditingTestimonial(t);
    setTestimonialForm({
      customerName: t.customerName,
      customerLocation: t.customerLocation || "",
      vehicleSold: t.vehicleSold || "",
      rating: t.rating || 5,
      content: t.content,
      featured: t.featured || false,
    });
    setTestimonialDialogOpen(true);
  };

  const handleTestimonialSubmit = () => {
    if (editingTestimonial) {
      updateTestimonialMutation.mutate({ id: editingTestimonial.id, data: testimonialForm });
    } else {
      createTestimonialMutation.mutate(testimonialForm);
    }
  };

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
              <TabsTrigger value="menus" className="gap-1.5 px-3 whitespace-nowrap">
                <Menu className="h-4 w-4" />
                <span>Menus</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="gap-1.5 px-3 whitespace-nowrap">
                <FileText className="h-4 w-4" />
                <span>Legal</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-1.5 px-3 whitespace-nowrap">
                <Plug className="h-4 w-4" />
                <span>Integrations</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1.5 px-3 whitespace-nowrap">
                <Star className="h-4 w-4" />
                <span>Reviews</span>
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

          <TabsContent value="menus" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Navigation Menu Labels</CardTitle>
                <CardDescription>Customize the text shown in your website's main navigation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="menuLabelHome">Home</Label>
                    <Input
                      id="menuLabelHome"
                      value={formData.menuLabelHome || ""}
                      onChange={(e) => setFormData({ ...formData, menuLabelHome: e.target.value })}
                      placeholder="Home"
                      data-testid="input-menu-label-home"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="menuLabelInventory">Inventory</Label>
                    <Input
                      id="menuLabelInventory"
                      value={formData.menuLabelInventory || ""}
                      onChange={(e) => setFormData({ ...formData, menuLabelInventory: e.target.value })}
                      placeholder="Inventory"
                      data-testid="input-menu-label-inventory"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="menuLabelConsign">Consign</Label>
                    <Input
                      id="menuLabelConsign"
                      value={formData.menuLabelConsign || ""}
                      onChange={(e) => setFormData({ ...formData, menuLabelConsign: e.target.value })}
                      placeholder="Consign"
                      data-testid="input-menu-label-consign"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="menuLabelTradeIn">Trade-In</Label>
                    <Input
                      id="menuLabelTradeIn"
                      value={formData.menuLabelTradeIn || ""}
                      onChange={(e) => setFormData({ ...formData, menuLabelTradeIn: e.target.value })}
                      placeholder="Trade-In"
                      data-testid="input-menu-label-trade-in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="menuLabelAppointments">Appointments</Label>
                    <Input
                      id="menuLabelAppointments"
                      value={formData.menuLabelAppointments || ""}
                      onChange={(e) => setFormData({ ...formData, menuLabelAppointments: e.target.value })}
                      placeholder="Book Appointment"
                      data-testid="input-menu-label-appointments"
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

          <TabsContent value="reviews" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Customer Testimonials</CardTitle>
                  <CardDescription>Manage reviews displayed on your website</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingTestimonial(null);
                    resetTestimonialForm();
                    setTestimonialDialogOpen(true);
                  }}
                  data-testid="button-add-testimonial"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Review
                </Button>
              </CardHeader>
              <CardContent>
                {testimonials.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No testimonials yet. Add your first customer review!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {testimonials.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                        data-testid={`testimonial-row-${t.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{t.customerName}</span>
                            {t.customerLocation && (
                              <span className="text-sm text-muted-foreground">
                                — {t.customerLocation}
                              </span>
                            )}
                            {t.featured && (
                              <Badge variant="secondary" className="text-xs">Featured</Badge>
                            )}
                          </div>
                          <div className="flex mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < (t.rating || 5) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            "{t.content}"
                          </p>
                          {t.vehicleSold && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Vehicle: {t.vehicleSold}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditTestimonial(t)}
                            data-testid={`button-edit-testimonial-${t.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this testimonial?")) {
                                deleteTestimonialMutation.mutate(t.id);
                              }
                            }}
                            data-testid={`button-delete-testimonial-${t.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
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

      <Dialog open={testimonialDialogOpen} onOpenChange={(open) => {
        setTestimonialDialogOpen(open);
        if (!open) {
          setEditingTestimonial(null);
          resetTestimonialForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={testimonialForm.customerName}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, customerName: e.target.value })}
                placeholder="John Smith"
                data-testid="input-testimonial-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerLocation">Location</Label>
              <Input
                id="customerLocation"
                value={testimonialForm.customerLocation}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, customerLocation: e.target.value })}
                placeholder="Miami, FL"
                data-testid="input-testimonial-location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleSold">Vehicle (optional)</Label>
              <Input
                id="vehicleSold"
                value={testimonialForm.vehicleSold}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, vehicleSold: e.target.value })}
                placeholder="2022 Porsche 911 GT3"
                data-testid="input-testimonial-vehicle"
              />
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setTestimonialForm({ ...testimonialForm, rating: star })}
                    className="p-1"
                    data-testid={`button-rating-${star}`}
                  >
                    <Star
                      className={`h-6 w-6 ${star <= testimonialForm.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Review *</Label>
              <Textarea
                id="content"
                value={testimonialForm.content}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
                placeholder="Share what the customer said about their experience..."
                rows={4}
                data-testid="input-testimonial-content"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={testimonialForm.featured}
                onCheckedChange={(checked) => setTestimonialForm({ ...testimonialForm, featured: checked })}
                data-testid="switch-testimonial-featured"
              />
              <Label htmlFor="featured">Featured on homepage</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestimonialDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTestimonialSubmit}
              disabled={!testimonialForm.customerName || !testimonialForm.content || createTestimonialMutation.isPending || updateTestimonialMutation.isPending}
              data-testid="button-save-testimonial"
            >
              {createTestimonialMutation.isPending || updateTestimonialMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
