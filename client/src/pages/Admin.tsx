import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, DollarSign, Lock, LogOut, Settings, Palette, Image, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, Pencil, Plus, Search, Upload, Trash2, Car, Star, MessageSquare, Link, Bell, Plug, FileText, Download, ExternalLink, Eye, EyeOff, Users, Shield, UserPlus, Calculator, BarChart3, ChevronsUpDown, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface NHTSAMake {
  MakeId: number;
  MakeName: string;
}

interface NHTSAModel {
  Model_ID: number;
  Model_Name: string;
}

async function fetchMakesForYear(): Promise<NHTSAMake[]> {
  const res = await fetch(`/api/vehicle-makes`);
  if (!res.ok) throw new Error("Failed to fetch makes");
  return res.json();
}

async function fetchModelsForMakeYear(make: string, year: string): Promise<NHTSAModel[]> {
  const res = await fetch(`/api/vehicle-models/${encodeURIComponent(make)}/${year}`);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}
import type { ConsignmentSubmission, InventoryCar, SiteSettings, BuyerInquiry } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';
import { ObjectUploader } from "@/components/ObjectUploader";
import { useUpload } from "@/hooks/use-upload";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    approved: { variant: "default", icon: <Check className="h-3 w-3" /> },
    listed: { variant: "default", icon: <Car className="h-3 w-3" /> },
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

