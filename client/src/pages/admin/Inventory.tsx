import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Car, DollarSign, Pencil, Trash2, Eye, Loader2, Check, X, Clock } from "lucide-react";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';

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

  const { data: inventory = [], isLoading } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
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
                        onClick={() => setEditingVehicle(car)}
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

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Add a vehicle to your inventory. You can edit details after creating.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Vehicle creation form will be migrated here from the legacy admin panel.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVehicle} onOpenChange={() => setEditingVehicle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update vehicle details
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Vehicle editing form will be migrated here from the legacy admin panel.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVehicle(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
