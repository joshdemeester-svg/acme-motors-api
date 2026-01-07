import { Hero } from "@/components/home/Hero";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Star, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/luxury_sports_car_ex_2a1585ad.jpg';
import { useSEO, generateOrganizationSchema } from "@/hooks/use-seo";
import { useSettings } from "@/contexts/SettingsContext";
import { Testimonials } from "@/components/Testimonials";

export default function Home() {
  const { settings } = useSettings();
  
  useSEO({
    title: "Premium Auto Consignment",
    description: "Luxury automotive consignment services for discerning collectors and enthusiasts. Submit your vehicle for professional sale with expert marketing and global buyer reach.",
    type: "website",
    schema: settings ? generateOrganizationSchema(settings) : undefined,
    siteName: settings?.siteName || undefined,
  });
  const { data: featuredInventory = [] } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory", "featured"],
    queryFn: async () => {
      const res = await fetch("/api/inventory?featured=true");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: allInventory = [] } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const featuredCars = featuredInventory.length > 0 ? featuredInventory.slice(0, 3) : allInventory.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      
      <section className="py-24 bg-card/30">
        <div className="container px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold md:text-5xl">The Consignment Process</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We make selling your exotic or luxury vehicle effortless. From valuation to final sale, we handle every detail.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {[
              { title: "Submit Details", desc: "Share your vehicle's information and photos through our secure online portal." },
              { title: "Expert Valuation", desc: "Our market analysts provide a competitive valuation based on real-time market data." },
              { title: "Global Exposure", desc: "Your vehicle is marketed to our exclusive network of qualified buyers worldwide." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div 
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
                  style={{ 
                    backgroundColor: 'var(--step-bg-color, #DC2626)', 
                    color: 'var(--step-number-color, #FFFFFF)' 
                  }}
                >
                  {i + 1}
                </div>
                <h3 className="mb-3 font-serif text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featuredCars.length > 0 && (
        <section className="py-24">
          <div className="container px-4 md:px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="mb-2 font-serif text-3xl font-bold md:text-4xl">Featured Inventory</h2>
                <p className="text-muted-foreground">Curated selection of available vehicles.</p>
              </div>
              <Link href="/inventory">
                <Button variant="ghost" className="hidden gap-2 md:flex">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredCars.map((car) => (
                <Link key={car.id} href={`/inventory/${car.slug || car.id}`} data-testid={`link-featured-car-${car.id}`}>
                  <div className="group overflow-hidden rounded-lg bg-card transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
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
                      <div className="flex items-center justify-between border-t border-border pt-4">
                        <span className="text-muted-foreground">{car.mileage.toLocaleString()} miles</span>
                        <span className="font-semibold">${car.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-12 flex justify-center md:hidden">
              <Link href="/inventory">
                <Button variant="outline" className="w-full">View All Inventory</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Testimonials />

      <section className="bg-secondary/30 py-24">
        <div className="container px-4 text-center md:px-6">
          <h2 className="mb-12 font-serif text-3xl font-bold">Why Consign With Prestige?</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Market Leading Prices",
              "Secure Storage",
              "Professional Photography",
              "Verified Buyers"
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background p-4">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
