import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Car, Fuel, Gauge, Calendar, Palette, FileText, Settings, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/luxury_sports_car_ex_2a1585ad.jpg';

interface VinData {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  BodyClass?: string;
  DriveType?: string;
  FuelTypePrimary?: string;
  EngineCylinders?: string;
  EngineHP?: string;
  DisplacementL?: string;
  TransmissionStyle?: string;
  Doors?: string;
  PlantCity?: string;
  PlantCountry?: string;
  VehicleType?: string;
  ErrorCode?: string;
  ErrorText?: string;
}

export default function VehicleDetails({ id }: { id: string }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const { data: car, isLoading: carLoading } = useQuery<InventoryCar>({
    queryKey: [`/api/inventory/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/${id}`);
      if (!res.ok) throw new Error("Vehicle not found");
      return res.json();
    },
  });

  const { data: vinData, isLoading: vinLoading } = useQuery<VinData>({
    queryKey: ["vin-decode", car?.vin],
    queryFn: async () => {
      if (!car?.vin) throw new Error("No VIN available");
      const res = await fetch(`/api/vin-decode/${car.vin}`);
      if (!res.ok) throw new Error("Failed to decode VIN");
      return res.json();
    },
    enabled: !!car?.vin && car.vin.length >= 11,
  });

  if (carLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container px-4 py-12 md:px-6">
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-muted-foreground">Loading vehicle details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container px-4 py-12 md:px-6">
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-semibold">Vehicle Not Found</h2>
            <p className="text-muted-foreground">The vehicle you're looking for doesn't exist.</p>
            <Link href="/inventory">
              <Button>Back to Inventory</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const mainImage = car.photos && car.photos.length > 0 ? car.photos[0] : placeholderCar;
  const additionalPhotos = car.photos?.slice(1) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="container px-4 py-8 md:px-6">
        <Link href="/inventory">
          <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </Button>
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <img
                src={mainImage}
                alt={`${car.year} ${car.make} ${car.model}`}
                className="h-full w-full object-cover"
              />
              <Badge className="absolute top-4 right-4 capitalize" data-testid="badge-status">
                {car.status}
              </Badge>
            </div>

            {additionalPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {additionalPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-md">
                    <img
                      src={photo}
                      alt={`${car.make} ${car.model} photo ${index + 2}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-primary">{car.year} {car.make}</p>
              <h1 className="font-serif text-4xl font-bold" data-testid="text-vehicle-title">{car.model}</h1>
              <p className="mt-2 text-3xl font-bold text-primary" data-testid="text-price">
                ${car.price.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Gauge className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mileage</p>
                    <p className="font-semibold">{car.mileage.toLocaleString()} mi</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Exterior Color</p>
                    <p className="font-semibold">{car.color}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Condition</p>
                    <p className="font-semibold capitalize">{car.condition}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p className="font-semibold">{car.year}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">VIN</p>
                <p className="font-mono text-sm" data-testid="text-vin">{car.vin}</p>
              </CardContent>
            </Card>

            {car.description && (
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{car.description}</p>
                </CardContent>
              </Card>
            )}

            {vinData && !vinData.ErrorCode && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <Car className="h-5 w-5" />
                    VIN Decoded Information
                  </h3>
                  {vinLoading ? (
                    <p className="text-sm text-muted-foreground">Loading VIN data...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {vinData.BodyClass && (
                        <div>
                          <p className="text-muted-foreground">Body Style</p>
                          <p className="font-medium">{vinData.BodyClass}</p>
                        </div>
                      )}
                      {vinData.DriveType && (
                        <div>
                          <p className="text-muted-foreground">Drive Type</p>
                          <p className="font-medium">{vinData.DriveType}</p>
                        </div>
                      )}
                      {vinData.FuelTypePrimary && (
                        <div className="flex items-start gap-2">
                          <Fuel className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Fuel Type</p>
                            <p className="font-medium">{vinData.FuelTypePrimary}</p>
                          </div>
                        </div>
                      )}
                      {vinData.EngineCylinders && (
                        <div className="flex items-start gap-2">
                          <Settings className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Engine</p>
                            <p className="font-medium">
                              {vinData.EngineCylinders} Cylinder
                              {vinData.DisplacementL && ` / ${vinData.DisplacementL}L`}
                              {vinData.EngineHP && ` / ${vinData.EngineHP} HP`}
                            </p>
                          </div>
                        </div>
                      )}
                      {vinData.TransmissionStyle && (
                        <div>
                          <p className="text-muted-foreground">Transmission</p>
                          <p className="font-medium">{vinData.TransmissionStyle}</p>
                        </div>
                      )}
                      {vinData.Doors && (
                        <div>
                          <p className="text-muted-foreground">Doors</p>
                          <p className="font-medium">{vinData.Doors}</p>
                        </div>
                      )}
                      {vinData.PlantCountry && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Manufactured In</p>
                            <p className="font-medium">
                              {vinData.PlantCity && `${vinData.PlantCity}, `}
                              {vinData.PlantCountry}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Button className="w-full" size="lg" data-testid="button-contact">
              Contact Us About This Vehicle
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
