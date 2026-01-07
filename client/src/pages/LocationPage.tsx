import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, ChevronRight, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { InventoryCar, SiteSettings } from "@shared/schema";
import { useSEO } from "@/hooks/use-seo";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';

interface TargetLocation {
  id: string;
  city: string;
  state: string;
  slug: string;
  headline?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  radius?: number;
  isPrimary?: boolean;
}

interface LocationPageProps {
  slug: string;
}

export default function LocationPage({ slug }: LocationPageProps) {
  const { data: location, isLoading: locationLoading } = useQuery<TargetLocation>({
    queryKey: ["/api/locations", slug],
    queryFn: async () => {
      const res = await fetch(`/api/locations/${slug}`);
      if (!res.ok) throw new Error("Location not found");
      return res.json();
    },
  });

  const { data: inventory = [] } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
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

  const availableVehicles = inventory.filter(car => car.status === "available");
  const featuredVehicles = availableVehicles.slice(0, 6);

  const seoTitle = location?.metaTitle || 
    `Luxury Cars for Sale in ${location?.city}, ${location?.state} | ${settings?.siteName || "PRESTIGE"}`;
  const seoDescription = location?.metaDescription ||
    `Browse premium luxury and exotic vehicles near ${location?.city}, ${location?.state}. Expert consignment services and competitive financing available.`;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    type: "website",
  });

  if (locationLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-white">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Location Not Found</h1>
          <p className="text-gray-400 mb-8">The location you're looking for doesn't exist.</p>
          <Link href="/inventory">
            <Button variant="outline">Browse All Inventory</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const headline = location.headline || 
    `Luxury Automotive Consignment in ${location.city}, ${location.state}`;
  const description = location.description ||
    `Discover premium luxury and exotic vehicles available for purchase near ${location.city}, ${location.state}. Our expert team provides personalized service, competitive financing, and a seamless buying experience for discerning collectors and enthusiasts.`;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": settings?.siteName || "PRESTIGE",
    "description": seoDescription,
    "url": settings?.baseUrl ? `${settings.baseUrl}/location/${slug}` : undefined,
    "telephone": settings?.contactPhone,
    "email": settings?.contactEmail,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": settings?.dealerAddress,
      "addressLocality": location.city,
      "addressRegion": location.state,
      "addressCountry": "US",
    },
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "name": `${location.city}, ${location.state}`,
      },
      "geoRadius": `${location.radius || 50} mi`,
    },
    "openingHoursSpecification": settings?.dealerHours ? {
      "@type": "OpeningHoursSpecification",
      "description": settings.dealerHours,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <section className="relative py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-[#D4AF37] mb-4">
              <MapPin className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider">
                {location.city}, {location.state}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6" data-testid="location-headline">
              {headline}
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8" data-testid="location-description">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inventory">
                <Button size="lg" className="bg-[#D4AF37] hover:bg-[#B8960C] text-black" data-testid="button-browse-inventory">
                  Browse Inventory
                </Button>
              </Link>
              <Link href="/consign">
                <Button size="lg" variant="outline" className="border-[#D4AF37] text-[#D4AF37]" data-testid="button-consign">
                  Consign Your Vehicle
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {featuredVehicles.length > 0 && (
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-serif text-white mb-8 text-center">
              Luxury Vehicles Available Near {location.city}, {location.state}
            </h2>
            <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
              Browse our curated selection of premium vehicles available for purchase. We serve customers within {location.radius || 50} miles of {location.city}.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVehicles.map((car) => (
                <Link key={car.id} href={`/inventory/${car.slug || car.id}`}>
                  <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-[#D4AF37] transition-colors cursor-pointer" data-testid={`card-vehicle-${car.id}`}>
                    <div className="aspect-[16/10] relative">
                      <img
                        src={car.photos?.[0] || placeholderCar}
                        alt={`${car.year} ${car.make} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-white font-medium mb-1">
                        {car.year} {car.make} {car.model}
                      </h3>
                      {car.trim && <p className="text-gray-400 text-sm mb-2">{car.trim}</p>}
                      <div className="flex justify-between items-center">
                        <span className="text-[#D4AF37] font-bold">
                          ${car.price?.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {car.mileage?.toLocaleString()} mi
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/inventory">
                <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37]" data-testid="button-view-all">
                  View All {availableVehicles.length} Vehicles
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl font-serif text-white mb-6">
                Why Choose {settings?.siteName || "PRESTIGE"}?
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-[#D4AF37] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Curated Selection</h3>
                    <p className="text-gray-400 text-sm">Every vehicle in our inventory is hand-selected for quality and value.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#D4AF37] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Local Expertise</h3>
                    <p className="text-gray-400 text-sm">Serving the {location.city} area with personalized automotive solutions.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-black p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-serif text-white mb-4">Contact Us</h3>
              <div className="space-y-4">
                {settings?.dealerAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <div>
                      <p className="text-white text-sm">{settings.dealerAddress}</p>
                      <p className="text-gray-400 text-sm">{settings.dealerCity}, {settings.dealerState}</p>
                    </div>
                  </div>
                )}
                {settings?.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                    <a href={`tel:${settings.contactPhone}`} className="text-white text-sm hover:text-[#D4AF37]">
                      {settings.contactPhone}
                    </a>
                  </div>
                )}
                {settings?.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#D4AF37]" />
                    <a href={`mailto:${settings.contactEmail}`} className="text-white text-sm hover:text-[#D4AF37]">
                      {settings.contactEmail}
                    </a>
                  </div>
                )}
                {settings?.dealerHours && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                    <p className="text-gray-400 text-sm">{settings.dealerHours}</p>
                  </div>
                )}
              </div>
              
              {settings?.googleMapUrl && (
                <div className="mt-6">
                  <iframe
                    src={settings.googleMapUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded"
                    title={`Map of ${settings?.siteName} location`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
