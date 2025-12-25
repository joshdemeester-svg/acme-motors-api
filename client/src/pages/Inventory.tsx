import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';

export default function Inventory() {
  const [search, setSearch] = useState("");

  const { data: inventory = [], isLoading } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const filteredInventory = inventory.filter(car => 
    car.make.toLowerCase().includes(search.toLowerCase()) || 
    car.model.toLowerCase().includes(search.toLowerCase())
  );

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
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
      </div>

      <Footer />
    </div>
  );
}