function LogoUploadCard({ logoUrl, setLogoUrl, siteName, saveMutation }: { logoUrl: string; setLogoUrl: (url: string) => void; siteName: string; saveMutation: { mutate: () => void; isPending: boolean } }) {
  const { getUploadParameters } = useUpload();
  
  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const urlParts = uploadedFile.uploadURL?.split("/") || [];
      const objectId = urlParts[urlParts.length - 1]?.split("?")[0] || "";
      const objectPath = `/objects/uploads/${objectId}`;
      setLogoUrl(objectPath);
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
      <CardFooter>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
          data-testid="button-save-logo"
        >
          {saveMutation.isPending ? "Saving..." : "Save Logo"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function FaviconUploadCard({ faviconUrl, setFaviconUrl, saveMutation }: { faviconUrl: string; setFaviconUrl: (url: string) => void; saveMutation: { mutate: () => void; isPending: boolean } }) {
  const { getUploadParameters } = useUpload();
  
  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const urlParts = uploadedFile.uploadURL?.split("/") || [];
      const objectId = urlParts[urlParts.length - 1]?.split("?")[0] || "";
      const objectPath = `/objects/uploads/${objectId}`;
      setFaviconUrl(objectPath);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" /> Favicon
        </CardTitle>
        <CardDescription>Upload a favicon (browser tab icon) for your website</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {faviconUrl ? (
            <div className="relative">
              <div className="rounded-lg border bg-card p-4">
                <img
                  src={faviconUrl}
                  alt="Current favicon"
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderCar;
                  }}
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => setFaviconUrl("")}
                data-testid="button-remove-favicon"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-center">
              <Image className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No favicon</p>
            </div>
          )}
          <div className="flex-1 space-y-3">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={1048576}
              onGetUploadParameters={getUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              {faviconUrl ? "Replace Favicon" : "Upload Favicon"}
            </ObjectUploader>
            <p className="text-xs text-muted-foreground">
              Upload a PNG, ICO, or SVG file (max 1MB). Recommended size: 32x32 or 64x64 pixels.
            </p>
            <div className="space-y-2">
              <Label htmlFor="faviconUrl" className="text-xs">Or enter a URL:</Label>
              <Input
                id="faviconUrl"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://example.com/favicon.png"
                className="text-sm"
                data-testid="input-favicon-url"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
          data-testid="button-save-favicon"
        >
          {saveMutation.isPending ? "Saving..." : "Save Favicon"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SettingsPanel({ onRegisterSave }: { onRegisterSave: (handler: { save: () => void; isPending: boolean } | null) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingsTab, setSettingsTab] = useState("branding");
  const [siteName, setSiteName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D4AF37");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [mainMenuColor, setMainMenuColor] = useState("#D4AF37");
  const [mainMenuHoverColor, setMainMenuHoverColor] = useState("#B8960C");
  const [contactButtonColor, setContactButtonColor] = useState("#D4AF37");
  const [contactButtonHoverColor, setContactButtonHoverColor] = useState("#B8960C");
  const [menuFontSize, setMenuFontSize] = useState("14");
  const [bodyFontSize, setBodyFontSize] = useState("16");
  const [menuAllCaps, setMenuAllCaps] = useState(true);
  const [vehicleTitleColor, setVehicleTitleColor] = useState("#FFFFFF");
  const [vehiclePriceColor, setVehiclePriceColor] = useState("#FFFFFF");
  const [stepBgColor, setStepBgColor] = useState("#DC2626");
  const [stepNumberColor, setStepNumberColor] = useState("#FFFFFF");
  const [socialIconBgColor, setSocialIconBgColor] = useState("#D4AF37");
  const [socialIconHoverColor, setSocialIconHoverColor] = useState("#B8960C");
  const [calculatorAccentColor, setCalculatorAccentColor] = useState("#3B82F6");
  const [calculatorBgColor, setCalculatorBgColor] = useState("#1E3A5F");
  const [calculatorTextColor, setCalculatorTextColor] = useState("#FFFFFF");
  const [calculatorSliderColor, setCalculatorSliderColor] = useState("#3B82F6");
  const [footerTagline, setFooterTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoWidth, setLogoWidth] = useState("120");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [contactAddress1, setContactAddress1] = useState("");
  const [contactAddress2, setContactAddress2] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [avgDaysToFirstInquiry, setAvgDaysToFirstInquiry] = useState("5");
  const [avgDaysToSell, setAvgDaysToSell] = useState("45");
  const [adminNotifyPhone1, setAdminNotifyPhone1] = useState("");
  const [adminNotifyPhone2, setAdminNotifyPhone2] = useState("");
  const [ghlApiToken, setGhlApiToken] = useState("");
  const [ghlLocationId, setGhlLocationId] = useState("");
  const [ghlConfigured, setGhlConfigured] = useState(false);
  const [ghlTestStatus, setGhlTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [ghlTestMessage, setGhlTestMessage] = useState("");
  const [showGhlToken, setShowGhlToken] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsOfService, setTermsOfService] = useState("");
  const [sellerConfirmationSms, setSellerConfirmationSms] = useState("Thank you for submitting your {year} {make} {model} to {siteName}! We'll review your submission and contact you within 24 hours.");

  const { data: settings, isLoading } = useQuery<SiteSettings & { ghlConfigured?: boolean }>({
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
      setMainMenuColor(settings.mainMenuColor || "#D4AF37");
      setMainMenuHoverColor(settings.mainMenuHoverColor || "#B8960C");
      setContactButtonColor(settings.contactButtonColor || "#D4AF37");
      setContactButtonHoverColor(settings.contactButtonHoverColor || "#B8960C");
      setMenuFontSize(settings.menuFontSize || "14");
      setBodyFontSize(settings.bodyFontSize || "16");
      setMenuAllCaps(settings.menuAllCaps !== false);
      setVehicleTitleColor(settings.vehicleTitleColor || "#FFFFFF");
      setVehiclePriceColor(settings.vehiclePriceColor || "#FFFFFF");
      setStepBgColor(settings.stepBgColor || "#DC2626");
      setStepNumberColor(settings.stepNumberColor || "#FFFFFF");
      setSocialIconBgColor(settings.socialIconBgColor || "#D4AF37");
      setSocialIconHoverColor(settings.socialIconHoverColor || "#B8960C");
      setCalculatorAccentColor(settings.calculatorAccentColor || "#3B82F6");
      setCalculatorBgColor(settings.calculatorBgColor || "#1E3A5F");
      setCalculatorTextColor(settings.calculatorTextColor || "#FFFFFF");
      setCalculatorSliderColor(settings.calculatorSliderColor || "#3B82F6");
      setFooterTagline(settings.footerTagline || "");
      setLogoUrl(settings.logoUrl || "");
      setLogoWidth(settings.logoWidth || "120");
      setFaviconUrl(settings.faviconUrl || "");
      setContactAddress1(settings.contactAddress1 || "");
      setContactAddress2(settings.contactAddress2 || "");
      setContactPhone(settings.contactPhone || "");
      setContactEmail(settings.contactEmail || "");
      setFacebookUrl(settings.facebookUrl || "");
      setInstagramUrl(settings.instagramUrl || "");
      setTwitterUrl(settings.twitterUrl || "");
      setYoutubeUrl(settings.youtubeUrl || "");
      setTiktokUrl(settings.tiktokUrl || "");
      setCommissionRate(String(settings.commissionRate || 10));
      setAvgDaysToFirstInquiry(String(settings.avgDaysToFirstInquiry || 5));
      setAvgDaysToSell(String(settings.avgDaysToSell || 45));
      setAdminNotifyPhone1(settings.adminNotifyPhone1 || "");
      setAdminNotifyPhone2(settings.adminNotifyPhone2 || "");
      setGhlLocationId(settings.ghlLocationId || "");
      setGhlConfigured(settings.ghlConfigured || false);
      setPrivacyPolicy(settings.privacyPolicy || "");
      setTermsOfService(settings.termsOfService || "");
      setSellerConfirmationSms(settings.sellerConfirmationSms || "Thank you for submitting your {year} {make} {model} to {siteName}! We'll review your submission and contact you within 24 hours.");
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
          mainMenuColor,
          mainMenuHoverColor,
          contactButtonColor,
          contactButtonHoverColor,
          menuFontSize,
          bodyFontSize,
          menuAllCaps,
          vehicleTitleColor,
          vehiclePriceColor,
          stepBgColor,
          stepNumberColor,
          socialIconBgColor,
          socialIconHoverColor,
          calculatorAccentColor,
          calculatorBgColor,
          calculatorTextColor,
          calculatorSliderColor,
          footerTagline: footerTagline || null,
          logoUrl: logoUrl || null,
          logoWidth: logoWidth || "120",
          faviconUrl: faviconUrl || null,
          contactAddress1: contactAddress1 || null,
          contactAddress2: contactAddress2 || null,
          contactPhone: contactPhone || null,
          contactEmail: contactEmail || null,
          facebookUrl: facebookUrl || null,
          instagramUrl: instagramUrl || null,
          twitterUrl: twitterUrl || null,
          youtubeUrl: youtubeUrl || null,
          tiktokUrl: tiktokUrl || null,
          commissionRate: parseInt(commissionRate) || 10,
          avgDaysToFirstInquiry: parseInt(avgDaysToFirstInquiry) || 5,
          avgDaysToSell: parseInt(avgDaysToSell) || 45,
          adminNotifyPhone1: adminNotifyPhone1 || null,
          adminNotifyPhone2: adminNotifyPhone2 || null,
          ...(ghlApiToken ? { ghlApiToken } : {}),
          ghlLocationId: ghlLocationId || null,
          privacyPolicy: privacyPolicy || null,
          termsOfService: termsOfService || null,
          sellerConfirmationSms: sellerConfirmationSms || null,
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
    <Tabs value={settingsTab} onValueChange={setSettingsTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="branding" className="flex items-center gap-2" data-testid="tab-branding">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Branding</span>
        </TabsTrigger>
        <TabsTrigger value="contact" className="flex items-center gap-2" data-testid="tab-contact">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Contact</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="tab-notifications">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="consignment" className="flex items-center gap-2" data-testid="tab-consignment">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">Consignment</span>
        </TabsTrigger>
        <TabsTrigger value="legal" className="flex items-center gap-2" data-testid="tab-legal">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Legal</span>
        </TabsTrigger>
        <TabsTrigger value="integrations" className="flex items-center gap-2" data-testid="tab-integrations">
          <Plug className="h-4 w-4" />
          <span className="hidden sm:inline">Integrations</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="branding" className="space-y-6">
        {/* Logo Section - First */}
        <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" /> Logo & Site Name
          </CardTitle>
          <CardDescription>Upload your logo and set your site name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {logoUrl ? (
                <div className="relative">
                  <div className="rounded-lg border bg-card p-4">
                    <img
                      src={logoUrl}
                      alt="Current logo"
                      className="h-20 w-auto max-w-[200px] object-contain"
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
                  <p className="mt-2 text-sm text-muted-foreground">No logo</p>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
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
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    data-testid="input-logo-url"
                  />
                </div>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={async (file) => {
                    const res = await fetch("/api/uploads/request-url", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: file.name,
                        size: file.size,
                        contentType: file.type,
                      }),
                    });
                    if (!res.ok) throw new Error("Failed to get upload URL");
                    const { uploadURL } = await res.json();
                    return { method: "PUT", url: uploadURL };
                  }}
                  onComplete={(result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadedFile = result.successful[0];
                      const urlParts = uploadedFile.uploadURL?.split("/") || [];
                      const objectId = urlParts[urlParts.length - 1]?.split("?")[0] || "";
                      setLogoUrl(`/objects/uploads/${objectId}`);
                    }
                  }}
                  buttonClassName="shrink-0"
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Logo
                </ObjectUploader>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a logo (PNG, JPG, SVG, max 5MB) or enter a URL. Leave empty to use the default car icon.
              </p>
              {logoUrl && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Logo Width</Label>
                    <span className="text-sm text-muted-foreground">{logoWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="300"
                    step="10"
                    value={logoWidth}
                    onChange={(e) => setLogoWidth(e.target.value)}
                    className="w-full accent-primary"
                    data-testid="slider-logo-width"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>60px</span>
                    <span>300px</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-logo"
          >
            {updateMutation.isPending ? "Saving..." : "Save Logo & Name"}
          </Button>
        </CardFooter>
      </Card>

      {/* Favicon Section */}
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" /> Favicon
          </CardTitle>
          <CardDescription>Upload a favicon (browser tab icon) for your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {faviconUrl ? (
                <div className="relative">
                  <div className="rounded-lg border bg-card p-4">
                    <img
                      src={faviconUrl}
                      alt="Current favicon"
                      className="h-12 w-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = placeholderCar;
                      }}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setFaviconUrl("")}
                    data-testid="button-remove-favicon"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-center">
                  <Image className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No favicon</p>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://example.com/favicon.png"
                    data-testid="input-favicon-url"
                  />
                </div>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={1048576}
                  onGetUploadParameters={async (file) => {
                    const res = await fetch("/api/uploads/request-url", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: file.name,
                        size: file.size,
                        contentType: file.type,
                      }),
                    });
                    if (!res.ok) throw new Error("Failed to get upload URL");
                    const { uploadURL } = await res.json();
                    return { method: "PUT", url: uploadURL };
                  }}
                  onComplete={(result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadedFile = result.successful[0];
                      const urlParts = uploadedFile.uploadURL?.split("/") || [];
                      const objectId = urlParts[urlParts.length - 1]?.split("?")[0] || "";
                      setFaviconUrl(`/objects/uploads/${objectId}`);
                    }
                  }}
                  buttonClassName="shrink-0"
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Favicon
                </ObjectUploader>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PNG, ICO, or SVG file (max 1MB). Recommended size: 32x32 or 64x64 pixels.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-favicon"
          >
            {updateMutation.isPending ? "Saving..." : "Save Favicon"}
          </Button>
        </CardFooter>
      </Card>

      {/* Branding Section */}
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Branding & Colors
          </CardTitle>
          <CardDescription>Customize your website appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setPrimaryColor(preset.value)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      primaryColor === preset.value ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    data-testid={`color-${preset.name.toLowerCase()}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
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
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      backgroundColor === preset.value ? "border-primary scale-110" : "border-muted"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    data-testid={`bg-color-${preset.name.toLowerCase().replace(' ', '-')}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
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
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Main Menu Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={mainMenuColor}
                  onChange={(e) => setMainMenuColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-main-menu-color-picker"
                />
                <Input
                  value={mainMenuColor}
                  onChange={(e) => setMainMenuColor(e.target.value)}
                  placeholder="#D4AF37"
                  className="flex-1"
                  data-testid="input-main-menu-color-hex"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Menu Hover Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={mainMenuHoverColor}
                  onChange={(e) => setMainMenuHoverColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-main-menu-hover-color-picker"
                />
                <Input
                  value={mainMenuHoverColor}
                  onChange={(e) => setMainMenuHoverColor(e.target.value)}
                  placeholder="#B8960C"
                  className="flex-1"
                  data-testid="input-main-menu-hover-color-hex"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contact Button Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={contactButtonColor}
                  onChange={(e) => setContactButtonColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-contact-button-color-picker"
                />
                <Input
                  value={contactButtonColor}
                  onChange={(e) => setContactButtonColor(e.target.value)}
                  placeholder="#D4AF37"
                  className="flex-1"
                  data-testid="input-contact-button-color-hex"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contact Hover Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={contactButtonHoverColor}
                  onChange={(e) => setContactButtonHoverColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-contact-button-hover-color-picker"
                />
                <Input
                  value={contactButtonHoverColor}
                  onChange={(e) => setContactButtonHoverColor(e.target.value)}
                  placeholder="#B8960C"
                  className="flex-1"
                  data-testid="input-contact-button-hover-color-hex"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Menu Font Size (px)</Label>
              <Input
                type="number"
                min="10"
                max="24"
                value={menuFontSize}
                onChange={(e) => setMenuFontSize(e.target.value)}
                placeholder="14"
                className="w-full"
                data-testid="input-menu-font-size"
              />
            </div>

            <div className="space-y-2">
              <Label>Body Font Size (px)</Label>
              <Input
                type="number"
                min="12"
                max="24"
                value={bodyFontSize}
                onChange={(e) => setBodyFontSize(e.target.value)}
                placeholder="16"
                className="w-full"
                data-testid="input-body-font-size"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Menu All Caps</Label>
                <p className="text-xs text-muted-foreground">Uppercase menu text</p>
              </div>
              <Switch
                checked={menuAllCaps}
                onCheckedChange={setMenuAllCaps}
                data-testid="switch-menu-all-caps"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-branding"
          >
            {updateMutation.isPending ? "Saving..." : "Save Branding"}
          </Button>
        </CardFooter>
      </Card>

      {/* Vehicle Details Section */}
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" /> Vehicle Details
          </CardTitle>
          <CardDescription>Customize vehicle page appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Vehicle Title Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={vehicleTitleColor}
                  onChange={(e) => setVehicleTitleColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-vehicle-title-color-picker"
                />
                <Input
                  value={vehicleTitleColor}
                  onChange={(e) => setVehicleTitleColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                  data-testid="input-vehicle-title-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Color for vehicle make, model, and year</p>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Price Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={vehiclePriceColor}
                  onChange={(e) => setVehiclePriceColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-vehicle-price-color-picker"
                />
                <Input
                  value={vehiclePriceColor}
                  onChange={(e) => setVehiclePriceColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                  data-testid="input-vehicle-price-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Color for vehicle price display</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-vehicle-details"
          >
            {updateMutation.isPending ? "Saving..." : "Save Vehicle Details"}
          </Button>
        </CardFooter>
      </Card>

      {/* Home Page Section */}
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Home Page
          </CardTitle>
          <CardDescription>Customize home page consignment step colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Step Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={stepBgColor}
                  onChange={(e) => setStepBgColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-step-bg-color-picker"
                />
                <Input
                  value={stepBgColor}
                  onChange={(e) => setStepBgColor(e.target.value)}
                  placeholder="#DC2626"
                  className="flex-1"
                  data-testid="input-step-bg-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Background color for steps 1, 2, 3</p>
            </div>

            <div className="space-y-2">
              <Label>Step Number Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={stepNumberColor}
                  onChange={(e) => setStepNumberColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-step-number-color-picker"
                />
                <Input
                  value={stepNumberColor}
                  onChange={(e) => setStepNumberColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                  data-testid="input-step-number-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Color for the step numbers</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-home-page"
          >
            {updateMutation.isPending ? "Saving..." : "Save Home Page"}
          </Button>
        </CardFooter>
      </Card>
      </TabsContent>

      <TabsContent value="contact" className="space-y-6">
        <Card className="border-white border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Contact Information
            </CardTitle>
            <CardDescription>Update your footer contact details</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerTagline">Footer Tagline</Label>
            <Textarea
              id="footerTagline"
              value={footerTagline}
              onChange={(e) => setFooterTagline(e.target.value)}
              placeholder="Luxury automotive consignment services for discerning collectors and enthusiasts."
              rows={2}
              data-testid="input-footer-tagline"
            />
            <p className="text-xs text-muted-foreground">This text appears below the logo in the footer.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-contact"
          >
            {updateMutation.isPending ? "Saving..." : "Save Contact Info"}
          </Button>
        </CardFooter>
      </Card>

      {/* Social Icon Colors */}
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" /> Social Icon Colors
          </CardTitle>
          <CardDescription>Customize the social media icon button colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={socialIconBgColor}
                  onChange={(e) => setSocialIconBgColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-social-icon-bg-color-picker"
                />
                <Input
                  value={socialIconBgColor}
                  onChange={(e) => setSocialIconBgColor(e.target.value)}
                  placeholder="#D4AF37"
                  className="flex-1"
                  data-testid="input-social-icon-bg-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Background color for social media icon buttons</p>
            </div>

            <div className="space-y-2">
              <Label>Icon Hover Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={socialIconHoverColor}
                  onChange={(e) => setSocialIconHoverColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-social-icon-hover-color-picker"
                />
                <Input
                  value={socialIconHoverColor}
                  onChange={(e) => setSocialIconHoverColor(e.target.value)}
                  placeholder="#B8960C"
                  className="flex-1"
                  data-testid="input-social-icon-hover-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Color when hovering over social media icons</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-social-icon-colors"
          >
            {updateMutation.isPending ? "Saving..." : "Save Icon Colors"}
          </Button>
        </CardFooter>
      </Card>

      {/* Payment Calculator Colors */}
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Payment Calculator Colors
          </CardTitle>
          <CardDescription>Customize the financing calculator appearance on vehicle pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Payment Amount Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={calculatorAccentColor}
                  onChange={(e) => setCalculatorAccentColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-calculator-accent-color-picker"
                />
                <Input
                  value={calculatorAccentColor}
                  onChange={(e) => setCalculatorAccentColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                  data-testid="input-calculator-accent-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Color for the payment number</p>
            </div>

            <div className="space-y-2">
              <Label>Label Text Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={calculatorTextColor}
                  onChange={(e) => setCalculatorTextColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-calculator-text-color-picker"
                />
                <Input
                  value={calculatorTextColor}
                  onChange={(e) => setCalculatorTextColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                  data-testid="input-calculator-text-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Color for "Estimated Monthly Payment"</p>
            </div>

            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={calculatorBgColor}
                  onChange={(e) => setCalculatorBgColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-calculator-bg-color-picker"
                />
                <Input
                  value={calculatorBgColor}
                  onChange={(e) => setCalculatorBgColor(e.target.value)}
                  placeholder="#1E3A5F"
                  className="flex-1"
                  data-testid="input-calculator-bg-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Background color for the display</p>
            </div>

            <div className="space-y-2">
              <Label>Slider Bar Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={calculatorSliderColor}
                  onChange={(e) => setCalculatorSliderColor(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  data-testid="input-calculator-slider-color-picker"
                />
                <Input
                  value={calculatorSliderColor}
                  onChange={(e) => setCalculatorSliderColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                  data-testid="input-calculator-slider-color-hex"
                />
              </div>
              <p className="text-xs text-muted-foreground">Color for the slider bars</p>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div 
              className="text-center p-4 rounded-lg"
              style={{ backgroundColor: calculatorBgColor }}
            >
              <p className="text-sm" style={{ color: calculatorTextColor, opacity: 0.8 }}>Estimated Monthly Payment</p>
              <p 
                className="text-3xl font-bold"
                style={{ color: calculatorAccentColor }}
              >
                $1,250/mo
              </p>
            </div>
            <div className="mt-4 px-4">
              <div className="h-2 rounded-full" style={{ backgroundColor: calculatorSliderColor }}></div>
              <p className="text-xs text-muted-foreground text-center mt-2">Slider preview</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-calculator-colors"
          >
            {updateMutation.isPending ? "Saving..." : "Save Calculator Colors"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" /> Social Media Links
          </CardTitle>
          <CardDescription>Add your social media profile links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook</Label>
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                <Twitter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                <Youtube className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
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
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-social"
          >
            {updateMutation.isPending ? "Saving..." : "Save Social Media"}
          </Button>
        </CardFooter>
      </Card>
      </TabsContent>

      <TabsContent value="consignment" className="space-y-6">
        <Card className="border-white border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Consignment Settings
            </CardTitle>
            <CardDescription>Configure commission rates and timeline estimates for the seller portal</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="10"
                data-testid="input-commission-rate"
              />
              <p className="text-xs text-muted-foreground">Default commission percentage on vehicle sales</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgDaysToFirstInquiry">Avg. Days to First Inquiry</Label>
              <Input
                id="avgDaysToFirstInquiry"
                type="number"
                min="1"
                value={avgDaysToFirstInquiry}
                onChange={(e) => setAvgDaysToFirstInquiry(e.target.value)}
                placeholder="5"
                data-testid="input-avg-days-inquiry"
              />
              <p className="text-xs text-muted-foreground">Shown in seller portal "What's Next" section</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgDaysToSell">Avg. Days to Sell</Label>
              <Input
                id="avgDaysToSell"
                type="number"
                min="1"
                value={avgDaysToSell}
                onChange={(e) => setAvgDaysToSell(e.target.value)}
                placeholder="45"
                data-testid="input-avg-days-sell"
              />
              <p className="text-xs text-muted-foreground">Average time to sell similar vehicles</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending}
            data-testid="button-save-consignment"
          >
            {updateMutation.isPending ? "Saving..." : "Save Consignment Settings"}
          </Button>
        </CardFooter>
      </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Admin Notifications
            </CardTitle>
            <CardDescription>Get SMS notifications when new consignments are submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminNotifyPhone1">Notification Phone #1</Label>
                <Input
                  id="adminNotifyPhone1"
                  type="tel"
                  value={adminNotifyPhone1}
                  onChange={(e) => setAdminNotifyPhone1(e.target.value)}
                  placeholder="(555) 123-4567"
                  data-testid="input-admin-notify-phone-1"
                />
                <p className="text-xs text-muted-foreground">Primary phone for new consignment alerts</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminNotifyPhone2">Notification Phone #2</Label>
                <Input
                  id="adminNotifyPhone2"
                  type="tel"
                  value={adminNotifyPhone2}
                  onChange={(e) => setAdminNotifyPhone2(e.target.value)}
                  placeholder="(555) 123-4567"
                  data-testid="input-admin-notify-phone-2"
                />
                <p className="text-xs text-muted-foreground">Secondary phone (optional)</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isPending}
              data-testid="button-save-notifications"
            >
              {updateMutation.isPending ? "Saving..." : "Save Notification Settings"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-white border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Seller Confirmation SMS
            </CardTitle>
            <CardDescription>Customize the SMS message sent to sellers when they submit a consignment form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sellerConfirmationSms">Message Template</Label>
              <Textarea
                id="sellerConfirmationSms"
                value={sellerConfirmationSms}
                onChange={(e) => setSellerConfirmationSms(e.target.value)}
                placeholder="Thank you for submitting your {year} {make} {model}..."
                className="min-h-[100px]"
                data-testid="input-seller-confirmation-sms"
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Available placeholders:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><code className="bg-muted px-1 rounded">{"{year}"}</code> - Vehicle year</li>
                  <li><code className="bg-muted px-1 rounded">{"{make}"}</code> - Vehicle make</li>
                  <li><code className="bg-muted px-1 rounded">{"{model}"}</code> - Vehicle model</li>
                  <li><code className="bg-muted px-1 rounded">{"{siteName}"}</code> - Your business name</li>
                  <li><code className="bg-muted px-1 rounded">{"{firstName}"}</code> - Seller's first name</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isPending}
              data-testid="button-save-seller-sms"
            >
              {updateMutation.isPending ? "Saving..." : "Save SMS Template"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="legal" className="space-y-6">
        <Card className="border-white border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Privacy Policy
            </CardTitle>
            <CardDescription>
              Edit the privacy policy displayed at <a href="/privacy" target="_blank" className="text-primary hover:underline">/privacy</a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={privacyPolicy}
              onChange={(e) => setPrivacyPolicy(e.target.value)}
              placeholder="Enter your privacy policy content here. You can use markdown-style formatting:&#10;&#10;## Section Heading&#10;- Bullet point&#10;**Bold text**"
              className="min-h-[300px] font-mono text-sm"
              data-testid="input-privacy-policy"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Use ## for section headings, - for bullet points, and **text** for bold. Leave empty to use the default template.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isPending}
              data-testid="button-save-privacy"
            >
              {updateMutation.isPending ? "Saving..." : "Save Privacy Policy"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-white border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Terms of Service
            </CardTitle>
            <CardDescription>
              Edit the terms of service displayed at <a href="/terms" target="_blank" className="text-primary hover:underline">/terms</a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={termsOfService}
              onChange={(e) => setTermsOfService(e.target.value)}
              placeholder="Enter your terms of service content here. You can use markdown-style formatting:&#10;&#10;## Section Heading&#10;- Bullet point&#10;**Bold text**"
              className="min-h-[300px] font-mono text-sm"
              data-testid="input-terms-of-service"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Use ## for section headings, - for bullet points, and **text** for bold. Leave empty to use the default template.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isPending}
              data-testid="button-save-terms"
            >
              {updateMutation.isPending ? "Saving..." : "Save Terms of Service"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="integrations" className="space-y-6">
        <Card className="border-white border">
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
                  ghlConfigured ? "bg-green-500/10" : "bg-orange-500/10"
                }`}>
                  <Plug className={`h-5 w-5 ${
                    ghlTestStatus === "success" ? "text-green-500" : 
                    ghlConfigured ? "text-green-500" : "text-orange-500"
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
                ) : ghlConfigured ? (
                  <Badge className="gap-1 ml-auto bg-green-600 hover:bg-green-700">
                    <Check className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 ml-auto">
                    <Clock className="h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
              </div>
              {ghlTestMessage && (
                <p className={`text-sm mt-2 ${ghlTestStatus === "success" ? "text-green-600" : "text-red-500"}`}>
                  {ghlTestMessage}
                </p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ghlApiToken">API Token {ghlConfigured && !ghlApiToken && <span className="text-green-600 text-xs">(configured)</span>}</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="ghlApiToken"
                      type={showGhlToken ? "text" : "password"}
                      value={ghlApiToken}
                      onChange={(e) => setGhlApiToken(e.target.value)}
                      placeholder={ghlConfigured ? "Enter new token to update" : "Enter your GoHighLevel API token"}
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
                <p className="text-xs text-muted-foreground">Find this in your GHL Settings → Business Profile → API Keys</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ghlLocationId">Location ID</Label>
                <Input
                  id="ghlLocationId"
                  value={ghlLocationId}
                  onChange={(e) => setGhlLocationId(e.target.value)}
                  placeholder="Enter your GoHighLevel location ID"
                  data-testid="input-ghl-location-id"
                />
                <p className="text-xs text-muted-foreground">Find this in your GHL Settings → Business Profile</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              onClick={() => updateMutation.mutate()} 
              disabled={updateMutation.isPending}
              data-testid="button-save-ghl"
            >
              {updateMutation.isPending ? "Saving..." : "Save GHL Settings"}
            </Button>
            <Button 
              variant="outline"
              onClick={async () => {
                setGhlTestStatus("testing");
                setGhlTestMessage("");
                try {
                  const res = await fetch("/api/settings/test-ghl", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      apiToken: ghlApiToken || undefined,
                      locationId: ghlLocationId || undefined
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
              disabled={ghlTestStatus === "testing"}
              data-testid="button-test-ghl"
            >
              {ghlTestStatus === "testing" ? "Testing..." : "Test Connection"}
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Configuration Sync
            </CardTitle>
            <CardDescription>Sync settings from the seed configuration file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If your production site is missing settings, you can force a resync from the configuration file. 
              This will overwrite current settings with the values defined in the seed configuration.
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch("/api/settings/resync", { method: "POST" });
                  if (!res.ok) throw new Error("Failed to resync");
                  const data = await res.json();
                  toast({ title: "Settings Resynced", description: data.message });
                  queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
                } catch (error) {
                  toast({ title: "Error", description: "Failed to resync settings", variant: "destructive" });
                }
              }}
              className="gap-2"
            >
              <Upload className="h-4 w-4" /> Resync Settings from Configuration
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
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

const interestLabels: Record<string, string> = {
  test_drive: "Schedule Test Drive",
  financing: "Financing Info",
  make_offer: "Make an Offer",
  more_photos: "More Photos/Video",
  question: "Question",
};

const timelineLabels: Record<string, string> = {
  this_week: "This Week",
  this_month: "This Month",
  just_browsing: "Browsing",
};

const financingLabels: Record<string, string> = {
  cash: "Cash",
  finance: "Finance",
  undecided: "Undecided",
};

const contactLabels: Record<string, string> = {
  call: "Call",
  text: "Text",
  email: "Email",
};

const timeLabels: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const inquiryStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  qualified: { label: "Qualified", variant: "outline" },
  closed: { label: "Closed", variant: "destructive" },
};

function InquiriesPanel({ inventory }: { inventory: InventoryCar[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inquiries = [], isLoading } = useQuery<BuyerInquiry[]>({
    queryKey: ["/api/inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/inquiries");
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Status Updated", description: "Inquiry status has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getVehicleInfo = (carId: string) => {
    const car = inventory.find(c => c.id === carId);
    return car ? `${car.year} ${car.make} ${car.model}` : "Unknown Vehicle";
  };

  const newInquiries = inquiries.filter(i => i.status === "new");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Buyer Inquiries</h2>
          <p className="text-muted-foreground">Track and manage leads from potential buyers.</p>
        </div>
        {newInquiries.length > 0 && (
          <Badge variant="default" className="text-sm">{newInquiries.length} New</Badge>
        )}
      </div>

      {isLoading ? (
        <p>Loading inquiries...</p>
      ) : inquiries.length === 0 ? (
        <Card className="border-white border">
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No buyer inquiries yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Inquiries will appear here when potential buyers contact you about vehicles.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="border-white border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      {getVehicleInfo(inquiry.inventoryCarId)}
                    </CardTitle>
                    <CardDescription>
                      {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() + " at " + new Date(inquiry.createdAt).toLocaleTimeString() : "Unknown date"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inquiryStatusLabels[inquiry.status]?.variant || "secondary"}>
                      {inquiryStatusLabels[inquiry.status]?.label || inquiry.status}
                    </Badge>
                    <select
                      value={inquiry.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: inquiry.id, status: e.target.value })}
                      className="text-xs border rounded px-2 py-1 bg-background"
                      data-testid={`select-inquiry-status-${inquiry.id}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Contact Information</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Name:</span> {inquiry.buyerName}</p>
                      <p><span className="text-muted-foreground">Phone:</span> <a href={`tel:${inquiry.buyerPhone}`} className="text-primary hover:underline">{inquiry.buyerPhone}</a></p>
                      <p><span className="text-muted-foreground">Email:</span> <a href={`mailto:${inquiry.buyerEmail}`} className="text-primary hover:underline">{inquiry.buyerEmail}</a></p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Interest Details</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Interest:</span> <Badge variant="outline" className="ml-1">{interestLabels[inquiry.interestType] || inquiry.interestType}</Badge></p>
                      {inquiry.buyTimeline && <p><span className="text-muted-foreground">Timeline:</span> {timelineLabels[inquiry.buyTimeline] || inquiry.buyTimeline}</p>}
                      {inquiry.hasTradeIn !== null && <p><span className="text-muted-foreground">Trade-In:</span> {inquiry.hasTradeIn ? "Yes" : "No"}</p>}
                      {inquiry.financingPreference && <p><span className="text-muted-foreground">Financing:</span> {financingLabels[inquiry.financingPreference] || inquiry.financingPreference}</p>}
                    </div>
                  </div>
                </div>
                {(inquiry.contactPreference || inquiry.bestTimeToContact) && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-sm mb-2">Contact Preferences</h4>
                    <div className="flex gap-4 text-sm">
                      {inquiry.contactPreference && <p><span className="text-muted-foreground">Preferred:</span> {contactLabels[inquiry.contactPreference] || inquiry.contactPreference}</p>}
                      {inquiry.bestTimeToContact && <p><span className="text-muted-foreground">Best Time:</span> {timeLabels[inquiry.bestTimeToContact] || inquiry.bestTimeToContact}</p>}
                    </div>
                  </div>
                )}
                {inquiry.message && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-sm mb-2">Message</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{inquiry.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

type AdminUser = {
  id: string;
  username: string;
  role: string;
  isAdmin: boolean;
  createdAt: string | null;
};

function UsersPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"master" | "admin">("admin");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const { data: session } = useQuery<{ authenticated: boolean; userId?: string }>({
    queryKey: ["/api/auth/session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      return res.json();
    },
  });

  const currentUserId = session?.userId;

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; role: string }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User Created", description: "The new user has been added." });
      setAddDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("admin");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User Deleted", description: "The user has been removed." });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Role Updated", description: "User role has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const res = await fetch(`/api/users/${id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password Reset", description: "The user's password has been updated." });
      setResetPasswordDialogOpen(false);
      setUserToResetPassword(null);
      setResetPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage admin users and their access levels.</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2" data-testid="button-add-user">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <Card className="border-white border">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="border-white border">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {user.role === "master" ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.role === "master" ? "Master Admin" : "Admin"} 
                      {user.createdAt && ` • Created ${new Date(user.createdAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === "master" ? "default" : "secondary"} className="capitalize">
                    {user.role === "master" ? "Master" : "Admin"}
                  </Badge>
                  {user.id === currentUserId && (
                    <Badge variant="outline" className="text-xs">(You)</Badge>
                  )}
                  {user.role === "admin" && user.id !== currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRoleMutation.mutate({ id: user.id, role: "master" })}
                      disabled={updateRoleMutation.isPending}
                      data-testid={`button-promote-${user.id}`}
                    >
                      Promote to Master
                    </Button>
                  )}
                  {user.role === "master" && user.id !== currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRoleMutation.mutate({ id: user.id, role: "admin" })}
                      disabled={updateRoleMutation.isPending}
                      data-testid={`button-demote-${user.id}`}
                    >
                      Demote to Admin
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUserToResetPassword(user);
                      setResetPasswordDialogOpen(true);
                    }}
                    data-testid={`button-reset-password-${user.id}`}
                  >
                    <Lock className="h-4 w-4 mr-1" /> Reset Password
                  </Button>
                  {user.id !== currentUserId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`button-delete-user-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new admin user with access to the dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
                data-testid="input-new-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={newRole === "admin"}
                    onChange={() => setNewRole("admin")}
                    className="h-4 w-4"
                  />
                  <span>Admin</span>
                  <span className="text-xs text-muted-foreground">(CRM access only)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="master"
                    checked={newRole === "master"}
                    onChange={() => setNewRole("master")}
                    className="h-4 w-4"
                  />
                  <span>Master Admin</span>
                  <span className="text-xs text-muted-foreground">(Full access)</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createUserMutation.mutate({ username: newUsername, password: newPassword, role: newRole })}
              disabled={!newUsername || !newPassword || createUserMutation.isPending}
              data-testid="button-confirm-add-user"
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.username}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {userToResetPassword?.username}. You'll need to share this password with them securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                data-testid="input-reset-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResetPasswordDialogOpen(false);
              setUserToResetPassword(null);
              setResetPassword("");
            }}>Cancel</Button>
            <Button
              onClick={() => userToResetPassword && resetPasswordMutation.mutate({ id: userToResetPassword.id, password: resetPassword })}
              disabled={!resetPassword || resetPassword.length < 6 || resetPasswordMutation.isPending}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface VehicleAlert {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  makes: string[];
  models: string[];
  minYear: number | null;
  maxYear: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  notifyEmail: boolean;
  notifySms: boolean;
  active: boolean;
  createdAt: string;
}

function AlertsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: alerts = [], isLoading } = useQuery<VehicleAlert[]>({
    queryKey: ["/api/vehicle-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/vehicle-alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/vehicle-alerts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-alerts"] });
      toast({ title: "Alert updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vehicle-alerts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-alerts"] });
      toast({ title: "Alert deleted" });
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Vehicle Alert Subscriptions
          </CardTitle>
          <CardDescription>
            Manage buyers who want to be notified about new vehicles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No vehicle alerts yet. Buyers can subscribe from the inventory page.</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`border ${alert.active ? 'border-green-500/30' : 'border-red-500/30'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{alert.name}</p>
                        <p className="text-sm text-muted-foreground">{alert.email}</p>
                        {alert.phone && <p className="text-sm text-muted-foreground">{alert.phone}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={alert.active ? "outline" : "default"}
                          onClick={() => toggleMutation.mutate({ id: alert.id, active: !alert.active })}
                        >
                          {alert.active ? "Pause" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {alert.makes.length > 0 && (
                        <span className="bg-primary/10 px-2 py-1 rounded">Makes: {alert.makes.join(", ")}</span>
                      )}
                      {(alert.minPrice || alert.maxPrice) && (
                        <span className="bg-primary/10 px-2 py-1 rounded">
                          Price: ${alert.minPrice?.toLocaleString() || "0"} - ${alert.maxPrice?.toLocaleString() || "Any"}
                        </span>
                      )}
                      {(alert.minYear || alert.maxYear) && (
                        <span className="bg-primary/10 px-2 py-1 rounded">
                          Year: {alert.minYear || "Any"} - {alert.maxYear || "Any"}
                        </span>
                      )}
                      {alert.notifyEmail && <span className="bg-blue-500/20 px-2 py-1 rounded"><Mail className="h-3 w-3 inline mr-1" />Email</span>}
                      {alert.notifySms && <span className="bg-green-500/20 px-2 py-1 rounded"><Phone className="h-3 w-3 inline mr-1" />SMS</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface Testimonial {
  id: string;
  customerName: string;
  customerLocation: string | null;
  vehicleSold: string | null;
  rating: number;
  content: string;
  photoUrl: string | null;
  featured: boolean;
  approved: boolean;
  createdAt: string;
}

function TestimonialsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [vehicleSold, setVehicleSold] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [featured, setFeatured] = useState(false);

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/all"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials/all");
      if (!res.ok) throw new Error("Failed to fetch testimonials");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create testimonial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      toast({ title: "Testimonial created" });
      setAddDialogOpen(false);
      setCustomerName("");
      setCustomerLocation("");
      setVehicleSold("");
      setRating(5);
      setContent("");
      setFeatured(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      toast({ title: "Testimonial updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete testimonial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      toast({ title: "Testimonial deleted" });
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <Card className="border-white border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" /> Customer Testimonials
            </CardTitle>
            <CardDescription>
              Manage customer reviews displayed on the homepage.
            </CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Testimonial
          </Button>
        </CardHeader>
        <CardContent>
          {testimonials.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No testimonials yet. Add your first testimonial to display on the homepage.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {testimonials.map((t) => (
                <Card key={t.id} className={`border ${t.approved ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{t.customerName}</p>
                        {t.customerLocation && <p className="text-xs text-muted-foreground">{t.customerLocation}</p>}
                        {t.vehicleSold && <p className="text-xs text-primary">{t.vehicleSold}</p>}
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < t.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-3">"{t.content}"</p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex gap-2">
                        {t.featured && <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded">Featured</span>}
                        {t.approved ? (
                          <span className="text-xs bg-green-500/20 px-2 py-1 rounded">Approved</span>
                        ) : (
                          <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded">Pending</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: t.id, data: { approved: !t.approved } })}
                        >
                          {t.approved ? "Unapprove" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: t.id, data: { featured: !t.featured } })}
                        >
                          {t.featured ? "Unfeature" : "Feature"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Testimonial</DialogTitle>
            <DialogDescription>Create a new customer testimonial for the homepage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John D." />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={customerLocation} onChange={(e) => setCustomerLocation(e.target.value)} placeholder="Miami, FL" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Sold/Purchased</Label>
              <Input value={vehicleSold} onChange={(e) => setVehicleSold(e.target.value)} placeholder="2022 Porsche 911 GT3" />
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <Button
                    key={r}
                    type="button"
                    size="sm"
                    variant={rating >= r ? "default" : "outline"}
                    onClick={() => setRating(r)}
                  >
                    <Star className={`h-4 w-4 ${rating >= r ? 'fill-current' : ''}`} />
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Testimonial Content *</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Their experience..." rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={featured} onCheckedChange={(c) => setFeatured(c as boolean)} id="featured" />
              <Label htmlFor="featured">Featured on homepage</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                customerName,
                customerLocation: customerLocation || null,
                vehicleSold: vehicleSold || null,
                rating,
                content,
                featured,
              })}
              disabled={!customerName || !content || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AnalyticsData {
  totalViews: number;
  inventory: { total: number; available: number; sold: number };
  inquiries: { total: number; new: number };
  consignments: { total: number; pending: number };
  alerts: { total: number; active: number };
}

function SMSBlastPanel() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const handleSend = async () => {
    if (!message || !targetGroup) {
      toast({ title: "Error", description: "Please enter a message and select a target group", variant: "destructive" });
      return;
    }
    
    setSending(true);
    setResult(null);
    
    try {
      const res = await fetch("/api/sms/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, targetGroup }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      
      const data = await res.json();
      setResult(data);
      toast({ 
        title: "SMS Blast Sent",
        description: `Successfully sent to ${data.sent} of ${data.total} recipients`
      });
      setMessage("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> SMS Blast
          </CardTitle>
          <CardDescription>
            Send bulk SMS messages to your leads via GoHighLevel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Group</Label>
            <select
              className="w-full h-10 px-3 rounded-md border bg-background"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
            >
              <option value="">Select audience...</option>
              <option value="inquiries">Buyer Inquiries</option>
              <option value="consignments">Vehicle Consigners</option>
              <option value="alerts">Alert Subscribers (SMS enabled)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">{message.length}/160 characters</p>
          </div>
          <Button 
            onClick={handleSend} 
            disabled={sending || !message || !targetGroup}
            className="w-full"
          >
            {sending ? "Sending..." : "Send SMS Blast"}
          </Button>
          {result && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="font-medium text-green-600">Blast Complete</p>
              <p className="text-sm">Sent: {result.sent} | Failed: {result.failed} | Total: {result.total}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsPanel() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (isLoading) return <p>Loading analytics...</p>;
  if (!analytics) return <p>No analytics data</p>;

  const stats = [
    { label: "Total Views", value: analytics.totalViews, icon: Eye, color: "bg-blue-500/20 text-blue-600" },
    { label: "Vehicles Listed", value: analytics.inventory.total, icon: Car, color: "bg-purple-500/20 text-purple-600" },
    { label: "Available", value: analytics.inventory.available, icon: Car, color: "bg-green-500/20 text-green-600" },
    { label: "Sold", value: analytics.inventory.sold, icon: Car, color: "bg-yellow-500/20 text-yellow-600" },
    { label: "Total Inquiries", value: analytics.inquiries.total, icon: MessageSquare, color: "bg-orange-500/20 text-orange-600" },
    { label: "New Inquiries", value: analytics.inquiries.new, icon: MessageSquare, color: "bg-red-500/20 text-red-600" },
    { label: "Consignments", value: analytics.consignments.total, icon: FileText, color: "bg-indigo-500/20 text-indigo-600" },
    { label: "Pending Review", value: analytics.consignments.pending, icon: Clock, color: "bg-pink-500/20 text-pink-600" },
    { label: "Alert Subscribers", value: analytics.alerts.total, icon: Bell, color: "bg-teal-500/20 text-teal-600" },
    { label: "Active Alerts", value: analytics.alerts.active, icon: Bell, color: "bg-cyan-500/20 text-cyan-600" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Dashboard Analytics
          </CardTitle>
          <CardDescription>
            Overview of your dealership's performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, index) => (
              <Card key={index} className="border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                      <p className="text-4xl font-extrabold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
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

function AdminDashboard({ onLogout, userRole }: { onLogout: () => void; userRole: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("submissions");
  const [saveHandler, setSaveHandler] = useState<{ save: () => void; isPending: boolean } | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ConsignmentSubmission | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [customPayout, setCustomPayout] = useState("");
  const [overrideCommission, setOverrideCommission] = useState("");
  const [overrideDaysInquiry, setOverrideDaysInquiry] = useState("");
  const [overrideDaysSell, setOverrideDaysSell] = useState("");
  
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
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [quickAddVin, setQuickAddVin] = useState("");
  const [quickAddYear, setQuickAddYear] = useState("");
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedDocumentsId, setSelectedDocumentsId] = useState<string | null>(null);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [selectedVehicleForDocs, setSelectedVehicleForDocs] = useState<InventoryCar | null>(null);
  const [newDocType, setNewDocType] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [newDocNotes, setNewDocNotes] = useState("");
  const [quickAddMake, setQuickAddMake] = useState("");
  const [quickAddModel, setQuickAddModel] = useState("");
  const [quickAddColor, setQuickAddColor] = useState("");
  const [quickAddMileage, setQuickAddMileage] = useState("");
  const [quickAddPrice, setQuickAddPrice] = useState("");
  const [quickAddCondition, setQuickAddCondition] = useState("Excellent");
  const [quickAddDescription, setQuickAddDescription] = useState("");
  const [vinLookupLoading, setVinLookupLoading] = useState(false);
  const [quickAddMakeOpen, setQuickAddMakeOpen] = useState(false);
  const [quickAddModelOpen, setQuickAddModelOpen] = useState(false);
  const [editMakeOpen, setEditMakeOpen] = useState(false);
  const [editModelOpen, setEditModelOpen] = useState(false);
  const [editVinLoading, setEditVinLoading] = useState(false);

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

  const { data: documents = [], isLoading: loadingDocuments } = useQuery<Array<{ id: string; consignmentId: string; documentType: string; fileName: string; fileUrl: string; status: string; createdAt: string }>>({
    queryKey: ["/api/consignments", selectedDocumentsId, "documents"],
    queryFn: async () => {
      if (!selectedDocumentsId) return [];
      const res = await fetch(`/api/consignments/${selectedDocumentsId}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!selectedDocumentsId && documentsDialogOpen,
  });

  const { data: makes = [], isLoading: isLoadingMakes } = useQuery({
    queryKey: ["vehicleMakes"],
    queryFn: fetchMakesForYear,
    staleTime: 1000 * 60 * 60,
  });

  const { data: quickAddModels = [], isLoading: isLoadingQuickAddModels } = useQuery({
    queryKey: ["vehicleModels", quickAddMake, quickAddYear],
    queryFn: () => fetchModelsForMakeYear(quickAddMake, quickAddYear),
    enabled: !!quickAddMake && !!quickAddYear,
    staleTime: 1000 * 60 * 60,
  });

  const { data: editModels = [], isLoading: isLoadingEditModels } = useQuery({
    queryKey: ["vehicleModels", editMake, editYear],
    queryFn: () => fetchModelsForMakeYear(editMake, editYear),
    enabled: !!editMake && !!editYear,
    staleTime: 1000 * 60 * 60,
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

  const addNoteMutation = useMutation({
    mutationFn: async ({ consignmentId, content }: { consignmentId: string; content: string }) => {
      const res = await fetch(`/api/consignments/${consignmentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      setNoteDialogOpen(false);
      setNoteContent("");
      toast({ title: "Note added", description: "The seller will see this note in their portal." });
    },
  });

  const updateOverridesMutation = useMutation({
    mutationFn: async ({ consignmentId, overrides }: { 
      consignmentId: string; 
      overrides: {
        customPayoutAmount?: number | null;
        overrideCommissionRate?: number | null;
        overrideAvgDaysToFirstInquiry?: number | null;
        overrideAvgDaysToSell?: number | null;
      }
    }) => {
      const res = await fetch(`/api/consignments/${consignmentId}/overrides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrides),
      });
      if (!res.ok) throw new Error("Failed to update overrides");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consignments"] });
      setOverrideDialogOpen(false);
      setCustomPayout("");
      setOverrideCommission("");
      setOverrideDaysInquiry("");
      setOverrideDaysSell("");
      toast({ title: "Overrides saved", description: "The seller will see the updated values in their portal." });
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

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });
      if (!res.ok) throw new Error("Failed to update featured status");
      return res.json();
    },
    onSuccess: (_, { featured }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ 
        title: featured ? "Added to Featured" : "Removed from Featured",
        description: featured ? "Vehicle will now appear on the homepage." : "Vehicle removed from homepage featured section."
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update featured status.", variant: "destructive" });
    },
  });

  interface VehicleDoc {
    id: string;
    vehicleId: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    notes: string | null;
    uploadedBy: string | null;
    createdAt: string;
  }

  const { data: vehicleDocs = [], refetch: refetchDocs } = useQuery<VehicleDoc[]>({
    queryKey: ["/api/vehicles", selectedVehicleForDocs?.id, "documents"],
    queryFn: async () => {
      if (!selectedVehicleForDocs) return [];
      const res = await fetch(`/api/vehicles/${selectedVehicleForDocs.id}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!selectedVehicleForDocs,
  });

  const addDocMutation = useMutation({
    mutationFn: async (data: { vehicleId: string; documentType: string; fileName: string; fileUrl: string; notes?: string }) => {
      const res = await fetch(`/api/vehicles/${data.vehicleId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add document");
      return res.json();
    },
    onSuccess: () => {
      refetchDocs();
      toast({ title: "Document added" });
      setNewDocType("");
      setNewDocUrl("");
      setNewDocNotes("");
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    onSuccess: () => {
      refetchDocs();
      toast({ title: "Document deleted" });
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
    setEditPhotos(car.photos || []);
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

  const handleVinLookup = async (vin?: string) => {
    const vinToLookup = vin || quickAddVin;
    if (!vinToLookup || vinToLookup.length < 11) {
      if (!vin) {
        toast({ title: "Error", description: "Please enter a valid VIN (at least 11 characters).", variant: "destructive" });
      }
      return;
    }
    
    setVinLookupLoading(true);
    try {
      const res = await fetch(`/api/vin-decode/${vinToLookup}`);
      if (!res.ok) throw new Error("Failed to decode VIN");
      const data = await res.json();
      
      if (data.ErrorCode && data.ErrorCode !== "0") {
        if (!vin) {
          toast({ title: "VIN Not Found", description: "Could not find vehicle information for this VIN.", variant: "destructive" });
        }
        return;
      }
      
      setQuickAddYear(data.ModelYear || "");
      setQuickAddMake(data.Make || "");
      setQuickAddModel(data.Model || "");
      
      toast({ title: "VIN Decoded", description: `Found: ${data.ModelYear} ${data.Make} ${data.Model}` });
    } catch {
      if (!vin) {
        toast({ title: "Error", description: "Failed to lookup VIN.", variant: "destructive" });
      }
    } finally {
      setVinLookupLoading(false);
    }
  };

  const handleEditVinDecode = async (vin: string) => {
    if (vin.length !== 17) return;
    
    setEditVinLoading(true);
    try {
      const res = await fetch(`/api/vin-decode/${vin}`);
      if (!res.ok) throw new Error("Failed to decode VIN");
      const data = await res.json();
      
      if (data.ErrorCode && data.ErrorCode !== "0") {
        return;
      }
      
      if (data.ModelYear) setEditYear(data.ModelYear);
      if (data.Make) setEditMake(data.Make);
      if (data.Model) setEditModel(data.Model);
      
      toast({ title: "VIN Decoded", description: `Found: ${data.ModelYear} ${data.Make} ${data.Model}` });
    } catch {
      // Silently fail for auto-decode
    } finally {
      setEditVinLoading(false);
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
    data.photos = editPhotos;

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
    <div className="min-h-screen [&_input]:border-white [&_textarea]:border-white [&_select]:border-white" style={{ backgroundColor: '#47546d' }}>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="submissions" className="gap-2">
              Submissions
              {pendingSubmissions.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingSubmissions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="gap-2" data-testid="tab-inquiries">
              <MessageSquare className="h-4 w-4" />
              Inquiries
            </TabsTrigger>
            <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2" data-testid="tab-alerts">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-2" data-testid="tab-testimonials">
              <Star className="h-4 w-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="messaging" className="gap-2" data-testid="tab-messaging">
              <MessageSquare className="h-4 w-4" />
              Messaging
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
            {userRole === "master" && (
              <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
                Users
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            {loadingSubmissions ? (
              <p>Loading...</p>
            ) : submissions.length === 0 ? (
              <Card className="border-white border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No submissions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((sub) => (
                  <Card key={sub.id} className="overflow-hidden border-white border">
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

                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        {sub.status === "pending" && (
                          <>
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
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setNoteDialogOpen(true);
                          }}
                          className="gap-1"
                        >
                          <MessageSquare className="h-4 w-4" /> Add Note
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setCustomPayout(sub.customPayoutAmount?.toString() || "");
                            setOverrideCommission(sub.overrideCommissionRate?.toString() || "");
                            setOverrideDaysInquiry(sub.overrideAvgDaysToFirstInquiry?.toString() || "");
                            setOverrideDaysSell(sub.overrideAvgDaysToSell?.toString() || "");
                            setOverrideDialogOpen(true);
                          }}
                          className="gap-1"
                        >
                          <Settings className="h-4 w-4" /> Overrides
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setSelectedDocumentsId(sub.id);
                            setDocumentsDialogOpen(true);
                          }}
                          className="gap-1"
                        >
                          <FileText className="h-4 w-4" /> Documents
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4">
            <InquiriesPanel inventory={inventory} />
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
              <Card className="border-white border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No vehicles in inventory yet. Use Quick Add to add your first vehicle!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventory.map((car) => (
                  <Card key={car.id} className="overflow-hidden border-white border">
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <img
                        src={car.photos && car.photos.length > 0 ? car.photos[0] : placeholderCar}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full object-cover"
                      />
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
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleFeaturedMutation.mutate({ id: car.id, featured: !car.featured })}
                          disabled={toggleFeaturedMutation.isPending}
                          className={car.featured ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
                          title={car.featured ? "Remove from Featured" : "Add to Featured"}
                          data-testid={`button-toggle-featured-${car.id}`}
                        >
                          <Star className={`h-5 w-5 ${car.featured ? "fill-current" : ""}`} />
                        </Button>
                        <StatusBadge status={car.status} />
                      </div>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVehicleForDocs(car);
                            setDocsDialogOpen(true);
                          }}
                          className="gap-2"
                          data-testid={`button-docs-${car.id}`}
                        >
                          <FileText className="h-3 w-3" /> Documents
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

          <TabsContent value="alerts">
            <AlertsPanel />
          </TabsContent>

          <TabsContent value="testimonials">
            <TestimonialsPanel />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsPanel />
          </TabsContent>

          <TabsContent value="messaging">
            <SMSBlastPanel />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel onRegisterSave={setSaveHandler} />
          </TabsContent>

          {userRole === "master" && (
            <TabsContent value="users">
              <UsersPanel />
            </TabsContent>
          )}
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

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note for Seller</DialogTitle>
            <DialogDescription>
              This note will be visible to the vehicle owner in their seller portal for {selectedSubmission?.year} {selectedSubmission?.make} {selectedSubmission?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="noteContent">Note</Label>
              <Textarea
                id="noteContent"
                placeholder="e.g. We've scheduled your vehicle for professional photography..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSubmission && noteContent.trim()) {
                  addNoteMutation.mutate({ consignmentId: selectedSubmission.id, content: noteContent.trim() });
                }
              }}
              disabled={!noteContent.trim() || addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? "Adding..." : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Listing Overrides</DialogTitle>
            <DialogDescription>
              Set custom values for {selectedSubmission?.year} {selectedSubmission?.make} {selectedSubmission?.model}. Leave fields empty to use global defaults.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customPayout">Custom Payout Amount ($)</Label>
              <Input
                id="customPayout"
                type="number"
                placeholder="Leave empty for auto-calculation"
                value={customPayout}
                onChange={(e) => setCustomPayout(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Direct payout amount (overrides commission calculation)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="overrideCommission">Commission Rate Override (%)</Label>
              <Input
                id="overrideCommission"
                type="number"
                min="0"
                max="100"
                placeholder="Leave empty for global default"
                value={overrideCommission}
                onChange={(e) => setOverrideCommission(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Custom commission % for this vehicle only
              </p>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="overrideDaysInquiry">Days to First Inquiry</Label>
                <Input
                  id="overrideDaysInquiry"
                  type="number"
                  min="1"
                  placeholder="Default"
                  value={overrideDaysInquiry}
                  onChange={(e) => setOverrideDaysInquiry(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overrideDaysSell">Days to Sell</Label>
                <Input
                  id="overrideDaysSell"
                  type="number"
                  min="1"
                  placeholder="Default"
                  value={overrideDaysSell}
                  onChange={(e) => setOverrideDaysSell(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSubmission) {
                  updateOverridesMutation.mutate({ 
                    consignmentId: selectedSubmission.id, 
                    overrides: {
                      customPayoutAmount: customPayout ? parseInt(customPayout) : null,
                      overrideCommissionRate: overrideCommission ? parseInt(overrideCommission) : null,
                      overrideAvgDaysToFirstInquiry: overrideDaysInquiry ? parseInt(overrideDaysInquiry) : null,
                      overrideAvgDaysToSell: overrideDaysSell ? parseInt(overrideDaysSell) : null,
                    }
                  });
                }
              }}
              disabled={updateOverridesMutation.isPending}
            >
              {updateOverridesMutation.isPending ? "Saving..." : "Save Overrides"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Seller Documents</DialogTitle>
            <DialogDescription>
              Documents uploaded by {selectedSubmission?.firstName} {selectedSubmission?.lastName} for {selectedSubmission?.year} {selectedSubmission?.make} {selectedSubmission?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingDocuments ? (
              <p className="text-muted-foreground text-center py-8">Loading documents...</p>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
                <p className="text-xs text-muted-foreground mt-1">The seller can upload documents from their portal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {doc.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentsDialogOpen(false)}>
              Close
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
              <div className="flex gap-2">
                <Input
                  id="editVin"
                  value={editVin}
                  onChange={(e) => {
                    const newVin = e.target.value.toUpperCase();
                    setEditVin(newVin);
                    if (newVin.length === 17) {
                      handleEditVinDecode(newVin);
                    }
                  }}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className="flex-1"
                  data-testid="input-edit-vin"
                />
                {editVinLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Decoding...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Enter VIN to auto-fill vehicle details</p>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editYear">Year</Label>
                <Input
                  id="editYear"
                  type="number"
                  value={editYear}
                  onChange={(e) => {
                    setEditYear(e.target.value);
                    setEditModel("");
                  }}
                  data-testid="input-edit-year"
                />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Popover open={editMakeOpen} onOpenChange={setEditMakeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={editMakeOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-edit-make"
                      disabled={isLoadingMakes}
                    >
                      {editMake || (isLoadingMakes ? "Loading..." : "Search make...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search make..." />
                      <CommandList>
                        <CommandEmpty>No make found. Type to use custom value.</CommandEmpty>
                        <CommandGroup>
                          {makes
                            .filter((make) => make.MakeName)
                            .sort((a, b) => (a.MakeName || "").localeCompare(b.MakeName || ""))
                            .map((make) => (
                              <CommandItem
                                key={make.MakeId}
                                value={make.MakeName}
                                onSelect={() => {
                                  setEditMake(make.MakeName);
                                  setEditModel("");
                                  setEditMakeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editMake === make.MakeName ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {make.MakeName}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={editMake}
                  onChange={(e) => setEditMake(e.target.value)}
                  placeholder="Or type custom make"
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Popover open={editModelOpen} onOpenChange={setEditModelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={editModelOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-edit-model"
                      disabled={!editMake || !editYear || isLoadingEditModels}
                    >
                      {editModel || (!editMake ? "Select make first" : !editYear ? "Select year first" : isLoadingEditModels ? "Loading..." : "Search model...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search model..." />
                      <CommandList>
                        <CommandEmpty>No model found. Type to use custom value.</CommandEmpty>
                        <CommandGroup>
                          {editModels
                            .filter((model) => model.Model_Name)
                            .sort((a, b) => (a.Model_Name || "").localeCompare(b.Model_Name || ""))
                            .map((model) => (
                              <CommandItem
                                key={model.Model_ID}
                                value={model.Model_Name}
                                onSelect={() => {
                                  setEditModel(model.Model_Name);
                                  setEditModelOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editModel === model.Model_Name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {model.Model_Name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  placeholder="Or type custom model"
                  className="mt-1"
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
            
            {/* Photo Management Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Photos ({editPhotos.length})</Label>
                <ObjectUploader
                  maxNumberOfFiles={10}
                  maxFileSize={10485760}
                  onGetUploadParameters={async (file) => {
                    const res = await fetch("/api/uploads/request-url", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: file.name,
                        size: file.size,
                        contentType: file.type,
                      }),
                    });
                    if (!res.ok) throw new Error("Failed to get upload URL");
                    const { uploadURL } = await res.json();
                    return { method: "PUT", url: uploadURL };
                  }}
                  onComplete={(result) => {
                    const newPhotos = (result.successful || []).map((file) => {
                      const urlParts = file.uploadURL?.split("/") || [];
                      const objectId = urlParts[urlParts.length - 1]?.split("?")[0] || "";
                      return `/objects/uploads/${objectId}`;
                    });
                    if (newPhotos.length > 0) {
                      setEditPhotos([...editPhotos, ...newPhotos]);
                      toast({ title: "Photos Uploaded", description: `${newPhotos.length} photo(s) added.` });
                    }
                  }}
                  buttonClassName="h-8"
                >
                  <Upload className="h-3 w-3 mr-1" /> Add Photos
                </ObjectUploader>
              </div>
              
              {editPhotos.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {editPhotos.map((photo, index) => (
                    <div key={index} className="relative group aspect-square rounded-md overflow-hidden border">
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`} 
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditPhotos(editPhotos.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary text-xs text-primary-foreground px-1 rounded">Main</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                  No photos added yet. Click "Add Photos" to upload images.
                </p>
              )}
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

      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Documents - {selectedVehicleForDocs?.year} {selectedVehicleForDocs?.make} {selectedVehicleForDocs?.model}
            </DialogTitle>
            <DialogDescription>
              Manage vehicle documents like title, inspection reports, and other paperwork.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {vehicleDocs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {vehicleDocs.map((doc) => (
                  <Card key={doc.id} className="border">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{doc.documentType}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                        {doc.notes && <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> View
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteDocMutation.mutate(doc.id)}
                          disabled={deleteDocMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="border-t pt-4 space-y-3">
              <p className="font-medium text-sm">Add New Document</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Document Type</Label>
                  <select
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                  >
                    <option value="">Select type...</option>
                    <option value="Title">Title</option>
                    <option value="Inspection Report">Inspection Report</option>
                    <option value="Carfax/History">Carfax/History Report</option>
                    <option value="Bill of Sale">Bill of Sale</option>
                    <option value="Registration">Registration</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Warranty">Warranty</option>
                    <option value="Service Records">Service Records</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Document URL</Label>
                  <Input
                    placeholder="https://..."
                    value={newDocUrl}
                    onChange={(e) => setNewDocUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Any additional notes..."
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  if (!selectedVehicleForDocs || !newDocType || !newDocUrl) return;
                  addDocMutation.mutate({
                    vehicleId: selectedVehicleForDocs.id,
                    documentType: newDocType,
                    fileName: newDocType,
                    fileUrl: newDocUrl,
                    notes: newDocNotes || undefined,
                  });
                }}
                disabled={!newDocType || !newDocUrl || addDocMutation.isPending}
                className="w-full"
              >
                {addDocMutation.isPending ? "Adding..." : "Add Document"}
              </Button>
            </div>
          </div>
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
                  onChange={(e) => {
                    const newVin = e.target.value.toUpperCase();
                    setQuickAddVin(newVin);
                    if (newVin.length === 17) {
                      handleVinLookup(newVin);
                    }
                  }}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="flex-1"
                  data-testid="input-quick-add-vin"
                />
                {vinLookupLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Decoding...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Enter VIN to auto-fill vehicle details</p>
            </div>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quickAddYear">Year</Label>
                <Input
                  id="quickAddYear"
                  type="number"
                  value={quickAddYear}
                  onChange={(e) => {
                    setQuickAddYear(e.target.value);
                    setQuickAddModel("");
                  }}
                  placeholder="e.g. 2021"
                  data-testid="input-quick-add-year"
                />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Popover open={quickAddMakeOpen} onOpenChange={setQuickAddMakeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={quickAddMakeOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-quick-add-make"
                      disabled={isLoadingMakes}
                    >
                      {quickAddMake || (isLoadingMakes ? "Loading..." : "Search make...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search make..." />
                      <CommandList>
                        <CommandEmpty>No make found. Type to use custom value.</CommandEmpty>
                        <CommandGroup>
                          {makes
                            .filter((make) => make.MakeName)
                            .sort((a, b) => (a.MakeName || "").localeCompare(b.MakeName || ""))
                            .map((make) => (
                              <CommandItem
                                key={make.MakeId}
                                value={make.MakeName}
                                onSelect={() => {
                                  setQuickAddMake(make.MakeName);
                                  setQuickAddModel("");
                                  setQuickAddMakeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    quickAddMake === make.MakeName ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {make.MakeName}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={quickAddMake}
                  onChange={(e) => setQuickAddMake(e.target.value)}
                  placeholder="Or type custom make"
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Popover open={quickAddModelOpen} onOpenChange={setQuickAddModelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={quickAddModelOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-quick-add-model"
                      disabled={!quickAddMake || !quickAddYear || isLoadingQuickAddModels}
                    >
                      {quickAddModel || (!quickAddMake ? "Select make first" : !quickAddYear ? "Select year first" : isLoadingQuickAddModels ? "Loading..." : "Search model...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search model..." />
                      <CommandList>
                        <CommandEmpty>No model found. Type to use custom value.</CommandEmpty>
                        <CommandGroup>
                          {quickAddModels
                            .filter((model) => model.Model_Name)
                            .sort((a, b) => (a.Model_Name || "").localeCompare(b.Model_Name || ""))
                            .map((model) => (
                              <CommandItem
                                key={model.Model_ID}
                                value={model.Model_Name}
                                onSelect={() => {
                                  setQuickAddModel(model.Model_Name);
                                  setQuickAddModelOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    quickAddModel === model.Model_Name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {model.Model_Name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={quickAddModel}
                  onChange={(e) => setQuickAddModel(e.target.value)}
                  placeholder="Or type custom model"
                  className="mt-1"
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
    </div>
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
        <AdminDashboard onLogout={handleLogout} userRole={session?.role || "admin"} />
      ) : (
        <div ref={loginRef}>
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      )}

      <Footer />
    </div>
  );
}
