import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';
import { useSEO } from "@/hooks/use-seo";
import { useSavedVehicles } from "@/hooks/use-saved-vehicles";

export default function SavedVehicles() {
  const { savedIds, toggleSaved, clearSaved } = useSavedVehicles();

  useSEO({
    title: "Saved Vehicles",
    description: "View your saved vehicles and favorites.",
  });

  const { data: allInventory = [], isLoading } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory?includeAll=true");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const savedVehicles = allInventory.filter(car => savedIds.includes(car.id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container px-4 py-12 md:px-6">
        <div className="mb-8">
          <Link href="/inventory">
            <Button variant="ghost" className="mb-4 gap-2" data-testid="btn-back-inventory">
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold md:text-4xl flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                Saved Vehicles
              </h1>
              <p className="mt-2 text-muted-foreground">
                {savedVehicles.length === 0 
                  ? "You haven't saved any vehicles yet." 
                  : `You have ${savedVehicles.length} saved vehicle${savedVehicles.length === 1 ? '' : 's'}.`}
              </p>
            </div>
            {savedVehicles.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearSaved}
                className="gap-2"
                data-testid="btn-clear-saved"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : savedVehicles.length === 0 ? (
          <div className="py-24 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No saved vehicles</h3>
            <p className="text-muted-foreground mb-6">
              Browse our inventory and click the heart icon to save vehicles you're interested in.
            </p>
            <Link href="/inventory">
              <Button data-testid="btn-browse-inventory">Browse Inventory</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {savedVehicles.map((car) => (
              <div 
                key={car.id} 
                className="group overflow-hidden rounded-lg bg-card border border-border transition-all hover:shadow-xl hover:shadow-primary/5" 
                data-testid={`card-saved-${car.id}`}
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img 
                    src={car.photos && car.photos.length > 0 ? car.photos[0] : placeholderCar}
                    alt={`${car.make} ${car.model}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {car.status === "sold" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-gray-700 text-white px-4 py-2 rounded font-bold transform -rotate-12">
                        SOLD
                      </span>
                    </div>
                  )}
                  {car.status === "pending" && (
                    <div className="absolute top-4 right-4">
                      <div className="rounded bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        SALE PENDING
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => toggleSaved(car.id)}
                    className="absolute top-4 left-4 flex items-center justify-center rounded-lg p-2 shadow-lg cursor-pointer transition-all border bg-red-500 text-white border-red-500 hover:bg-red-600"
                    data-testid={`btn-unsave-${car.id}`}
                    title="Remove from saved"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
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
                  
                  <Link href={`/vehicle/${car.slug || car.id}`}>
                    <Button className="mt-6 w-full" data-testid={`btn-view-saved-${car.id}`}>
                      View Details
                    </Button>
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
