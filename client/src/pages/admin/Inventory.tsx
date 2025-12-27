import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Plus, Search, Car, DollarSign, Pencil, Trash2, Eye, Loader2, Check, X, Clock, ChevronsUpDown, Upload, Star } from "lucide-react";
import type { InventoryCar } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';

interface NHTSAMake {
  MakeId: number;
  MakeName: string;
}

interface NHTSAModel {
  Model_ID: number;
  Model_Name: string;
}

async function fetchMakes(): Promise<NHTSAMake[]> {
  const res = await fetch(`/api/vehicle-makes`);
  if (!res.ok) throw new Error("Failed to fetch makes");
  return res.json();
}

async function fetchModelsForMakeYear(make: string, year: string): Promise<NHTSAModel[]> {
  const res = await fetch(`/api/vehicle-models/${encodeURIComponent(make)}/${year}`);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const statusValue = status || "available";
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    available: { variant: "default", icon: <Check className="h-3 w-3" /> },
    sold: { variant: "secondary", icon: <DollarSign className="h-3 w-3" /> },
    pending: { variant: "outline", icon: <Clock className="h-3 w-3" /> },
  };
  const config = variants[statusValue] || variants.available;
  
  return (
    <Badge variant={config.variant} className="gap-1 capitalize">
      {config.icon}
      {statusValue}
    </Badge>
  );
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<InventoryCar | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [vin, setVin] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [mileage, setMileage] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [description, setDescription] = useState("");
  const [addStatus, setAddStatus] = useState("available");
  const [addFeatured, setAddFeatured] = useState(false);
  const [addPhotos, setAddPhotos] = useState<string[]>([]);
  const [vinLoading, setVinLoading] = useState(false);
  const [makeOpen, setMakeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const [editVin, setEditVin] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editMake, setEditMake] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("available");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [editMakeOpen, setEditMakeOpen] = useState(false);
  const [editModelOpen, setEditModelOpen] = useState(false);
  const [editVinLoading, setEditVinLoading] = useState(false);

  const { data: inventory = [], isLoading } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const { data: makes = [], isLoading: isLoadingMakes } = useQuery<NHTSAMake[]>({
    queryKey: ["vehicleMakes"],
    queryFn: fetchMakes,
    staleTime: 1000 * 60 * 60,
  });

  const { data: models = [], isLoading: isLoadingModels } = useQuery<NHTSAModel[]>({
    queryKey: ["vehicleModels", make, year],
    queryFn: () => fetchModelsForMakeYear(make, year),
    enabled: !!make && !!year,
    staleTime: 1000 * 60 * 60,
  });

  const { data: editModels = [], isLoading: isLoadingEditModels } = useQuery<NHTSAModel[]>({
    queryKey: ["vehicleModels", editMake, editYear],
    queryFn: () => fetchModelsForMakeYear(editMake, editYear),
    enabled: !!editMake && !!editYear,
    staleTime: 1000 * 60 * 60,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create vehicle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Vehicle added successfully" });
      setShowAddDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to add vehicle", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update vehicle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Vehicle updated successfully" });
      setEditingVehicle(null);
    },
    onError: () => {
      toast({ title: "Failed to update vehicle", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete vehicle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Vehicle deleted successfully" });
    },
  });

  const resetForm = () => {
    setVin("");
    setYear("");
    setMake("");
    setModel("");
    setColor("");
    setMileage("");
    setPrice("");
    setCondition("Excellent");
    setDescription("");
    setAddStatus("available");
    setAddFeatured(false);
    setAddPhotos([]);
  };

  const handleVinLookup = async (vinValue?: string) => {
    const vinToLookup = vinValue || vin;
    if (!vinToLookup || vinToLookup.length < 11) {
      if (!vinValue) {
        toast({ title: "Error", description: "Please enter a valid VIN (at least 11 characters).", variant: "destructive" });
      }
      return;
    }
    
    setVinLoading(true);
    try {
      const res = await fetch(`/api/vin-decode/${vinToLookup}`);
      if (!res.ok) throw new Error("Failed to decode VIN");
      const data = await res.json();
      
      if (data.ErrorCode && data.ErrorCode !== "0") {
        if (!vinValue) {
          toast({ title: "VIN Not Found", description: "Could not find vehicle information for this VIN.", variant: "destructive" });
        }
        return;
      }
      
      setYear(data.ModelYear || "");
      setMake(data.Make || "");
      setModel(data.Model || "");
      
      toast({ title: "VIN Decoded", description: `Found: ${data.ModelYear} ${data.Make} ${data.Model}` });
    } catch {
      if (!vinValue) {
        toast({ title: "Error", description: "Failed to lookup VIN.", variant: "destructive" });
      }
    } finally {
      setVinLoading(false);
    }
  };

  const handleEditVinLookup = async () => {
    if (!editVin || editVin.length < 11) {
      toast({ title: "Error", description: "Please enter a valid VIN (at least 11 characters).", variant: "destructive" });
      return;
    }
    
    setEditVinLoading(true);
    try {
      const res = await fetch(`/api/vin-decode/${editVin}`);
      if (!res.ok) throw new Error("Failed to decode VIN");
      const data = await res.json();
      
      if (data.ErrorCode && data.ErrorCode !== "0") {
        toast({ title: "VIN Not Found", description: "Could not find vehicle information for this VIN.", variant: "destructive" });
        return;
      }
      
      setEditYear(data.ModelYear || "");
      setEditMake(data.Make || "");
      setEditModel(data.Model || "");
      
      toast({ title: "VIN Decoded", description: `Found: ${data.ModelYear} ${data.Make} ${data.Model}` });
    } catch {
      toast({ title: "Error", description: "Failed to lookup VIN.", variant: "destructive" });
    } finally {
      setEditVinLoading(false);
    }
  };

  const handleAddVehicle = () => {
    const mileageNum = parseInt(mileage);
    const priceNum = parseInt(price);
    const yearNum = parseInt(year);
    
    if (!vin || vin.length < 11) {
      toast({ title: "Error", description: "VIN is required (at least 11 characters).", variant: "destructive" });
      return;
    }
    if (isNaN(yearNum) || yearNum < 1900) {
      toast({ title: "Error", description: "Valid year is required.", variant: "destructive" });
      return;
    }
    if (!make.trim()) {
      toast({ title: "Error", description: "Make is required.", variant: "destructive" });
      return;
    }
    if (!model.trim()) {
      toast({ title: "Error", description: "Model is required.", variant: "destructive" });
      return;
    }
    if (isNaN(mileageNum) || mileageNum < 0) {
      toast({ title: "Error", description: "Valid mileage is required.", variant: "destructive" });
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      toast({ title: "Error", description: "Valid price is required.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      vin: vin.toUpperCase(),
      year: yearNum,
      make: make.trim(),
      model: model.trim(),
      color: color.trim() || "Unknown",
      mileage: mileageNum,
      price: priceNum,
      condition: condition.trim() || "Excellent",
      description: description.trim() || null,
      status: addStatus,
      featured: addFeatured,
      photos: addPhotos,
    });
  };

  const handleUpdateVehicle = () => {
    if (!editingVehicle) return;
    
    const mileageNum = parseInt(editMileage);
    const priceNum = parseInt(editPrice);
    const yearNum = parseInt(editYear);
    
    if (!editVin || editVin.length < 11) {
      toast({ title: "Error", description: "VIN is required.", variant: "destructive" });
      return;
    }
    if (isNaN(yearNum) || yearNum < 1900) {
      toast({ title: "Error", description: "Valid year is required.", variant: "destructive" });
      return;
    }
    if (!editMake.trim()) {
      toast({ title: "Error", description: "Make is required.", variant: "destructive" });
      return;
    }
    if (!editModel.trim()) {
      toast({ title: "Error", description: "Model is required.", variant: "destructive" });
      return;
    }
    if (isNaN(mileageNum) || mileageNum < 0) {
      toast({ title: "Error", description: "Valid mileage is required.", variant: "destructive" });
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      toast({ title: "Error", description: "Valid price is required.", variant: "destructive" });
      return;
    }

    updateMutation.mutate({
      id: editingVehicle.id,
      data: {
        vin: editVin.toUpperCase(),
        year: yearNum,
        make: editMake.trim(),
        model: editModel.trim(),
        color: editColor.trim() || "Unknown",
        mileage: mileageNum,
        status: editStatus,
        featured: editFeatured,
        photos: editPhotos,
        price: priceNum,
        condition: editCondition.trim() || "Excellent",
        description: editDescription.trim() || null,
      },
    });
  };

  const openEditDialog = (car: InventoryCar) => {
    setEditingVehicle(car);
    setEditVin(car.vin || "");
    setEditYear(car.year.toString());
    setEditMake(car.make);
    setEditModel(car.model);
    setEditColor(car.color);
    setEditMileage(car.mileage.toString());
    setEditPrice(car.price.toString());
    setEditCondition(car.condition);
    setEditDescription(car.description || "");
    setEditStatus(car.status || "available");
    setEditFeatured(car.featured || false);
    setEditPhotos(car.photos || []);
  };

  const filteredInventory = inventory.filter((car) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      car.make.toLowerCase().includes(searchLower) ||
      car.model.toLowerCase().includes(searchLower) ||
      car.year.toString().includes(searchLower) ||
      (car.vin && car.vin.toLowerCase().includes(searchLower))
    );
  });

  const availableCount = inventory.filter(v => v.status === "available").length;
  const soldCount = inventory.filter(v => v.status === "sold").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif">Inventory</h1>
            <p className="text-muted-foreground">
              {availableCount} available, {soldCount} sold
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-vehicle">
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by make, model, year, or VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-inventory"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredInventory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No vehicles found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Add your first vehicle to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInventory.map((car) => (
              <Card key={car.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  <img
                    src={car.photos?.[0] || placeholderCar}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = placeholderCar;
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={car.status} />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <p className="text-lg font-bold text-primary">
                        ${car.price.toLocaleString()}
                      </p>
                      {car.mileage && (
                        <p className="text-sm text-muted-foreground">
                          {car.mileage.toLocaleString()} miles
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/vehicle/${car.id}`, "_blank")}
                        data-testid={`button-view-${car.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(car)}
                        data-testid={`button-edit-${car.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this vehicle?")) {
                            deleteMutation.mutate(car.id);
                          }
                        }}
                        data-testid={`button-delete-${car.id}`}
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
      </div>

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowAddDialog(open);
      }}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter a VIN to auto-fill vehicle details, then add mileage and price.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <div className="flex gap-2">
                <Input
                  id="vin"
                  value={vin}
                  onChange={(e) => {
                    const newVin = e.target.value.toUpperCase();
                    setVin(newVin);
                    if (newVin.length === 17) {
                      handleVinLookup(newVin);
                    }
                  }}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="flex-1"
                  data-testid="input-add-vin"
                />
                {vinLoading && (
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
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setModel("");
                  }}
                  placeholder="e.g. 2021"
                  data-testid="input-add-year"
                />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Popover open={makeOpen} onOpenChange={setMakeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={makeOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-add-make"
                      disabled={isLoadingMakes}
                    >
                      {make || (isLoadingMakes ? "Loading..." : "Search make...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search make..." />
                      <CommandList>
                        <CommandEmpty>No make found.</CommandEmpty>
                        <CommandGroup>
                          {makes
                            .filter((m) => m.MakeName)
                            .sort((a, b) => (a.MakeName || "").localeCompare(b.MakeName || ""))
                            .map((m) => (
                              <CommandItem
                                key={m.MakeId}
                                value={m.MakeName}
                                onSelect={() => {
                                  setMake(m.MakeName);
                                  setModel("");
                                  setMakeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    make === m.MakeName ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {m.MakeName}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={modelOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-add-model"
                      disabled={!make || !year || isLoadingModels}
                    >
                      {model || (!make ? "Select make first" : !year ? "Select year first" : isLoadingModels ? "Loading..." : "Search model...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search model..." />
                      <CommandList>
                        <CommandEmpty>No model found.</CommandEmpty>
                        <CommandGroup>
                          {models
                            .filter((m) => m.Model_Name)
                            .sort((a, b) => (a.Model_Name || "").localeCompare(b.Model_Name || ""))
                            .map((m) => (
                              <CommandItem
                                key={m.Model_ID}
                                value={m.Model_Name}
                                onSelect={() => {
                                  setModel(m.Model_Name);
                                  setModelOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    model === m.Model_Name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {m.Model_Name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Red"
                  data-testid="input-add-color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage *</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g. 25000"
                  data-testid="input-add-mileage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 45000"
                  data-testid="input-add-price"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Excellent, Good, Fair"
                data-testid="input-add-condition"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter vehicle description..."
                rows={3}
                data-testid="input-add-description"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addStatus">Status</Label>
                <Select value={addStatus} onValueChange={setAddStatus}>
                  <SelectTrigger data-testid="select-add-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addFeatured">Featured</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="addFeatured"
                    checked={addFeatured}
                    onCheckedChange={setAddFeatured}
                    data-testid="switch-add-featured"
                  />
                  <span className="text-sm text-muted-foreground">
                    {addFeatured ? "Featured on homepage" : "Not featured"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Photos ({addPhotos.length})</Label>
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
                    return {
                      method: "PUT" as const,
                      url: uploadURL,
                      headers: { "Content-Type": file.type || "application/octet-stream" },
                    };
                  }}
                  onComplete={(result) => {
                    const newPhotos = (result.successful || []).map((file) => {
                      const urlParts = file.uploadURL?.split("/") || [];
                      const objectId = urlParts[urlParts.length - 1]?.split("?")[0] || "";
                      return `/objects/uploads/${objectId}`;
                    }).filter(Boolean);
                    if (newPhotos.length > 0) {
                      setAddPhotos([...addPhotos, ...newPhotos]);
                      toast({ title: "Photos Uploaded", description: `${newPhotos.length} photo(s) added.` });
                    }
                  }}
                  buttonClassName="h-8"
                >
                  <Upload className="h-3 w-3 mr-1" /> Add Photos
                </ObjectUploader>
              </div>
              
              {addPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {addPhotos.map((photo, index) => (
                    <div key={index} className="relative group aspect-square rounded-md overflow-hidden border">
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`} 
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setAddPhotos(addPhotos.filter((_, i) => i !== index))}
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
                setShowAddDialog(false); 
                resetForm(); 
              }} 
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddVehicle}
              disabled={createMutation.isPending}
              data-testid="button-submit-add-vehicle"
              className="w-full sm:w-auto"
            >
              {createMutation.isPending ? "Adding..." : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVehicle} onOpenChange={(open) => {
        if (!open) setEditingVehicle(null);
      }}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update vehicle details
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="editVin">VIN</Label>
              <div className="flex gap-2">
                <Input
                  id="editVin"
                  value={editVin}
                  onChange={(e) => setEditVin(e.target.value.toUpperCase())}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="flex-1"
                  data-testid="input-edit-vin"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditVinLookup}
                  disabled={editVinLoading || editVin.length < 11}
                >
                  {editVinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                </Button>
              </div>
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
                  placeholder="e.g. 2021"
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
                      {editMake || "Search make..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search make..." />
                      <CommandList>
                        <CommandEmpty>No make found.</CommandEmpty>
                        <CommandGroup>
                          {makes
                            .filter((m) => m.MakeName)
                            .sort((a, b) => (a.MakeName || "").localeCompare(b.MakeName || ""))
                            .map((m) => (
                              <CommandItem
                                key={m.MakeId}
                                value={m.MakeName}
                                onSelect={() => {
                                  setEditMake(m.MakeName);
                                  setEditModel("");
                                  setEditMakeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editMake === m.MakeName ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {m.MakeName}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                        <CommandEmpty>No model found.</CommandEmpty>
                        <CommandGroup>
                          {editModels
                            .filter((m) => m.Model_Name)
                            .sort((a, b) => (a.Model_Name || "").localeCompare(b.Model_Name || ""))
                            .map((m) => (
                              <CommandItem
                                key={m.Model_ID}
                                value={m.Model_Name}
                                onSelect={() => {
                                  setEditModel(m.Model_Name);
                                  setEditModelOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editModel === m.Model_Name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {m.Model_Name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editColor">Color</Label>
                <Input
                  id="editColor"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="e.g. Red"
                  data-testid="input-edit-color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMileage">Mileage *</Label>
                <Input
                  id="editMileage"
                  type="number"
                  value={editMileage}
                  onChange={(e) => setEditMileage(e.target.value)}
                  placeholder="e.g. 25000"
                  data-testid="input-edit-mileage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPrice">Price ($) *</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="e.g. 45000"
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
              <Label htmlFor="editDescription">Description (optional)</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter vehicle description..."
                rows={3}
                data-testid="input-edit-description"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editFeatured">Featured</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="editFeatured"
                    checked={editFeatured}
                    onCheckedChange={setEditFeatured}
                    data-testid="switch-edit-featured"
                  />
                  <span className="text-sm text-muted-foreground">
                    {editFeatured ? "Featured on homepage" : "Not featured"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
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
                    return {
                      method: "PUT" as const,
                      url: uploadURL,
                      headers: { "Content-Type": file.type || "application/octet-stream" },
                    };
                  }}
                  onComplete={(result) => {
                    const newPhotos = (result.successful || []).map((file) => {
                      const urlParts = file.uploadURL?.split("/") || [];
                      const objectId = urlParts[urlParts.length - 1]?.split("?")[0] || "";
                      return `/objects/uploads/${objectId}`;
                    }).filter(Boolean);
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              onClick={() => setEditingVehicle(null)} 
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateVehicle}
              disabled={updateMutation.isPending}
              data-testid="button-submit-edit-vehicle"
              className="w-full sm:w-auto"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
