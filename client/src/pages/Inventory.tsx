import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';
import { useSEO } from "@/hooks/use-seo";

interface Filters {
  make: string;
  model: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  minMileage: string;
  maxMileage: string;
}

const defaultFilters: Filters = {
  make: "",
  model: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
  minMileage: "",
  maxMileage: "",
};

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  
  useSEO({
    title: "Current Inventory",
    description: "Browse our collection of premium luxury and exotic vehicles available for purchase. Quality consignment vehicles with full documentation and transparent history.",
  });

  const { data: inventory = [], isLoading } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const { data: soldVehicles = [] } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory/sold"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/sold");
      if (!res.ok) throw new Error("Failed to fetch sold vehicles");
      return res.json();
    },
  });

  const uniqueMakes = useMemo(() => {
    const makes = Array.from(new Set(inventory.map(car => car.make))).sort();
    return makes;
  }, [inventory]);

  const uniqueModels = useMemo(() => {
    const filtered = filters.make 
      ? inventory.filter(car => car.make === filters.make)
      : inventory;
    const models = Array.from(new Set(filtered.map(car => car.model))).sort();
    return models;
  }, [inventory, filters.make]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.make) count++;
    if (filters.model) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.minYear) count++;
    if (filters.maxYear) count++;
    if (filters.minMileage) count++;
    if (filters.maxMileage) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSearch("");
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(car => {
      if (search && !car.make.toLowerCase().includes(search.toLowerCase()) && 
          !car.model.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (filters.make && car.make !== filters.make) return false;
      if (filters.model && car.model !== filters.model) return false;
      if (filters.minPrice && car.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && car.price > parseInt(filters.maxPrice)) return false;
      if (filters.minYear && car.year < parseInt(filters.minYear)) return false;
      if (filters.maxYear && car.year > parseInt(filters.maxYear)) return false;
      if (filters.minMileage && car.mileage < parseInt(filters.minMileage)) return false;
      if (filters.maxMileage && car.mileage > parseInt(filters.maxMileage)) return false;
      return true;
    });
  }, [inventory, search, filters]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container px-4 py-12 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 font-serif text-4xl font-bold">Current Inventory</h1>
            <p className="text-muted-foreground">Browse our collection of available premium vehicles.</p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search make or model..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-8 p-6 bg-card border border-border rounded-lg" data-testid="filter-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Filter Vehicles</h3>
              {(activeFilterCount > 0 || search) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground" data-testid="button-clear-filters">
                  <X className="h-4 w-4 mr-1" /> Clear All
                </Button>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Make</Label>
                <Select 
                  value={filters.make} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, make: value === "all" ? "" : value, model: "" }))}
                >
                  <SelectTrigger data-testid="select-make">
                    <SelectValue placeholder="All Makes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {uniqueMakes.map(make => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select 
                  value={filters.model} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, model: value === "all" ? "" : value }))}
                >
                  <SelectTrigger data-testid="select-model">
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {uniqueModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    data-testid="input-min-price"
                  />
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    data-testid="input-max-price"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="From" 
                    value={filters.minYear}
                    onChange={(e) => setFilters(prev => ({ ...prev, minYear: e.target.value }))}
                    data-testid="input-min-year"
                  />
                  <Input 
                    type="number" 
                    placeholder="To" 
                    value={filters.maxYear}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxYear: e.target.value }))}
                    data-testid="input-max-year"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-4">
                <Label>Mileage</Label>
                <div className="flex gap-2 max-w-md">
                  <Input 
                    type="number" 
                    placeholder="Min miles" 
                    value={filters.minMileage}
                    onChange={(e) => setFilters(prev => ({ ...prev, minMileage: e.target.value }))}
                    data-testid="input-min-mileage"
                  />
                  <Input 
                    type="number" 
                    placeholder="Max miles" 
                    value={filters.maxMileage}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxMileage: e.target.value }))}
                    data-testid="input-max-mileage"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
              Showing {filteredInventory.length} of {inventory.length} vehicles
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="py-24 text-center">
            <h3 className="text-xl font-semibold">No vehicles found</h3>
            <p className="text-muted-foreground">
              {inventory.length === 0 
                ? "Check back soon for new arrivals." 
                : "Try adjusting your search criteria."}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredInventory.map((car) => (
              <div key={car.id} className="group overflow-hidden rounded-lg bg-card border border-border transition-all hover:shadow-xl hover:shadow-primary/5" data-testid={`card-car-${car.id}`}>
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img 
                    src={car.photos && car.photos.length > 0 ? car.photos[0] : placeholderCar}
                    alt={`${car.make} ${car.model}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 rounded bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-md capitalize">
                    {car.status}
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-2 text-sm font-medium text-white">{car.year} {car.make}</div>
                  <h3 className="mb-4 font-serif text-2xl font-bold">{car.model}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                    <div>
                      <span className="block text-muted-foreground">Price</span>
                      <span className="font-semibold text-lg">${car.price.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-muted-foreground">Mileage</span>
                      <span className="font-semibold text-lg">{car.mileage.toLocaleString()} mi</span>
                    </div>
                  </div>
                  
                  <Link href={`/vehicle/${car.id}`}>
                    <Button className="mt-6 w-full" data-testid={`button-view-${car.id}`}>View Details</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recently Sold Section */}
        {soldVehicles.length > 0 && (
          <div className="mt-16" data-testid="recently-sold-section">
            <div className="mb-8">
              <h2 className="mb-2 font-serif text-3xl font-bold">Recently Sold</h2>
              <p className="text-muted-foreground">Vehicles we've successfully sold for our clients.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {soldVehicles.slice(0, 8).map((car) => (
                <div key={car.id} className="overflow-hidden rounded-lg bg-card/50 border border-border relative" data-testid={`card-sold-${car.id}`}>
                  <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
                    <span className="bg-primary text-primary-foreground px-4 py-2 rounded font-bold text-lg transform -rotate-12">
                      SOLD
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img 
                      src={car.photos && car.photos.length > 0 ? car.photos[0] : placeholderCar}
                      alt={`${car.make} ${car.model}`}
                      className="h-full w-full object-cover grayscale-[30%]"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">{car.year} {car.make}</p>
                    <h3 className="font-serif text-lg font-bold">{car.model}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
