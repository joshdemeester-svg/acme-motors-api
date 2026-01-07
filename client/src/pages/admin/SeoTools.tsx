import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  MapPin, 
  Globe, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Download,
  ExternalLink,
  Building,
  Phone,
  Mail,
  Link as LinkIcon,
  Loader2,
  Copy,
  Info,
  Lightbulb,
  Target
} from "lucide-react";
import { AdminHelpBox } from "@/components/admin/AdminHelpBox";

type TargetLocation = {
  id: string;
  city: string;
  state: string;
  slug: string;
  headline?: string | null;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  radius?: number | null;
  isActive?: boolean | null;
  isPrimary?: boolean | null;
  sortOrder?: number | null;
};

type CitationDirectory = {
  id: string;
  name: string;
  category: string;
  url: string;
  submissionType: string;
  isAggregator?: boolean | null;
  priority?: number | null;
  notes?: string | null;
};

type CitationSubmission = {
  id: string;
  directoryId: string;
  directoryName: string;
  status: string;
  listingUrl?: string | null;
  notes?: string | null;
  submittedAt?: string | null;
  confirmedAt?: string | null;
};

type NapCheck = {
  isComplete: boolean;
  issues: string[];
  napData: {
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    email: string;
    website: string;
    hours: string;
    googleMapUrl: string;
  };
};

type CitationStats = {
  totalDirectories: number;
  pending: number;
  submitted: number;
  confirmed: number;
  rejected: number;
};

