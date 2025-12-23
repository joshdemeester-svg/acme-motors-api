import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Car, Fuel, Gauge, Calendar, Palette, FileText, Settings, MapPin, Shield, Zap, Users, Factory, Cog, DollarSign, Weight, CircleDot, Lightbulb, Battery } from "lucide-react";
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
  EngineKW?: string;
  DisplacementL?: string;
  DisplacementCC?: string;
  DisplacementCI?: string;
  TransmissionStyle?: string;
  TransmissionSpeeds?: string;
  Doors?: string;
  Windows?: string;
  PlantCity?: string;
  PlantState?: string;
  PlantCountry?: string;
  PlantCompanyName?: string;
  VehicleType?: string;
  ErrorCode?: string;
  ErrorText?: string;
  Manufacturer?: string;
  ManufacturerId?: string;
  Series?: string;
  Series2?: string;
  Trim?: string;
  Trim2?: string;
  GVWR?: string;
  GVWR_to?: string;
  CurbWeightLB?: string;
  BasePrice?: string;
  Turbo?: string;
  EngineConfiguration?: string;
  EngineManufacturer?: string;
  EngineModel?: string;
  FuelInjectionType?: string;
  ValveTrainDesign?: string;
  OtherEngineInfo?: string;
  ElectronicStabilityControl?: string;
  TractionControl?: string;
  ABS?: string;
  AirBagLocFront?: string;
  AirBagLocSide?: string;
  AirBagLocCurtain?: string;
  AirBagLocKnee?: string;
  AirBagLocSeatCushion?: string;
  SeatBeltsAll?: string;
  Pretensioner?: string;
  BlindSpotMon?: string;
  BlindSpotIntervention?: string;
  ForwardCollisionWarning?: string;
  CIB?: string;
  AutomaticEmergencyBraking?: string;
  LaneDepartureWarning?: string;
  LaneKeepSystem?: string;
  LaneCenteringAssistance?: string;
  RearVisibilitySystem?: string;
  RearCrossTrafficAlert?: string;
  RearAutomaticEmergencyBraking?: string;
  AdaptiveCruiseControl?: string;
  ParkAssist?: string;
  AutoReverseSystem?: string;
  DaytimeRunningLight?: string;
  AdaptiveHeadlights?: string;
  SemiautomaticHeadlampBeamSwitching?: string;
  HeadlampLightSource?: string;
  AutomaticPedestrianAlertingSound?: string;
  PedestrianAutomaticEmergencyBraking?: string;
  KeylessIgnition?: string;
  EDR?: string;
  TPMS?: string;
  TPMSType?: string;
  ActiveSafetySystemNote?: string;
  SeatRows?: string;
  Seats?: string;
  WheelBaseType?: string;
  WheelBaseShort?: string;
  WheelBaseLong?: string;
  WheelSizeFront?: string;
  WheelSizeRear?: string;
  Wheels?: string;
  TrackWidth?: string;
  SteeringLocation?: string;
  BrakeSystemType?: string;
  BrakeSystemDesc?: string;
  BatteryA?: string;
  BatteryA_to?: string;
  BatteryV?: string;
  BatteryV_to?: string;
  BatteryKWH?: string;
  BatteryKWH_to?: string;
  BatteryCells?: string;
  BatteryModules?: string;
  BatteryPacks?: string;
  BatteryType?: string;
  ChargerLevel?: string;
  ChargerPowerKW?: string;
  EVDriveUnit?: string;
  SAEAutomationLevel?: string;
  SAEAutomationLevel_to?: string;
  DestinationMarket?: string;
  EntertainmentSystem?: string;
  Note?: string;
  TopSpeedMPH?: string;
  BedType?: string;
  BedLengthIN?: string;
  CabType?: string;
  BusType?: string;
  BusFloorConfigType?: string;
  BusLength?: string;
  TrailerType?: string;
  TrailerBodyType?: string;
  TrailerLength?: string;
  CoolingType?: string;
  EngineCount?: string;
  MotorcycleChassisType?: string;
  MotorcycleSuspensionType?: string;
  WheelCount?: string;
  AxleConfiguration?: string;
  Axles?: string;
  GrossVehicleWeightRating?: string;
  NCSABodyType?: string;
  NCSAMake?: string;
  NCSAModel?: string;
  NCSANote?: string;
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

            <Card>
              <CardContent className="p-4">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Car className="h-5 w-5" />
                  VIN Decoded Information
                </h3>
                {vinLoading ? (
                  <p className="text-sm text-muted-foreground">Loading VIN data...</p>
                ) : !vinData || vinData.ErrorCode ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Car className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="font-medium text-muted-foreground">VIN Information Not Available</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {vinData?.ErrorText || "Unable to decode VIN. The vehicle information could not be retrieved from the database."}
                    </p>
                  </div>
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
                        {(vinData.Series || vinData.Trim || vinData.Series2 || vinData.Trim2) && (
                          <div>
                            <p className="text-muted-foreground">Trim/Series</p>
                            <p className="font-medium">{[vinData.Series, vinData.Series2, vinData.Trim, vinData.Trim2].filter(Boolean).join(" ")}</p>
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
                            <p className="font-medium">{vinData.Doors}{vinData.Windows ? ` / ${vinData.Windows} Windows` : ""}</p>
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
                        {vinData.BasePrice && (
                          <div className="flex items-start gap-2">
                            <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Base MSRP</p>
                              <p className="font-medium">${parseInt(vinData.BasePrice).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                        {vinData.DestinationMarket && (
                          <div>
                            <p className="text-muted-foreground">Market</p>
                            <p className="font-medium">{vinData.DestinationMarket}</p>
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
                                {vinData.DisplacementCC && !vinData.DisplacementL && ` / ${vinData.DisplacementCC}cc`}
                                {vinData.Turbo && vinData.Turbo !== "Not Applicable" && " Turbo"}
                              </p>
                            </div>
                          )}
                          {vinData.EngineConfiguration && (
                            <div>
                              <p className="text-muted-foreground">Configuration</p>
                              <p className="font-medium">{vinData.EngineConfiguration}</p>
                            </div>
                          )}
                          {vinData.EngineHP && (
                            <div className="flex items-start gap-2">
                              <Zap className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Power</p>
                                <p className="font-medium">{vinData.EngineHP} HP{vinData.EngineKW ? ` / ${vinData.EngineKW} kW` : ""}</p>
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
                          {vinData.FuelInjectionType && (
                            <div>
                              <p className="text-muted-foreground">Fuel Injection</p>
                              <p className="font-medium">{vinData.FuelInjectionType}</p>
                            </div>
                          )}
                          {vinData.ValveTrainDesign && (
                            <div>
                              <p className="text-muted-foreground">Valve Train</p>
                              <p className="font-medium">{vinData.ValveTrainDesign}</p>
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
                          {vinData.CoolingType && (
                            <div>
                              <p className="text-muted-foreground">Cooling</p>
                              <p className="font-medium">{vinData.CoolingType}</p>
                            </div>
                          )}
                          {vinData.EngineManufacturer && (
                            <div>
                              <p className="text-muted-foreground">Engine Manufacturer</p>
                              <p className="font-medium">{vinData.EngineManufacturer}</p>
                            </div>
                          )}
                          {vinData.TopSpeedMPH && (
                            <div>
                              <p className="text-muted-foreground">Top Speed</p>
                              <p className="font-medium">{vinData.TopSpeedMPH} MPH</p>
                            </div>
                          )}
                          {vinData.OtherEngineInfo && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Additional Engine Info</p>
                              <p className="font-medium">{vinData.OtherEngineInfo}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {(vinData.BatteryKWH || vinData.EVDriveUnit || vinData.ChargerLevel || vinData.BatteryType) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Battery className="h-4 w-4" />
                            Electric Vehicle
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {vinData.BatteryKWH && (
                              <div>
                                <p className="text-muted-foreground">Battery Capacity</p>
                                <p className="font-medium">{vinData.BatteryKWH}{vinData.BatteryKWH_to ? `-${vinData.BatteryKWH_to}` : ""} kWh</p>
                              </div>
                            )}
                            {vinData.BatteryType && (
                              <div>
                                <p className="text-muted-foreground">Battery Type</p>
                                <p className="font-medium">{vinData.BatteryType}</p>
                              </div>
                            )}
                            {vinData.BatteryV && (
                              <div>
                                <p className="text-muted-foreground">Voltage</p>
                                <p className="font-medium">{vinData.BatteryV}{vinData.BatteryV_to ? `-${vinData.BatteryV_to}` : ""} V</p>
                              </div>
                            )}
                            {(vinData.BatteryCells || vinData.BatteryModules || vinData.BatteryPacks) && (
                              <div>
                                <p className="text-muted-foreground">Battery Config</p>
                                <p className="font-medium">
                                  {[vinData.BatteryCells && `${vinData.BatteryCells} cells`, vinData.BatteryModules && `${vinData.BatteryModules} modules`, vinData.BatteryPacks && `${vinData.BatteryPacks} packs`].filter(Boolean).join(", ")}
                                </p>
                              </div>
                            )}
                            {vinData.EVDriveUnit && (
                              <div>
                                <p className="text-muted-foreground">EV Drive Unit</p>
                                <p className="font-medium">{vinData.EVDriveUnit}</p>
                              </div>
                            )}
                            {vinData.ChargerLevel && (
                              <div>
                                <p className="text-muted-foreground">Charger Level</p>
                                <p className="font-medium">{vinData.ChargerLevel}{vinData.ChargerPowerKW ? ` (${vinData.ChargerPowerKW} kW)` : ""}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(vinData.GVWR || vinData.CurbWeightLB || vinData.WheelSizeFront || vinData.WheelBaseLong || vinData.BrakeSystemType) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Cog className="h-4 w-4" />
                            Dimensions & Specs
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {vinData.GVWR && (
                              <div className="flex items-start gap-2">
                                <Weight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-muted-foreground">GVWR</p>
                                  <p className="font-medium">{vinData.GVWR}{vinData.GVWR_to ? `-${vinData.GVWR_to}` : ""} lbs</p>
                                </div>
                              </div>
                            )}
                            {vinData.CurbWeightLB && (
                              <div>
                                <p className="text-muted-foreground">Curb Weight</p>
                                <p className="font-medium">{parseInt(vinData.CurbWeightLB).toLocaleString()} lbs</p>
                              </div>
                            )}
                            {(vinData.WheelBaseLong || vinData.WheelBaseShort) && (
                              <div>
                                <p className="text-muted-foreground">Wheelbase</p>
                                <p className="font-medium">{vinData.WheelBaseLong || vinData.WheelBaseShort}"{vinData.WheelBaseType ? ` (${vinData.WheelBaseType})` : ""}</p>
                              </div>
                            )}
                            {vinData.TrackWidth && (
                              <div>
                                <p className="text-muted-foreground">Track Width</p>
                                <p className="font-medium">{vinData.TrackWidth}"</p>
                              </div>
                            )}
                            {vinData.WheelSizeFront && (
                              <div className="flex items-start gap-2">
                                <CircleDot className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-muted-foreground">Wheel Size</p>
                                  <p className="font-medium">{vinData.WheelSizeFront}"{vinData.WheelSizeRear && vinData.WheelSizeRear !== vinData.WheelSizeFront ? ` / ${vinData.WheelSizeRear}" rear` : ""}</p>
                                </div>
                              </div>
                            )}
                            {vinData.Wheels && (
                              <div>
                                <p className="text-muted-foreground">Wheels</p>
                                <p className="font-medium">{vinData.Wheels}</p>
                              </div>
                            )}
                            {vinData.SteeringLocation && (
                              <div>
                                <p className="text-muted-foreground">Steering</p>
                                <p className="font-medium">{vinData.SteeringLocation}</p>
                              </div>
                            )}
                            {vinData.BrakeSystemType && (
                              <div>
                                <p className="text-muted-foreground">Brakes</p>
                                <p className="font-medium">{vinData.BrakeSystemType}{vinData.BrakeSystemDesc ? ` - ${vinData.BrakeSystemDesc}` : ""}</p>
                              </div>
                            )}
                            {(vinData.Axles || vinData.AxleConfiguration) && (
                              <div>
                                <p className="text-muted-foreground">Axles</p>
                                <p className="font-medium">{vinData.Axles}{vinData.AxleConfiguration ? ` (${vinData.AxleConfiguration})` : ""}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(vinData.BedType || vinData.CabType) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Car className="h-4 w-4" />
                            Truck Details
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {vinData.CabType && (
                              <div>
                                <p className="text-muted-foreground">Cab Type</p>
                                <p className="font-medium">{vinData.CabType}</p>
                              </div>
                            )}
                            {vinData.BedType && (
                              <div>
                                <p className="text-muted-foreground">Bed Type</p>
                                <p className="font-medium">{vinData.BedType}{vinData.BedLengthIN ? ` (${vinData.BedLengthIN}")` : ""}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(vinData.AirBagLocFront || vinData.ElectronicStabilityControl || vinData.BlindSpotMon || vinData.RearVisibilitySystem || vinData.ABS || vinData.TPMS) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Shield className="h-4 w-4" />
                            Safety Features
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {vinData.AirBagLocFront && <Badge variant="secondary">Front Airbags: {vinData.AirBagLocFront}</Badge>}
                            {vinData.AirBagLocSide && <Badge variant="secondary">Side Airbags</Badge>}
                            {vinData.AirBagLocCurtain && <Badge variant="secondary">Curtain Airbags</Badge>}
                            {vinData.AirBagLocKnee && <Badge variant="secondary">Knee Airbags</Badge>}
                            {vinData.AirBagLocSeatCushion && <Badge variant="secondary">Seat Cushion Airbags</Badge>}
                            {vinData.SeatBeltsAll && <Badge variant="secondary">Seatbelts: {vinData.SeatBeltsAll}</Badge>}
                            {vinData.Pretensioner && vinData.Pretensioner !== "Not Applicable" && <Badge variant="secondary">Pretensioners</Badge>}
                            {vinData.ABS && vinData.ABS !== "Not Applicable" && <Badge variant="secondary">ABS</Badge>}
                            {vinData.TractionControl && vinData.TractionControl !== "Not Applicable" && <Badge variant="secondary">Traction Control</Badge>}
                            {vinData.ElectronicStabilityControl && vinData.ElectronicStabilityControl !== "Not Applicable" && <Badge variant="secondary">Stability Control</Badge>}
                            {vinData.TPMS && vinData.TPMS !== "Not Applicable" && <Badge variant="secondary">TPMS{vinData.TPMSType ? `: ${vinData.TPMSType}` : ""}</Badge>}
                            {vinData.EDR && vinData.EDR !== "Not Applicable" && <Badge variant="secondary">Event Data Recorder</Badge>}
                          </div>
                        </div>
                      )}

                      {(vinData.BlindSpotMon || vinData.ForwardCollisionWarning || vinData.LaneDepartureWarning || vinData.RearVisibilitySystem || vinData.AdaptiveCruiseControl) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Lightbulb className="h-4 w-4" />
                            Driver Assistance
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {vinData.BlindSpotMon && vinData.BlindSpotMon !== "Not Applicable" && <Badge variant="secondary">Blind Spot Monitor</Badge>}
                            {vinData.BlindSpotIntervention && vinData.BlindSpotIntervention !== "Not Applicable" && <Badge variant="secondary">Blind Spot Intervention</Badge>}
                            {vinData.ForwardCollisionWarning && vinData.ForwardCollisionWarning !== "Not Applicable" && <Badge variant="secondary">Forward Collision Warning</Badge>}
                            {vinData.CIB && vinData.CIB !== "Not Applicable" && <Badge variant="secondary">Collision Imminent Braking</Badge>}
                            {vinData.AutomaticEmergencyBraking && vinData.AutomaticEmergencyBraking !== "Not Applicable" && <Badge variant="secondary">Auto Emergency Braking</Badge>}
                            {vinData.LaneDepartureWarning && vinData.LaneDepartureWarning !== "Not Applicable" && <Badge variant="secondary">Lane Departure Warning</Badge>}
                            {vinData.LaneKeepSystem && vinData.LaneKeepSystem !== "Not Applicable" && <Badge variant="secondary">Lane Keep Assist</Badge>}
                            {vinData.LaneCenteringAssistance && vinData.LaneCenteringAssistance !== "Not Applicable" && <Badge variant="secondary">Lane Centering</Badge>}
                            {vinData.RearVisibilitySystem && vinData.RearVisibilitySystem !== "Not Applicable" && <Badge variant="secondary">Backup Camera</Badge>}
                            {vinData.RearCrossTrafficAlert && vinData.RearCrossTrafficAlert !== "Not Applicable" && <Badge variant="secondary">Rear Cross Traffic Alert</Badge>}
                            {vinData.RearAutomaticEmergencyBraking && vinData.RearAutomaticEmergencyBraking !== "Not Applicable" && <Badge variant="secondary">Rear Auto Braking</Badge>}
                            {vinData.AdaptiveCruiseControl && vinData.AdaptiveCruiseControl !== "Not Applicable" && <Badge variant="secondary">Adaptive Cruise Control</Badge>}
                            {vinData.ParkAssist && vinData.ParkAssist !== "Not Applicable" && <Badge variant="secondary">Park Assist</Badge>}
                            {vinData.AutoReverseSystem && vinData.AutoReverseSystem !== "Not Applicable" && <Badge variant="secondary">Auto Reverse</Badge>}
                            {vinData.PedestrianAutomaticEmergencyBraking && vinData.PedestrianAutomaticEmergencyBraking !== "Not Applicable" && <Badge variant="secondary">Pedestrian Detection</Badge>}
                            {vinData.SAEAutomationLevel && <Badge variant="secondary">SAE Level {vinData.SAEAutomationLevel}{vinData.SAEAutomationLevel_to ? `-${vinData.SAEAutomationLevel_to}` : ""}</Badge>}
                          </div>
                        </div>
                      )}

                      {(vinData.DaytimeRunningLight || vinData.AdaptiveHeadlights || vinData.HeadlampLightSource || vinData.KeylessIgnition) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <Lightbulb className="h-4 w-4" />
                            Lighting & Convenience
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {vinData.HeadlampLightSource && <Badge variant="secondary">Headlamps: {vinData.HeadlampLightSource}</Badge>}
                            {vinData.DaytimeRunningLight && vinData.DaytimeRunningLight !== "Not Applicable" && <Badge variant="secondary">Daytime Running Lights</Badge>}
                            {vinData.AdaptiveHeadlights && vinData.AdaptiveHeadlights !== "Not Applicable" && <Badge variant="secondary">Adaptive Headlights</Badge>}
                            {vinData.SemiautomaticHeadlampBeamSwitching && vinData.SemiautomaticHeadlampBeamSwitching !== "Not Applicable" && <Badge variant="secondary">Auto High Beams</Badge>}
                            {vinData.KeylessIgnition && vinData.KeylessIgnition !== "Not Applicable" && <Badge variant="secondary">Keyless Ignition</Badge>}
                            {vinData.EntertainmentSystem && <Badge variant="secondary">{vinData.EntertainmentSystem}</Badge>}
                            {vinData.AutomaticPedestrianAlertingSound && vinData.AutomaticPedestrianAlertingSound !== "Not Applicable" && <Badge variant="secondary">Pedestrian Alert Sound</Badge>}
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
                            {vinData.PlantCompanyName && (
                              <div>
                                <p className="text-muted-foreground">Plant Company</p>
                                <p className="font-medium">{vinData.PlantCompanyName}</p>
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

                      {(vinData.Note || vinData.ActiveSafetySystemNote || vinData.NCSANote) && (
                        <div className="border-t pt-4">
                          <h4 className="mb-3 text-sm font-semibold">Additional Notes</h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {vinData.Note && <p>{vinData.Note}</p>}
                            {vinData.ActiveSafetySystemNote && <p>{vinData.ActiveSafetySystemNote}</p>}
                            {vinData.NCSANote && <p>{vinData.NCSANote}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

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
