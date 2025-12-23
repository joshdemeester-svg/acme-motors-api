import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Car, Fuel, Gauge, Calendar, Palette, FileText, Settings, MapPin, Shield, Zap, Users, Factory } from "lucide-react";
import { Link } from "wouter";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';

interface VinData {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  BodyClass?: string;
  DriveType?: string;
  FuelTypePrimary?: string;
  FuelTypeSecondary?: string;
  EngineCylinders?: string;
  EngineHP?: string;
  DisplacementL?: string;
  DisplacementCC?: string;
  TransmissionStyle?: string;
  TransmissionSpeeds?: string;
  Doors?: string;
  PlantCity?: string;
  PlantState?: string;
  PlantCountry?: string;
  VehicleType?: string;
  ErrorCode?: string;
  ErrorText?: string;
  Manufacturer?: string;
  Series?: string;
  Trim?: string;
  GVWR?: string;
  CurbWeightLB?: string;
  Turbo?: string;
  ElectronicStabilityControl?: string;
  ABS?: string;
  AirBagLocFront?: string;
  AirBagLocSide?: string;
  AirBagLocCurtain?: string;
  BlindSpotMon?: string;
  ForwardCollisionWarning?: string;
  LaneDepartureWarning?: string;
  RearVisibilitySystem?: string;
  AdaptiveCruiseControl?: string;
  ParkAssist?: string;
  SeatRows?: string;
  Seats?: string;
  WheelBaseType?: string;
  WheelSizeFront?: string;
  BatteryKWH?: string;
  ChargerLevel?: string;
  EVDriveUnit?: string;
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
              {(!car.photos || car.photos.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-white font-semibold text-xl">Photo Coming Soon</span>
                </div>
              )}
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
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {vinData.VehicleType && (
                          <div>
                            <p className="text-muted-foreground">Vehicle Type</p>
                            <p className="font-medium">{vinData.VehicleType}</p>
                          </div>
                        )}
                        {vinData.BodyClass && (
                          <div>
                            <p className="text-muted-foreground">Body Style</p>
                            <p className="font-medium">{vinData.BodyClass}</p>
                          </div>
                        )}
                        {(vinData.Series || vinData.Trim) && (
                          <div>
                            <p className="text-muted-foreground">Trim/Series</p>
                            <p className="font-medium">{[vinData.Series, vinData.Trim].filter(Boolean).join(" ")}</p>
                          </div>
                        )}
                        {vinData.DriveType && (
                          <div>
                            <p className="text-muted-foreground">Drive Type</p>
                            <p className="font-medium">{vinData.DriveType}</p>
                          </div>
                        )}
                        {vinData.Doors && (
                          <div>
                            <p className="text-muted-foreground">Doors</p>
                            <p className="font-medium">{vinData.Doors}</p>
                          </div>
                        )}
                        {vinData.Seats && (
                          <div className="flex items-start gap-2">
                            <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Seating</p>
                              <p className="font-medium">{vinData.Seats} seats{vinData.SeatRows ? ` (${vinData.SeatRows} rows)` : ""}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                          <Settings className="h-4 w-4" />
                          Engine & Powertrain
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {vinData.EngineCylinders && (
                            <div>
                              <p className="text-muted-foreground">Engine</p>
                              <p className="font-medium">
                                {vinData.EngineCylinders} Cylinder
                                {vinData.DisplacementL && ` / ${vinData.DisplacementL}L`}
                                {vinData.Turbo && vinData.Turbo !== "Not Applicable" && " Turbo"}
                              </p>
                            </div>
                          )}
                          {vinData.EngineHP && (
                            <div className="flex items-start gap-2">
                              <Zap className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Horsepower</p>
                                <p className="font-medium">{vinData.EngineHP} HP</p>
                              </div>
                            </div>
                          )}
                          {vinData.FuelTypePrimary && (
                            <div className="flex items-start gap-2">
                              <Fuel className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Fuel Type</p>
                                <p className="font-medium">
                                  {vinData.FuelTypePrimary}
                                  {vinData.FuelTypeSecondary && ` / ${vinData.FuelTypeSecondary}`}
                                </p>
                              </div>
                            </div>
                          )}
                          {vinData.TransmissionStyle && (
                            <div>
                              <p className="text-muted-foreground">Transmission</p>
                              <p className="font-medium">
                                {vinData.TransmissionStyle}
                                {vinData.TransmissionSpeeds && ` (${vinData.TransmissionSpeeds}-Speed)`}
                              </p>
                            </div>
                          )}
                          {vinData.BatteryKWH && (
                            <div>
                              <p className="text-muted-foreground">Battery</p>
                              <p className="font-medium">{vinData.BatteryKWH} kWh</p>
                            </div>
                          )}
                          {vinData.EVDriveUnit && (
                            <div>
                              <p className="text-muted-foreground">EV Drive</p>
                              <p className="font-medium">{vinData.EVDriveUnit}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {(vinData.AirBagLocFront || vinData.ElectronicStabilityControl || vinData.BlindSpotMon || vinData.RearVisibilitySystem) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Shield className="h-4 w-4" />
                            Safety Features
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {vinData.AirBagLocFront && (
                              <Badge variant="secondary">Front Airbags</Badge>
                            )}
                            {vinData.AirBagLocSide && (
                              <Badge variant="secondary">Side Airbags</Badge>
                            )}
                            {vinData.AirBagLocCurtain && (
                              <Badge variant="secondary">Curtain Airbags</Badge>
                            )}
                            {vinData.ABS && vinData.ABS !== "Not Applicable" && (
                              <Badge variant="secondary">ABS</Badge>
                            )}
                            {vinData.ElectronicStabilityControl && vinData.ElectronicStabilityControl !== "Not Applicable" && (
                              <Badge variant="secondary">Stability Control</Badge>
                            )}
                            {vinData.BlindSpotMon && vinData.BlindSpotMon !== "Not Applicable" && (
                              <Badge variant="secondary">Blind Spot Monitor</Badge>
                            )}
                            {vinData.ForwardCollisionWarning && vinData.ForwardCollisionWarning !== "Not Applicable" && (
                              <Badge variant="secondary">Forward Collision Warning</Badge>
                            )}
                            {vinData.LaneDepartureWarning && vinData.LaneDepartureWarning !== "Not Applicable" && (
                              <Badge variant="secondary">Lane Departure Warning</Badge>
                            )}
                            {vinData.RearVisibilitySystem && vinData.RearVisibilitySystem !== "Not Applicable" && (
                              <Badge variant="secondary">Backup Camera</Badge>
                            )}
                            {vinData.AdaptiveCruiseControl && vinData.AdaptiveCruiseControl !== "Not Applicable" && (
                              <Badge variant="secondary">Adaptive Cruise</Badge>
                            )}
                            {vinData.ParkAssist && vinData.ParkAssist !== "Not Applicable" && (
                              <Badge variant="secondary">Park Assist</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {(vinData.PlantCountry || vinData.Manufacturer) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Factory className="h-4 w-4" />
                            Manufacturing
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {vinData.Manufacturer && (
                              <div>
                                <p className="text-muted-foreground">Manufacturer</p>
                                <p className="font-medium">{vinData.Manufacturer}</p>
                              </div>
                            )}
                            {vinData.PlantCountry && (
                              <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-muted-foreground">Assembly Plant</p>
                                  <p className="font-medium">
                                    {vinData.PlantCity && `${vinData.PlantCity}, `}
                                    {vinData.PlantState && `${vinData.PlantState}, `}
                                    {vinData.PlantCountry}
                                  </p>
                                </div>
                              </div>
                            )}
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
