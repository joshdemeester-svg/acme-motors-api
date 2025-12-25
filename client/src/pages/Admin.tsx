import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Check, X, Clock, DollarSign, Lock, LogOut, Settings, Palette, Image, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, Pencil, Plus, Search, Upload, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { ConsignmentSubmission, InventoryCar, SiteSettings } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';
import { ObjectUploader } from "@/components/ObjectUploader";
import { useUpload } from "@/hooks/use-upload";

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

function LogoUploadCard({ logoUrl, setLogoUrl, siteName }: { logoUrl: string; setLogoUrl: (url: string) => void; siteName: string }) {
  const { getUploadParameters } = useUpload();
  
  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadedFile.name,
          size: uploadedFile.size,
          contentType: uploadedFile.type || "image/png",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.objectPath);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" /> Logo
        </CardTitle>
        <CardDescription>Upload a custom logo for your website</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {logoUrl ? (
            <div className="relative">
              <div className="rounded-lg border bg-card p-4">
                <img
                  src={logoUrl}
                  alt="Current logo"
                  className="h-16 w-auto max-w-[200px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderCar;
                  }}
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => setLogoUrl("")}
                data-testid="button-remove-logo"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
              <Image className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No logo uploaded</p>
            </div>
          )}
          <div className="flex-1 space-y-3">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={5242880}
              onGetUploadParameters={getUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              {logoUrl ? "Replace Logo" : "Upload Logo"}
            </ObjectUploader>
            <p className="text-xs text-muted-foreground">
              Upload a PNG, JPG, or SVG file (max 5MB). Leave empty to use the default car icon.
            </p>
            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="text-xs">Or enter a URL:</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="text-sm"
                data-testid="input-logo-url"
              />
            </div>
          </div>
        </div>
        
        {logoUrl && (
          <div className="mt-4 border-t pt-4">
            <Label className="text-xs text-muted-foreground">Preview in navbar:</Label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border bg-card p-3">
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-8 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="font-serif text-lg font-bold">{siteName}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SettingsPanel({ onRegisterSave }: { onRegisterSave: (handler: { save: () => void; isPending: boolean } | null) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [siteName, setSiteName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D4AF37");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactAddress1, setContactAddress1] = useState("");
  const [contactAddress2, setContactAddress2] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

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
      setBackgroundColor(settings.backgroundColor || "#000000");
      setLogoUrl(settings.logoUrl || "");
      setContactAddress1(settings.contactAddress1 || "");
      setContactAddress2(settings.contactAddress2 || "");
      setContactPhone(settings.contactPhone || "");
      setContactEmail(settings.contactEmail || "");
      setFacebookUrl(settings.facebookUrl || "");
      setInstagramUrl(settings.instagramUrl || "");
      setTwitterUrl(settings.twitterUrl || "");
      setYoutubeUrl(settings.youtubeUrl || "");
      setTiktokUrl(settings.tiktokUrl || "");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          siteName, 
          primaryColor,
          backgroundColor, 
          logoUrl: logoUrl || null,
          contactAddress1: contactAddress1 || null,
          contactAddress2: contactAddress2 || null,
          contactPhone: contactPhone || null,
          contactEmail: contactEmail || null,
          facebookUrl: facebookUrl || null,
          instagramUrl: instagramUrl || null,
          twitterUrl: twitterUrl || null,
          youtubeUrl: youtubeUrl || null,
          tiktokUrl: tiktokUrl || null,
        }),
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

  useEffect(() => {
    onRegisterSave({ save: () => updateMutation.mutate(), isPending: updateMutation.isPending });
    return () => onRegisterSave(null);
  }, [updateMutation.isPending]);

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

          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Black", value: "#000000" },
                { name: "Dark Gray", value: "#1a1a1a" },
                { name: "Charcoal", value: "#333333" },
                { name: "Navy", value: "#0f172a" },
                { name: "Dark Blue", value: "#1e293b" },
                { name: "White", value: "#ffffff" },
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setBackgroundColor(preset.value)}
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    backgroundColor === preset.value ? "border-primary scale-110" : "border-muted"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                  data-testid={`bg-color-${preset.name.toLowerCase().replace(' ', '-')}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-14 p-1 cursor-pointer"
                data-testid="input-bg-color-picker"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
                data-testid="input-bg-color-hex"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <LogoUploadCard logoUrl={logoUrl} setLogoUrl={setLogoUrl} siteName={siteName} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Contact Information
          </CardTitle>
          <CardDescription>Update your footer contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactAddress1">Address Line 1</Label>
            <Input
              id="contactAddress1"
              value={contactAddress1}
              onChange={(e) => setContactAddress1(e.target.value)}
              placeholder="123 Luxury Lane"
              data-testid="input-contact-address1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactAddress2">Address Line 2</Label>
            <Input
              id="contactAddress2"
              value={contactAddress2}
              onChange={(e) => setContactAddress2(e.target.value)}
              placeholder="Beverly Hills, CA 90210"
              data-testid="input-contact-address2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone Number</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
                data-testid="input-contact-phone"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email Address</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="info@prestigeauto.com"
                data-testid="input-contact-email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" /> Social Media
          </CardTitle>
          <CardDescription>Add your social media profile links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook</Label>
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-muted-foreground" />
              <Input
                id="facebookUrl"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/yourpage"
                data-testid="input-facebook-url"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram</Label>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-muted-foreground" />
              <Input
                id="instagramUrl"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourprofile"
                data-testid="input-instagram-url"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterUrl">Twitter / X</Label>
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-muted-foreground" />
              <Input
                id="twitterUrl"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                data-testid="input-twitter-url"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube</Label>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-muted-foreground" />
              <Input
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                data-testid="input-youtube-url"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktokUrl">TikTok</Label>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <Input
                id="tiktokUrl"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@yourhandle"
                data-testid="input-tiktok-url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-muted-foreground"}`}>
      {met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      <span>{text}</span>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

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

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              data-testid="input-login-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              data-testid="input-login-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => loginMutation.mutate()}
            disabled={!username || !password || loginMutation.isPending}
            data-testid="button-login"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("submissions");
  const [saveHandler, setSaveHandler] = useState<{ save: () => void; isPending: boolean } | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ConsignmentSubmission | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [price, setPrice] = useState("");
  
  const [selectedCar, setSelectedCar] = useState<InventoryCar | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editVin, setEditVin] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editMake, setEditMake] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [quickAddVin, setQuickAddVin] = useState("");
  const [quickAddYear, setQuickAddYear] = useState("");
  const [quickAddMake, setQuickAddMake] = useState("");
  const [quickAddModel, setQuickAddModel] = useState("");
  const [quickAddColor, setQuickAddColor] = useState("");
  const [quickAddMileage, setQuickAddMileage] = useState("");
  const [quickAddPrice, setQuickAddPrice] = useState("");
  const [quickAddCondition, setQuickAddCondition] = useState("Excellent");
  const [quickAddDescription, setQuickAddDescription] = useState("");
  const [vinLookupLoading, setVinLookupLoading] = useState(false);

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

  const updateCarStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/inventory/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ 
        title: status === "sold" ? "Marked as Sold" : "Marked as Available",
        description: "Inventory status updated."
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    },
  });

  const updateCarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update car");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ 
        title: "Listing Updated",
        description: "Vehicle information has been saved."
      });
      setEditDialogOpen(false);
      setSelectedCar(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update listing.", variant: "destructive" });
    },
  });

  const openEditDialog = (car: InventoryCar) => {
    setSelectedCar(car);
    setEditVin(car.vin);
    setEditYear(car.year.toString());
    setEditMake(car.make);
    setEditModel(car.model);
    setEditMileage(car.mileage.toString());
    setEditColor(car.color);
    setEditPrice(car.price.toString());
    setEditCondition(car.condition);
    setEditDescription(car.description || "");
    setEditDialogOpen(true);
  };

  const createCarMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create car");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ 
        title: "Vehicle Added",
        description: "New vehicle has been added to inventory."
      });
      setQuickAddDialogOpen(false);
      resetQuickAddForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add vehicle.", variant: "destructive" });
    },
  });

  const resetQuickAddForm = () => {
    setQuickAddVin("");
    setQuickAddYear("");
    setQuickAddMake("");
    setQuickAddModel("");
    setQuickAddColor("");
    setQuickAddMileage("");
    setQuickAddPrice("");
    setQuickAddCondition("Excellent");
    setQuickAddDescription("");
  };

  const handleVinLookup = async () => {
    if (!quickAddVin || quickAddVin.length < 11) {
      toast({ title: "Error", description: "Please enter a valid VIN (at least 11 characters).", variant: "destructive" });
      return;
    }
    
    setVinLookupLoading(true);
    try {
      const res = await fetch(`/api/vin-decode/${quickAddVin}`);
      if (!res.ok) throw new Error("Failed to decode VIN");
      const data = await res.json();
      
      if (data.ErrorCode && data.ErrorCode !== "0") {
        toast({ title: "VIN Not Found", description: "Could not find vehicle information for this VIN.", variant: "destructive" });
        return;
      }
      
      setQuickAddYear(data.ModelYear || "");
      setQuickAddMake(data.Make || "");
      setQuickAddModel(data.Model || "");
      
      toast({ title: "VIN Decoded", description: `Found: ${data.ModelYear} ${data.Make} ${data.Model}` });
    } catch {
      toast({ title: "Error", description: "Failed to lookup VIN.", variant: "destructive" });
    } finally {
      setVinLookupLoading(false);
    }
  };

  const handleQuickAdd = () => {
    const mileage = parseInt(quickAddMileage);
    const price = parseInt(quickAddPrice);
    const year = parseInt(quickAddYear);
    
    if (!quickAddVin || quickAddVin.length < 11) {
      toast({ title: "Error", description: "VIN is required.", variant: "destructive" });
      return;
    }
    if (isNaN(year) || year < 1900) {
      toast({ title: "Error", description: "Valid year is required.", variant: "destructive" });
      return;
    }
    if (!quickAddMake.trim()) {
      toast({ title: "Error", description: "Make is required.", variant: "destructive" });
      return;
    }
    if (!quickAddModel.trim()) {
      toast({ title: "Error", description: "Model is required.", variant: "destructive" });
      return;
    }
    if (isNaN(mileage) || mileage < 0) {
      toast({ title: "Error", description: "Valid mileage is required.", variant: "destructive" });
      return;
    }
    if (isNaN(price) || price < 0) {
      toast({ title: "Error", description: "Valid price is required.", variant: "destructive" });
      return;
    }

    createCarMutation.mutate({
      vin: quickAddVin.toUpperCase(),
      year,
      make: quickAddMake.trim(),
      model: quickAddModel.trim(),
      color: quickAddColor.trim() || "Unknown",
      mileage,
      price,
      condition: quickAddCondition || "Excellent",
      description: quickAddDescription.trim(),
      photos: [],
      status: "available",
    });
  };

  const handleSaveEdit = () => {
    if (!selectedCar) return;
    
    const data: Record<string, unknown> = {};
    
    if (editVin.trim() && editVin.trim().length >= 11) data.vin = editVin.trim().toUpperCase();
    
    const yearNum = parseInt(editYear);
    if (!isNaN(yearNum) && yearNum > 0) data.year = yearNum;
    
    if (editMake.trim()) data.make = editMake.trim();
    if (editModel.trim()) data.model = editModel.trim();
    
    const mileageNum = parseInt(editMileage);
    if (!isNaN(mileageNum) && mileageNum >= 0) data.mileage = mileageNum;
    
    if (editColor.trim()) data.color = editColor.trim();
    
    const priceNum = parseInt(editPrice);
    if (!isNaN(priceNum) && priceNum >= 0) data.price = priceNum;
    
    if (editCondition.trim()) data.condition = editCondition.trim();
    data.description = editDescription.trim();

    if (Object.keys(data).length === 0) {
      toast({ title: "Error", description: "Please fill in at least one field.", variant: "destructive" });
      return;
    }

    updateCarMutation.mutate({ id: selectedCar.id, data });
  };

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
          <div className="flex items-center gap-2">
            {activeTab === "settings" && saveHandler && (
              <Button 
                onClick={() => saveHandler.save()} 
                disabled={saveHandler.isPending}
                data-testid="button-save-settings"
              >
                {saveHandler.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
            <Button variant="outline" onClick={() => logoutMutation.mutate()} className="gap-2" data-testid="button-logout">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            <div className="flex justify-end">
              <Button onClick={() => setQuickAddDialogOpen(true)} className="gap-2" data-testid="button-quick-add">
                <Plus className="h-4 w-4" /> Quick Add Vehicle
              </Button>
            </div>
            {loadingInventory ? (
              <p>Loading...</p>
            ) : inventory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No vehicles in inventory yet. Use Quick Add to add your first vehicle!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventory.map((car) => (
                  <Card key={car.id} className="overflow-hidden">
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <img
                        src={car.photos && car.photos.length > 0 ? car.photos[0] : placeholderCar}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full object-cover"
                      />
                      {(!car.photos || car.photos.length === 0) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-white font-semibold text-lg">Photo Coming Soon</span>
                        </div>
                      )}
                    </div>
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
                    <CardContent className="space-y-4">
                      <div className="text-2xl font-bold text-primary">
                        ${car.price.toLocaleString()}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(car)}
                          className="gap-2"
                          data-testid={`button-edit-${car.id}`}
                        >
                          <Pencil className="h-3 w-3" /> Edit Listing
                        </Button>
                        {car.status === "available" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCarStatusMutation.mutate({ id: car.id, status: "sold" })}
                            disabled={updateCarStatusMutation.isPending}
                            data-testid={`button-mark-sold-${car.id}`}
                          >
                            Mark as Sold
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCarStatusMutation.mutate({ id: car.id, status: "available" })}
                            disabled={updateCarStatusMutation.isPending}
                            data-testid={`button-mark-available-${car.id}`}
                          >
                            Mark as Available
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel onRegisterSave={setSaveHandler} />
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

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          (document.activeElement as HTMLElement)?.blur();
        }
        setEditDialogOpen(open);
      }}>
        <DialogContent 
          className="flex max-h-[85vh] flex-col sm:max-w-lg"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              (document.activeElement as HTMLElement)?.blur();
            }
          }}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>
              Update the vehicle information for this listing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="editVin">VIN</Label>
              <Input
                id="editVin"
                value={editVin}
                onChange={(e) => setEditVin(e.target.value.toUpperCase())}
                placeholder="17-character VIN"
                maxLength={17}
                data-testid="input-edit-vin"
              />
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editYear">Year</Label>
                <Input
                  id="editYear"
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  data-testid="input-edit-year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMake">Make</Label>
                <Input
                  id="editMake"
                  value={editMake}
                  onChange={(e) => setEditMake(e.target.value)}
                  data-testid="input-edit-make"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editModel">Model</Label>
                <Input
                  id="editModel"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  data-testid="input-edit-model"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editColor">Color</Label>
                <Input
                  id="editColor"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  data-testid="input-edit-color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMileage">Mileage</Label>
                <Input
                  id="editMileage"
                  type="number"
                  value={editMileage}
                  onChange={(e) => setEditMileage(e.target.value)}
                  data-testid="input-edit-mileage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPrice">Price ($)</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  data-testid="input-edit-price"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCondition">Condition</Label>
              <Input
                id="editCondition"
                value={editCondition}
                onChange={(e) => setEditCondition(e.target.value)}
                placeholder="e.g. Excellent, Good, Fair"
                data-testid="input-edit-condition"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter vehicle description..."
                rows={3}
                data-testid="input-edit-description"
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 flex-col gap-2 sm:flex-row border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                (document.activeElement as HTMLElement)?.blur();
                setEditDialogOpen(false);
              }} 
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                (document.activeElement as HTMLElement)?.blur();
                handleSaveEdit();
              }}
              disabled={updateCarMutation.isPending}
              data-testid="button-save-edit"
              className="w-full sm:w-auto"
            >
              {updateCarMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quickAddDialogOpen} onOpenChange={(open) => {
        if (!open) {
          (document.activeElement as HTMLElement)?.blur();
        }
        setQuickAddDialogOpen(open);
      }}>
        <DialogContent 
          className="flex max-h-[85vh] flex-col sm:max-w-lg"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              (document.activeElement as HTMLElement)?.blur();
            }
          }}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Quick Add Vehicle</DialogTitle>
            <DialogDescription>
              Enter a VIN to auto-fill vehicle details, then add mileage and price.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="quickAddVin">VIN</Label>
              <div className="flex gap-2">
                <Input
                  id="quickAddVin"
                  value={quickAddVin}
                  onChange={(e) => setQuickAddVin(e.target.value.toUpperCase())}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="flex-1"
                  data-testid="input-quick-add-vin"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleVinLookup}
                  disabled={vinLookupLoading || quickAddVin.length < 11}
                  className="gap-2"
                  data-testid="button-vin-lookup"
                >
                  <Search className="h-4 w-4" />
                  {vinLookupLoading ? "Looking up..." : "Lookup"}
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quickAddYear">Year</Label>
                <Input
                  id="quickAddYear"
                  type="number"
                  value={quickAddYear}
                  onChange={(e) => setQuickAddYear(e.target.value)}
                  placeholder="e.g. 2021"
                  data-testid="input-quick-add-year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickAddMake">Make</Label>
                <Input
                  id="quickAddMake"
                  value={quickAddMake}
                  onChange={(e) => setQuickAddMake(e.target.value)}
                  placeholder="e.g. Ford"
                  data-testid="input-quick-add-make"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickAddModel">Model</Label>
                <Input
                  id="quickAddModel"
                  value={quickAddModel}
                  onChange={(e) => setQuickAddModel(e.target.value)}
                  placeholder="e.g. Mustang"
                  data-testid="input-quick-add-model"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickAddColor">Color</Label>
                <Input
                  id="quickAddColor"
                  value={quickAddColor}
                  onChange={(e) => setQuickAddColor(e.target.value)}
                  placeholder="e.g. Red"
                  data-testid="input-quick-add-color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickAddMileage">Mileage *</Label>
                <Input
                  id="quickAddMileage"
                  type="number"
                  value={quickAddMileage}
                  onChange={(e) => setQuickAddMileage(e.target.value)}
                  placeholder="e.g. 25000"
                  data-testid="input-quick-add-mileage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quickAddPrice">Price ($) *</Label>
                <Input
                  id="quickAddPrice"
                  type="number"
                  value={quickAddPrice}
                  onChange={(e) => setQuickAddPrice(e.target.value)}
                  placeholder="e.g. 45000"
                  data-testid="input-quick-add-price"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quickAddCondition">Condition</Label>
              <Input
                id="quickAddCondition"
                value={quickAddCondition}
                onChange={(e) => setQuickAddCondition(e.target.value)}
                placeholder="e.g. Excellent, Good, Fair"
                data-testid="input-quick-add-condition"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quickAddDescription">Description (optional)</Label>
              <Textarea
                id="quickAddDescription"
                value={quickAddDescription}
                onChange={(e) => setQuickAddDescription(e.target.value)}
                placeholder="Enter vehicle description..."
                rows={3}
                data-testid="input-quick-add-description"
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 flex-col gap-2 sm:flex-row border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => { 
                (document.activeElement as HTMLElement)?.blur();
                setQuickAddDialogOpen(false); 
                resetQuickAddForm(); 
              }} 
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                (document.activeElement as HTMLElement)?.blur();
                handleQuickAdd();
              }}
              disabled={createCarMutation.isPending}
              data-testid="button-add-vehicle"
              className="w-full sm:w-auto"
            >
              {createCarMutation.isPending ? "Adding..." : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Admin() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);

  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading && !session?.authenticated && loginRef.current) {
      loginRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isLoading, session]);

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
        <div ref={loginRef}>
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      )}

      <Footer />
    </div>
  );
}
