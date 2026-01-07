import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, ArrowLeft } from "lucide-react";
import { Link, useSearch } from "wouter";
import type { InventoryCar } from "@shared/schema";
import { useSEO } from "@/hooks/use-seo";
import placeholderCar from '@assets/stock_images/luxury_sports_car_ex_2a1585ad.jpg';

const MAX_COMPARE = 3;

export default function Compare() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialIds = params.get("ids")?.split(",").filter(Boolean) || [];
  
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  useSEO({
    title: "Compare Vehicles",
    description: "Compare luxury and exotic vehicles side by side. View specifications, pricing, and features to find your perfect match.",
  });

  const { data: allInventory = [] } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const selectedVehicles = allInventory.filter(car => selectedIds.includes(car.id));
  const availableVehicles = allInventory.filter(car => !selectedIds.includes(car.id));

  const addVehicle = (id: string) => {
    if (selectedIds.length < MAX_COMPARE && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeVehicle = (id: string) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") return value.toLocaleString();
    return String(value);
  };

  const specs: { label: string; key: keyof InventoryCar; format: (v: any) => string }[] = [
    { label: "Price", key: "price", format: (v: number) => `$${v.toLocaleString()}` },
    { label: "Year", key: "year", format: formatValue },
    { label: "Make", key: "make", format: formatValue },
    { label: "Model", key: "model", format: formatValue },
    { label: "Mileage", key: "mileage", format: (v: number) => `${v.toLocaleString()} mi` },
    { label: "Color", key: "color", format: formatValue },
    { label: "Condition", key: "condition", format: formatValue },
    { label: "VIN", key: "vin", format: formatValue },
    { label: "Status", key: "status", format: (v: string) => v.charAt(0).toUpperCase() + v.slice(1) },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container px-4 py-12 md:px-6">
        <div className="mb-8">
          <Link href="/inventory">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Inventory
            </Button>
          </Link>
          <h1 className="font-serif text-4xl font-bold">Compare Vehicles</h1>
          <p className="mt-2 text-muted-foreground">
            Select up to {MAX_COMPARE} vehicles to compare side by side.
          </p>
        </div>

        {selectedVehicles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <h3 className="mb-2 text-xl font-semibold">No vehicles selected</h3>
              <p className="mb-6 text-muted-foreground">
                Add vehicles from the dropdown below to start comparing.
              </p>
              {availableVehicles.length > 0 && (
                <Select onValueChange={addVehicle}>
                  <SelectTrigger className="mx-auto w-80" data-testid="select-add-vehicle">
                    <SelectValue placeholder="Add a vehicle to compare" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((car) => (
                      <SelectItem key={car.id} value={car.id}>
                        {car.year} {car.make} {car.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Vehicle Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {selectedVehicles.map((car) => (
                <Card key={car.id} className="relative overflow-hidden" data-testid={`compare-card-${car.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={() => removeVehicle(car.id)}
                    data-testid={`btn-remove-${car.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={car.photos?.[0] || placeholderCar}
                      alt={`${car.make} ${car.model}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-serif text-lg font-bold">{car.year} {car.make}</h3>
                    <p className="text-xl font-bold text-primary">{car.model}</p>
                    <Link href={`/inventory/${car.slug || car.id}`}>
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}

              {/* Add Vehicle Card */}
              {selectedVehicles.length < MAX_COMPARE && availableVehicles.length > 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center p-6">
                    <Plus className="mb-4 h-10 w-10 text-muted-foreground" />
                    <Select onValueChange={addVehicle}>
                      <SelectTrigger className="w-full" data-testid="select-add-another">
                        <SelectValue placeholder="Add vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.map((car) => (
                          <SelectItem key={car.id} value={car.id}>
                            {car.year} {car.make} {car.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Comparison Table */}
            {selectedVehicles.length >= 2 && (
              <div className="overflow-x-auto rounded-lg border border-border -mx-4 sm:mx-0">
                <p className="text-xs text-muted-foreground p-2 sm:hidden">← Scroll to see all vehicles →</p>
                <table className="w-full min-w-[500px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold text-sm sm:text-base whitespace-nowrap">Spec</th>
                      {selectedVehicles.map((car) => (
                        <th key={car.id} className="px-3 sm:px-4 py-3 text-center font-semibold text-sm sm:text-base min-w-[140px]">
                          <div className="sm:hidden">{car.make}</div>
                          <div className="sm:hidden text-xs text-muted-foreground">{car.model}</div>
                          <span className="hidden sm:inline">{car.year} {car.make} {car.model}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {specs.map((spec, idx) => (
                      <tr key={spec.key} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-sm whitespace-nowrap">{spec.label}</td>
                        {selectedVehicles.map((car) => (
                          <td key={car.id} className="px-3 sm:px-4 py-2 sm:py-3 text-center text-sm">
                            {spec.format((car as any)[spec.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedVehicles.length === 1 && (
              <p className="text-center text-muted-foreground">
                Add at least one more vehicle to see the comparison table.
              </p>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
