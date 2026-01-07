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
import { Plus, Search, Car, DollarSign, Pencil, Trash2, Eye, Loader2, Check, X, Clock, ChevronsUpDown, Upload, Star, CalendarDays, MessageSquare, GripVertical, Flame, HelpCircle, Camera, Lightbulb } from "lucide-react";
import { AdminHelpBox } from "@/components/admin/AdminHelpBox";
import type { InventoryCar, InventoryCarWithMetrics, SiteSettings } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function SortablePhotoItem({ 
  photo, 
  index, 
  onRemove 
}: { 
  photo: string; 
  index: number; 
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative group aspect-square rounded-md overflow-hidden border bg-muted"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-1 left-1 bg-black/70 text-white rounded p-1 cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </div>
      <img 
        src={photo} 
        alt={`Photo ${index + 1}`} 
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Remove photo"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      {index === 0 && (
        <span className="absolute bottom-1 left-1 bg-primary text-xs text-primary-foreground px-1 rounded">Main</span>
      )}
    </div>
  );
}

interface CsvVehicle {
  vin: string;
  year: number;
  make: string;
  model: string;
  mileage: number;
  color: string;
  price: number;
  condition: string;
  description?: string;
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvVehicle[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddPhotosDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = addPhotos.indexOf(active.id as string);
      const newIndex = addPhotos.indexOf(over.id as string);
      setAddPhotos(arrayMove(addPhotos, oldIndex, newIndex));
    }
  };

  const handleEditPhotosDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editPhotos.indexOf(active.id as string);
      const newIndex = editPhotos.indexOf(over.id as string);
      setEditPhotos(arrayMove(editPhotos, oldIndex, newIndex));
    }
  };

  const { data: inventory = [], isLoading } = useQuery<InventoryCarWithMetrics[]>({
    queryKey: ["/api/inventory/all"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/all");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const hotListingThreshold = settings?.hotListingThreshold || 5;

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
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
      toast({ title: "Vehicle deleted successfully" });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (vehicles: CsvVehicle[]) => {
      const res = await fetch("/api/inventory/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicles }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to upload vehicles");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all"] });
      toast({ title: `Successfully added ${data.count} vehicles` });
      setShowCsvDialog(false);
      setCsvPreview([]);
      setCsvError(null);
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const parseCsv = (text: string): CsvVehicle[] => {
    const records: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentField);
          currentField = "";
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          if (char === '\r') i++;
          currentRow.push(currentField);
          if (currentRow.some(f => f.trim().length > 0)) {
            records.push(currentRow);
          }
          currentRow = [];
          currentField = "";
        } else if (char !== '\r') {
          currentField += char;
        }
      }
    }
    
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim().length > 0)) {
        records.push(currentRow);
      }
    }
    
    if (records.length < 2) throw new Error("CSV must have a header row and at least one data row");
    
    const headers = records[0].map(h => h.trim().toLowerCase());
    const requiredHeaders = ["vin", "year", "make", "model", "mileage", "color", "price", "condition"];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
    }
    
    const vehicles: CsvVehicle[] = [];
    
    for (let i = 1; i < records.length; i++) {
      const values = records[i];
      if (values.length < requiredHeaders.length) continue;
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      
      const vin = row.vin?.trim();
      const year = row.year?.trim();
      const make = row.make?.trim();
      const model = row.model?.trim();
      
      if (!vin || !year || !make || !model) continue;
      
      vehicles.push({
        vin,
        year: parseInt(year) || 0,
        make,
        model,
        mileage: parseInt(row.mileage?.trim()) || 0,
        color: row.color?.trim() || "Unknown",
        price: parseInt(row.price?.trim()) || 0,
        condition: row.condition?.trim() || "Good",
        description: row.description,
      });
    }
    
    return vehicles;
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const vehicles = parseCsv(text);
        if (vehicles.length === 0) {
          setCsvError("No valid vehicles found in the CSV file");
          return;
        }
        setCsvPreview(vehicles);
      } catch (error) {
        setCsvError(error instanceof Error ? error.message : "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  };

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
        <AdminHelpBox
          title="Inventory Management Tips"
          description="Add and manage your vehicle listings. High-quality photos and complete details help vehicles sell faster."
          icon={Car}
          variant="info"
          defaultOpen={false}
          className="mb-2"
          tips={[
            "Enter a VIN to auto-fill vehicle details (year, make, model, trim)",
            "First photo becomes the main image - drag to reorder photos",
            "Mark vehicles as 'Hot Listing' to feature them with a flame badge",
            "Use CSV import for bulk uploads - download the template first",
            "Sold vehicles can be kept visible or hidden via settings"
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif">Inventory</h1>
            <p className="text-muted-foreground">
              {availableCount} available, {soldCount} sold
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCsvDialog(true)} data-testid="button-csv-upload">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-vehicle">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
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
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <StatusBadge status={car.status} />
                    {settings && (car.inquiryCount || 0) >= hotListingThreshold && car.status === "available" && (
                      <Badge className="bg-red-600 hover:bg-red-600 text-white gap-1" data-testid={`badge-hot-${car.id}`}>
                        <Flame className="h-3 w-3" />
                        HOT
                      </Badge>
                    )}
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
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground" title="Days on lot">
                          <CalendarDays className="h-3 w-3" />
                          {car.createdAt ? `${car.daysOnLot || 0} days` : "—"}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground" title="Inquiries">
                          <MessageSquare className="h-3 w-3" />
                          {car.inquiryCount || 0} {car.inquiryCount === 1 ? "lead" : "leads"}
                        </span>
                      </div>
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
                <Label>Photos ({addPhotos.length}) {addPhotos.length > 1 && <span className="text-muted-foreground font-normal">- Drag to reorder</span>}</Label>
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
                    const { uploadURL, objectPath } = await res.json();
                    (file as any).objectPath = objectPath;
                    return {
                      method: "PUT" as const,
                      url: uploadURL,
                      headers: { "Content-Type": file.type || "application/octet-stream" },
                    };
                  }}
                  onComplete={(result) => {
                    const newPhotos = (result.successful || []).map((file) => {
                      return (file as any).objectPath || "";
                    }).filter(Boolean);
                    if (newPhotos.length > 0) {
                      setAddPhotos(prev => [...prev, ...newPhotos]);
                      toast({ title: "Photos Uploaded", description: `${newPhotos.length} photo(s) added.` });
                    }
                  }}
                  buttonClassName="h-8"
                >
                  <Upload className="h-3 w-3 mr-1" /> Add Photos
                </ObjectUploader>
              </div>
              
              {addPhotos.length > 0 ? (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleAddPhotosDragEnd}
                >
                  <SortableContext items={addPhotos} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {addPhotos.map((photo, index) => (
                        <SortablePhotoItem
                          key={photo}
                          photo={photo}
                          index={index}
                          onRemove={() => setAddPhotos(prev => prev.filter((_, i) => i !== index))}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
                <Label>Photos ({editPhotos.length}) <span className="text-muted-foreground font-normal">- Drag to reorder, first photo is main</span></Label>
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
                    const { uploadURL, objectPath } = await res.json();
                    (file as any).objectPath = objectPath;
                    return {
                      method: "PUT" as const,
                      url: uploadURL,
                      headers: { "Content-Type": file.type || "application/octet-stream" },
                    };
                  }}
                  onComplete={(result) => {
                    const newPhotos = (result.successful || []).map((file) => {
                      return (file as any).objectPath || "";
                    }).filter(Boolean);
                    if (newPhotos.length > 0) {
                      setEditPhotos(prev => [...prev, ...newPhotos]);
                      toast({ title: "Photos Uploaded", description: `${newPhotos.length} photo(s) added.` });
                    }
                  }}
                  buttonClassName="h-8"
                >
                  <Upload className="h-3 w-3 mr-1" /> Add Photos
                </ObjectUploader>
              </div>
              
              {editPhotos.length > 0 ? (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleEditPhotosDragEnd}
                >
                  <SortableContext items={editPhotos} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {editPhotos.map((photo, index) => (
                        <SortablePhotoItem
                          key={photo}
                          photo={photo}
                          index={index}
                          onRemove={() => setEditPhotos(prev => prev.filter((_, i) => i !== index))}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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

      <Dialog open={showCsvDialog} onOpenChange={(open) => {
        if (!open) {
          setCsvPreview([]);
          setCsvError(null);
        }
        setShowCsvDialog(open);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Vehicles from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with vehicle data. Required columns: VIN, Year, Make, Model, Mileage, Color, Price, Condition
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {csvPreview.length === 0 ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">Click to upload CSV file</span>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCsvUpload}
                      data-testid="input-csv-file"
                    />
                  </Label>
                </div>
                {csvError && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                    {csvError}
                  </div>
                )}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">CSV Format Example:</p>
                  <code className="block bg-muted p-2 rounded text-xs overflow-x-auto">
                    VIN,Year,Make,Model,Mileage,Color,Price,Condition<br/>
                    1HGBH41JXMN109186,2021,Honda,Accord,15000,White,28500,Excellent<br/>
                    5YJSA1E26HF123456,2020,Tesla,Model S,22000,Red,65000,Good
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{csvPreview.length} vehicles ready to import</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCsvPreview([]);
                      setCsvError(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Year</th>
                        <th className="px-3 py-2 text-left">Make</th>
                        <th className="px-3 py-2 text-left">Model</th>
                        <th className="px-3 py-2 text-left">Mileage</th>
                        <th className="px-3 py-2 text-left">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 10).map((vehicle, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{vehicle.year}</td>
                          <td className="px-3 py-2">{vehicle.make}</td>
                          <td className="px-3 py-2">{vehicle.model}</td>
                          <td className="px-3 py-2">{vehicle.mileage.toLocaleString()}</td>
                          <td className="px-3 py-2">${vehicle.price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.length > 10 && (
                    <p className="p-2 text-center text-muted-foreground text-sm">
                      And {csvPreview.length - 10} more...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCsvDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => bulkUploadMutation.mutate(csvPreview)}
              disabled={csvPreview.length === 0 || bulkUploadMutation.isPending}
              data-testid="button-confirm-csv-upload"
            >
              {bulkUploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${csvPreview.length} Vehicles`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
