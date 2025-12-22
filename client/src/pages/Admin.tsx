import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, DollarSign, Lock, LogOut, Settings, Palette, Image } from "lucide-react";
import type { ConsignmentSubmission, InventoryCar, SiteSettings } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    approved: { variant: "default", icon: <Check className="h-3 w-3" /> },
    rejected: { variant: "destructive", icon: <X className="h-3 w-3" /> },
    available: { variant: "default", icon: <Check className="h-3 w-3" /> },
    sold: { variant: "secondary", icon: <DollarSign className="h-3 w-3" /> },
  };
  const config = variants[status] || variants.pending;
  
  return (
    <Badge variant={config.variant} className="gap-1 capitalize">
      {config.icon}
      {status}
    </Badge>
  );
}

function SettingsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [siteName, setSiteName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D4AF37");
  const [logoUrl, setLogoUrl] = useState("");

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || "PRESTIGE");
      setPrimaryColor(settings.primaryColor || "#D4AF37");
      setLogoUrl(settings.logoUrl || "");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteName, primaryColor, logoUrl: logoUrl || null }),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings Updated", description: "Your changes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <p>Loading settings...</p>;
  }

  const colorPresets = [
    { name: "Gold", value: "#D4AF37" },
    { name: "Silver", value: "#A8A8A8" },
    { name: "Blue", value: "#2563EB" },
    { name: "Red", value: "#DC2626" },
    { name: "Green", value: "#16A34A" },
    { name: "Purple", value: "#9333EA" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Branding
          </CardTitle>
          <CardDescription>Customize your website appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="PRESTIGE"
              data-testid="input-site-name"
            />
          </div>

          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setPrimaryColor(preset.value)}
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    primaryColor === preset.value ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                  data-testid={`color-${preset.name.toLowerCase()}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 p-1 cursor-pointer"
                data-testid="input-color-picker"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#D4AF37"
                className="flex-1"
                data-testid="input-color-hex"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" /> Logo
          </CardTitle>
          <CardDescription>Upload a custom logo for your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              data-testid="input-logo-url"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL for your logo image. Leave empty to use the default car icon.
            </p>
          </div>
          
          {logoUrl && (
            <div className="mt-4">
              <Label>Preview</Label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border bg-card p-4">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-12 w-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="font-serif text-xl font-bold">{siteName}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Preview Changes</h3>
                <p className="text-sm text-muted-foreground">
                  Changes will be applied immediately after saving
                </p>
              </div>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const { data: hasAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["/api/auth/has-admin"],
    queryFn: async () => {
      const res = await fetch("/api/auth/has-admin");
      return res.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Welcome back!" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    },
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Setup failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Admin Account Created", description: "You can now log in with username 'admin'" });
      setUsername("admin");
    },
    onError: (error: Error) => {
      toast({ title: "Setup Failed", description: error.message, variant: "destructive" });
    },
  });

  if (checkingAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const needsSetup = !hasAdmin?.hasAdmin;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl">
            {needsSetup ? "Create Admin Account" : "Admin Login"}
          </CardTitle>
          <CardDescription>
            {needsSetup 
              ? "Set up your admin password to get started" 
              : "Enter your credentials to access the admin panel"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!needsSetup && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                data-testid="input-login-username"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={needsSetup ? "Create a strong password" : "Enter password"}
              data-testid="input-login-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          {needsSetup ? (
            <Button
              className="w-full"
              onClick={() => setupMutation.mutate()}
              disabled={!password || password.length < 6 || setupMutation.isPending}
              data-testid="button-setup-admin"
            >
              {setupMutation.isPending ? "Creating..." : "Create Admin Account"}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => loginMutation.mutate()}
              disabled={!username || !password || loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<ConsignmentSubmission | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [price, setPrice] = useState("");

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery<ConsignmentSubmission[]>({
    queryKey: ["/api/consignments"],
    queryFn: async () => {
      const res = await fetch("/api/consignments");
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const { data: inventory = [], isLoading: loadingInventory } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory/all"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/all");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const res = await fetch(`/api/consignments/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
      toast({ title: "Submission Approved", description: "The vehicle has been added to inventory." });
      setApproveDialogOpen(false);
      setSelectedSubmission(null);
      setPrice("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve submission.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consignments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      toast({ title: "Submission Rejected" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to logout");
      return res.json();
    },
    onSuccess: () => {
      onLogout();
    },
  });

  const pendingSubmissions = submissions.filter(s => s.status === "pending");

  return (
    <>
      <div className="container px-4 py-12 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-serif text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage consignment submissions and inventory.</p>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()} className="gap-2" data-testid="button-logout">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions" className="gap-2">
              Submissions
              {pendingSubmissions.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingSubmissions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            {loadingSubmissions ? (
              <p>Loading...</p>
            ) : submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No submissions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((sub) => (
                  <Card key={sub.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div>
                        <CardTitle className="font-serif text-xl">
                          {sub.year} {sub.make} {sub.model}
                        </CardTitle>
                        <CardDescription>
                          VIN: {sub.vin} | {sub.mileage} miles | {sub.color}
                        </CardDescription>
                      </div>
                      <StatusBadge status={sub.status} />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 text-sm md:grid-cols-2">
                        <div>
                          <span className="font-medium">Contact:</span> {sub.firstName} {sub.lastName}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {sub.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {sub.phone}
                        </div>
                        <div>
                          <span className="font-medium">Condition:</span> {sub.condition} | {sub.accidentHistory}
                        </div>
                      </div>
                      
                      {sub.photos && sub.photos.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Photos ({sub.photos.length}):</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sub.photos.map((photo, i) => (
                              <img
                                key={i}
                                src={photo}
                                alt={`Photo ${i + 1}`}
                                className="h-20 w-20 rounded-md border object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {sub.description && (
                        <div>
                          <span className="text-sm font-medium">Description:</span>
                          <p className="mt-1 text-sm text-muted-foreground">{sub.description}</p>
                        </div>
                      )}

                      {sub.status === "pending" && (
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setApproveDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" /> Approve & Set Price
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(sub.id)}
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            {loadingInventory ? (
              <p>Loading...</p>
            ) : inventory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No vehicles in inventory yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventory.map((car) => (
                  <Card key={car.id} className="overflow-hidden">
                    {car.photos && car.photos.length > 0 && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={car.photos[0]}
                          alt={`${car.make} ${car.model}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="font-serif text-lg">
                          {car.year} {car.make} {car.model}
                        </CardTitle>
                        <CardDescription>
                          {car.mileage.toLocaleString()} miles
                        </CardDescription>
                      </div>
                      <StatusBadge status={car.status} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">
                        ${car.price.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Set Price</DialogTitle>
            <DialogDescription>
              Set the listing price for {selectedSubmission?.year} {selectedSubmission?.make} {selectedSubmission?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Listing Price ($)</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g. 45000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSubmission && price) {
                  approveMutation.mutate({ id: selectedSubmission.id, price: parseInt(price) });
                }
              }}
              disabled={!price || approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Admin() {
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      return res.json();
    },
  });

  const handleLoginSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
  };

  const handleLogout = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isAuthenticated = session?.authenticated && session?.isAdmin;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <LoginForm onSuccess={handleLoginSuccess} />
      )}

      <Footer />
    </div>
  );
}