export default function SeoTools() {
  const [activeTab, setActiveTab] = useState("locations");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<TargetLocation | null>(null);
  const [deleteLocationDialogOpen, setDeleteLocationDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<TargetLocation | null>(null);
  const [locationForm, setLocationForm] = useState({
    city: "",
    state: "",
    headline: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    radius: 50,
    isActive: true,
    isPrimary: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading: locationsLoading } = useQuery<TargetLocation[]>({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const res = await fetch("/api/locations");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: directories = [] } = useQuery<CitationDirectory[]>({
    queryKey: ["/api/citations/directories"],
    queryFn: async () => {
      const res = await fetch("/api/citations/directories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: submissions = [] } = useQuery<CitationSubmission[]>({
    queryKey: ["/api/citations/submissions"],
    queryFn: async () => {
      const res = await fetch("/api/citations/submissions");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: napCheck } = useQuery<NapCheck>({
    queryKey: ["/api/citations/nap-check"],
    queryFn: async () => {
      const res = await fetch("/api/citations/nap-check");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: citationStats } = useQuery<CitationStats>({
    queryKey: ["/api/citations/stats"],
    queryFn: async () => {
      const res = await fetch("/api/citations/stats");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: typeof locationForm) => {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create location");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setLocationDialogOpen(false);
      resetLocationForm();
      toast({ title: "Location created successfully" });
    },
    onError: () => toast({ title: "Failed to create location", variant: "destructive" }),
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof locationForm }) => {
      const res = await fetch(`/api/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update location");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setLocationDialogOpen(false);
      setEditingLocation(null);
      resetLocationForm();
      toast({ title: "Location updated successfully" });
    },
    onError: () => toast({ title: "Failed to update location", variant: "destructive" }),
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setDeleteLocationDialogOpen(false);
      setLocationToDelete(null);
      toast({ title: "Location deleted" });
    },
    onError: () => toast({ title: "Failed to delete location", variant: "destructive" }),
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, status, listingUrl }: { id: string; status: string; listingUrl?: string }) => {
      const res = await fetch(`/api/citations/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, listingUrl }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citations/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/citations/stats"] });
      toast({ title: "Submission updated" });
    },
  });

  const createSubmissionMutation = useMutation({
    mutationFn: async (data: { directoryId: string; directoryName: string; status: string }) => {
      const res = await fetch("/api/citations/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citations/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/citations/stats"] });
      toast({ title: "Submission tracked" });
    },
  });

  const resetLocationForm = () => {
    setLocationForm({
      city: "",
      state: "",
      headline: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      radius: 50,
      isActive: true,
      isPrimary: false,
    });
  };

  const openEditLocation = (location: TargetLocation) => {
    setEditingLocation(location);
    setLocationForm({
      city: location.city,
      state: location.state,
      headline: location.headline || "",
      description: location.description || "",
      metaTitle: location.metaTitle || "",
      metaDescription: location.metaDescription || "",
      radius: location.radius || 50,
      isActive: location.isActive ?? true,
      isPrimary: location.isPrimary ?? false,
    });
    setLocationDialogOpen(true);
  };

  const handleLocationSubmit = () => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data: locationForm });
    } else {
      createLocationMutation.mutate(locationForm);
    }
  };

  const copyNapData = () => {
    if (napCheck?.napData) {
      const text = `${napCheck.napData.name}\n${napCheck.napData.address}\n${napCheck.napData.city}, ${napCheck.napData.state}\n${napCheck.napData.phone}\n${napCheck.napData.email}\n${napCheck.napData.website}`;
      navigator.clipboard.writeText(text);
      toast({ title: "NAP data copied to clipboard" });
    }
  };

  const exportNapData = async (format: "json" | "csv") => {
    try {
      const res = await fetch(`/api/citations/export?format=${format}`);
      if (!res.ok) throw new Error("Failed to export");
      
      if (format === "csv") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "nap-data.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "nap-data.json";
        a.click();
        window.URL.revokeObjectURL(url);
      }
      toast({ title: `NAP data exported as ${format.toUpperCase()}` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const getSubmissionForDirectory = (directoryId: string) => {
    return submissions.find(s => s.directoryId === directoryId);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "submitted":
        return <Badge className="bg-blue-600"><Clock className="w-3 h-3 mr-1" />Submitted</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <AdminLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="locations" className="gap-1.5">
            <MapPin className="w-4 h-4" />
            Target Locations
          </TabsTrigger>
          <TabsTrigger value="citations" className="gap-1.5">
            <Globe className="w-4 h-4" />
            Citations
          </TabsTrigger>
          <TabsTrigger value="nap" className="gap-1.5">
            <Building className="w-4 h-4" />
            NAP Check
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          <AdminHelpBox
            title="What are Location Landing Pages?"
            description="Location pages help you rank in searches from nearby cities. Each page displays your full inventory with location-specific content for better local SEO."
            icon={MapPin}
            variant="info"
            className="mb-6"
            defaultOpen={false}
            tips={[
              "Add cities within your typical service radius (30-50 miles)",
              "Customize headlines and descriptions for each location",
              "Pages show your full inventory since all cars are at your dealership",
              "Primary location is used for default SEO settings"
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Target Locations</h2>
              <p className="text-sm text-muted-foreground">Create location landing pages to target nearby cities</p>
            </div>
            <Button onClick={() => { resetLocationForm(); setEditingLocation(null); setLocationDialogOpen(true); }} data-testid="button-add-location">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>

          {locationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : locations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No target locations yet. Add cities you want to rank for.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {locations.map((location) => (
                <Card key={location.id} data-testid={`card-location-${location.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{location.city}, {location.state}</h3>
                          {location.isPrimary && <Badge variant="secondary">Primary</Badge>}
                          {!location.isActive && <Badge variant="outline">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          /location/{location.slug} • {location.radius || 50} mi radius
                        </p>
                        {location.headline && (
                          <p className="text-sm line-clamp-1">{location.headline}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/location/${location.slug}`} target="_blank" rel="noopener">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditLocation(location)} data-testid={`button-edit-location-${location.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setLocationToDelete(location); setDeleteLocationDialogOpen(true); }} data-testid={`button-delete-location-${location.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="citations">
          <AdminHelpBox
            title="Getting Started with Citations"
            description="Citations are mentions of your business name, address, and phone (NAP) on other websites. They help search engines verify your business and improve local rankings."
            icon={Target}
            variant="info"
            className="mb-6"
            steps={[
              { title: "Check your NAP", description: "Go to NAP Check tab and ensure all info is complete and consistent." },
              { title: "Submit to Data Aggregators", description: "These distribute your info to 100+ sites automatically. Start here for maximum reach." },
              { title: "Submit to Manual Directories", description: "High-value sites that require individual submissions. Track status as you go." },
            ]}
          />

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{citationStats?.totalDirectories || 0}</p>
                <p className="text-sm text-muted-foreground">Directories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{citationStats?.confirmed || 0}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{citationStats?.submitted || 0}</p>
                <p className="text-sm text-muted-foreground">Submitted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{citationStats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Data Aggregators</CardTitle>
              <CardDescription>Submit to these first - they distribute to 100+ sites</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminHelpBox
                title="Why Data Aggregators?"
                description="Data aggregators are services that distribute your business info to hundreds of directories at once. Submit to these first for maximum efficiency."
                icon={Lightbulb}
                variant="tip"
                className="mb-4"
                defaultOpen={false}
                tips={[
                  "Some aggregators are paid services but offer the best coverage",
                  "Free options like Foursquare still provide good distribution",
                  "Have your NAP data ready before submitting",
                  "Allow 2-4 weeks for data to propagate across networks"
                ]}
              />
              <div className="grid md:grid-cols-2 gap-4">
                {directories.filter(d => d.isAggregator).map((dir) => {
                  const submission = getSubmissionForDirectory(dir.id);
                  return (
                    <div key={dir.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`directory-${dir.id}`}>
                      <div>
                        <p className="font-medium">{dir.name}</p>
                        <p className="text-sm text-muted-foreground">{dir.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission ? statusBadge(submission.status) : statusBadge("not_started")}
                        {dir.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={dir.url} target="_blank" rel="noopener">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {!submission && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => createSubmissionMutation.mutate({ directoryId: dir.id, directoryName: dir.name, status: "pending" })}
                          >
                            Track
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Directories</CardTitle>
              <CardDescription>Submit to these individually for local SEO</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminHelpBox
                title="How Manual Submissions Work"
                description="These directories require individual submissions. Click the link icon to open each site, create your listing, then track your progress here."
                icon={Info}
                variant="info"
                className="mb-4"
                defaultOpen={false}
                steps={[
                  { title: "Click Track", description: "Start tracking a directory submission" },
                  { title: "Submit on their site", description: "Click the link icon to open the directory, then create your listing" },
                  { title: "Mark Submitted", description: "After submitting, mark it as submitted to track progress" },
                  { title: "Confirm when live", description: "Once your listing is verified and live, confirm it" }
                ]}
              />
              <div className="space-y-2">
                {directories.filter(d => !d.isAggregator).map((dir) => {
                  const submission = getSubmissionForDirectory(dir.id);
                  return (
                    <div key={dir.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`directory-${dir.id}`}>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{dir.name}</p>
                          <p className="text-xs text-muted-foreground">{dir.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission ? statusBadge(submission.status) : statusBadge("not_started")}
                        {dir.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={dir.url} target="_blank" rel="noopener">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {!submission ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => createSubmissionMutation.mutate({ directoryId: dir.id, directoryName: dir.name, status: "pending" })}
                          >
                            Track
                          </Button>
                        ) : submission.status === "pending" ? (
                          <Button 
                            size="sm"
                            onClick={() => updateSubmissionMutation.mutate({ id: submission.id, status: "submitted" })}
                          >
                            Mark Submitted
                          </Button>
                        ) : submission.status === "submitted" ? (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => updateSubmissionMutation.mutate({ id: submission.id, status: "confirmed" })}
                          >
                            Confirm
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nap">
          <AdminHelpBox
            title="Why NAP Consistency Matters"
            description="NAP stands for Name, Address, Phone. Search engines use this info to verify your business identity. Inconsistent NAP across directories confuses search engines and hurts rankings."
            icon={Building}
            variant="info"
            className="mb-6"
            defaultOpen={false}
            tips={[
              "Use the exact same business name everywhere (including Inc., LLC, etc.)",
              "Format your address consistently (St. vs Street, Suite vs Ste)",
              "Use the same phone number format across all listings",
              "Export your NAP data before submitting to directories to ensure consistency"
            ]}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {napCheck?.isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  NAP Consistency Check
                </CardTitle>
                <CardDescription>
                  Name, Address, Phone must be consistent across all citations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {napCheck?.issues && napCheck.issues.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="font-medium text-amber-800 mb-2">Missing Information:</p>
                    <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                      {napCheck.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {napCheck?.napData && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Building className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{napCheck.napData.name || "Not set"}</p>
                        <p className="text-sm text-muted-foreground">Business Name</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{napCheck.napData.address || "Not set"}</p>
                        <p className="text-sm text-muted-foreground">{napCheck.napData.city}, {napCheck.napData.state}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                      <p className="font-medium">{napCheck.napData.phone || "Not set"}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
                      <p className="font-medium">{napCheck.napData.email || "Not set"}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <LinkIcon className="w-4 h-4 mt-1 text-muted-foreground" />
                      <p className="font-medium">{napCheck.napData.website || "Not set"}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={copyNapData} data-testid="button-copy-nap">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy NAP
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export NAP Data</CardTitle>
                <CardDescription>Download your business info for manual submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use these exports to quickly fill out citation forms on directories that require manual submission.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => exportNapData("csv")} data-testid="button-export-csv">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportNapData("json")} data-testid="button-export-json">
                    <Download className="w-4 h-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add Target Location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={locationForm.city}
                  onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                  placeholder="e.g., Miami"
                  data-testid="input-city"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={locationForm.state}
                  onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                  placeholder="e.g., FL"
                  maxLength={2}
                  data-testid="input-state"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="radius">Service Radius (miles)</Label>
              <Input
                id="radius"
                type="number"
                value={locationForm.radius}
                onChange={(e) => setLocationForm({ ...locationForm, radius: parseInt(e.target.value) || 50 })}
                data-testid="input-radius"
              />
            </div>
            <div>
              <Label htmlFor="headline">Custom Headline (optional)</Label>
              <Input
                id="headline"
                value={locationForm.headline}
                onChange={(e) => setLocationForm({ ...locationForm, headline: e.target.value })}
                placeholder="Leave blank for default"
                data-testid="input-headline"
              />
            </div>
            <div>
              <Label htmlFor="description">Custom Description (optional)</Label>
              <Textarea
                id="description"
                value={locationForm.description}
                onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                placeholder="Leave blank for default"
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div>
              <Label htmlFor="metaTitle">SEO Title (optional)</Label>
              <Input
                id="metaTitle"
                value={locationForm.metaTitle}
                onChange={(e) => setLocationForm({ ...locationForm, metaTitle: e.target.value })}
                placeholder="Leave blank for auto-generated"
                data-testid="input-meta-title"
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">SEO Description (optional)</Label>
              <Textarea
                id="metaDescription"
                value={locationForm.metaDescription}
                onChange={(e) => setLocationForm({ ...locationForm, metaDescription: e.target.value })}
                placeholder="Leave blank for auto-generated"
                rows={2}
                data-testid="input-meta-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={locationForm.isActive}
                  onCheckedChange={(checked) => setLocationForm({ ...locationForm, isActive: checked })}
                  data-testid="switch-active"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPrimary"
                  checked={locationForm.isPrimary}
                  onCheckedChange={(checked) => setLocationForm({ ...locationForm, isPrimary: checked })}
                  data-testid="switch-primary"
                />
                <Label htmlFor="isPrimary">Primary Location</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleLocationSubmit}
              disabled={!locationForm.city || !locationForm.state || createLocationMutation.isPending || updateLocationMutation.isPending}
              data-testid="button-save-location"
            >
              {(createLocationMutation.isPending || updateLocationMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingLocation ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteLocationDialogOpen} onOpenChange={setDeleteLocationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {locationToDelete?.city}, {locationToDelete?.state}? This will remove the location landing page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => locationToDelete && deleteLocationMutation.mutate(locationToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
