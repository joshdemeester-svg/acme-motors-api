import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Car, Fuel, Gauge, Calendar, Palette, FileText, Settings, MapPin, Shield, Zap, Users, Factory, Cog, DollarSign, Weight, CircleDot, Lightbulb, Battery, Loader2, CheckCircle, MessageSquare, Search, Calculator } from "lucide-react";
import { Link } from "wouter";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';
import { useSEO, generateVehicleSchema } from "@/hooks/use-seo";
import { useSettings } from "@/contexts/SettingsContext";

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

function FinancingCalculator({ price }: { price: number }) {
  const [downPayment, setDownPayment] = useState(Math.round(price * 0.1));
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(60);

  const monthlyPayment = useMemo(() => {
    const principal = price - downPayment;
    if (principal <= 0) return 0;
    
    const monthlyRate = interestRate / 100 / 12;
    if (monthlyRate === 0) {
      return principal / loanTerm;
    }
    
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / (Math.pow(1 + monthlyRate, loanTerm) - 1);
    return payment;
  }, [price, downPayment, interestRate, loanTerm]);

  const totalInterest = useMemo(() => {
    return (monthlyPayment * loanTerm) - (price - downPayment);
  }, [monthlyPayment, loanTerm, price, downPayment]);

  return (
    <Card data-testid="financing-calculator">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          Payment Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="text-center p-4 rounded-lg"
          style={{ backgroundColor: 'var(--calculator-bg-color, #1E3A5F)' }}
        >
          <p className="text-sm" style={{ color: 'var(--calculator-text-color, #FFFFFF)', opacity: 0.8 }}>Estimated Monthly Payment</p>
          <p 
            className="text-3xl font-bold" 
            style={{ color: 'var(--calculator-accent-color, #3B82F6)' }}
            data-testid="text-monthly-payment"
          >
            ${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm">Down Payment</Label>
              <span className="text-sm font-medium">${downPayment.toLocaleString()}</span>
            </div>
            <Slider
              value={[downPayment]}
              onValueChange={(value) => setDownPayment(value[0])}
              max={price}
              min={0}
              step={500}
              data-testid="slider-down-payment"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm">Interest Rate (APR)</Label>
              <span className="text-sm font-medium">{interestRate}%</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={(value) => setInterestRate(value[0])}
              max={15}
              min={0}
              step={0.25}
              data-testid="slider-interest-rate"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm">Loan Term</Label>
              <span className="text-sm font-medium">{loanTerm} months</span>
            </div>
            <div className="flex gap-2">
              {[36, 48, 60, 72, 84].map((term) => (
                <Button
                  key={term}
                  variant={loanTerm === term ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLoanTerm(term)}
                  className="flex-1"
                  data-testid={`button-term-${term}`}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t text-sm space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>Loan Amount:</span>
            <span>${(price - downPayment).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Interest:</span>
            <span>${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          *Estimates only. Actual rates and terms may vary based on credit approval.
        </p>
      </CardContent>
    </Card>
  );
}

export default function VehicleDetails({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
    message: "",
    interestType: "",
    buyTimeline: "",
    hasTradeIn: false,
    financingPreference: "",
    contactPreference: "",
    bestTimeToContact: "",
  });
  const { settings } = useSettings();

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

  const { data: allInventory = [] } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const searchResults = search.trim() 
    ? allInventory.filter(v => 
        v.id !== id && (
          v.make.toLowerCase().includes(search.toLowerCase()) || 
          v.model.toLowerCase().includes(search.toLowerCase())
        )
      ).slice(0, 5)
    : [];

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

  useSEO({
    title: car ? `${car.year} ${car.make} ${car.model} for Sale` : "Vehicle Details",
    description: car 
      ? `${car.year} ${car.make} ${car.model} with ${car.mileage?.toLocaleString()} miles in ${car.color}. ${car.condition} condition. Price: $${car.price?.toLocaleString()}. View details and contact us today.`
      : "View vehicle details and specifications.",
    image: car?.photos?.[0],
    type: "product",
    siteName: settings?.siteName || undefined,
    schema: car ? generateVehicleSchema({
      year: car.year,
      make: car.make,
      model: car.model,
      price: car.price,
      mileage: car.mileage,
      color: car.color,
      vin: car.vin,
      condition: car.condition,
      photos: car.photos || [],
      description: car.description || undefined,
    }, settings || undefined) : undefined,
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!car) throw new Error("No vehicle data");
      const res = await fetch("/api/vehicle-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: car.id,
          vin: car.vin,
          year: car.year,
          make: car.make,
          model: car.model,
          ...data,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send inquiry");
      }
      return res.json();
    },
    onSuccess: () => {
      setContactSuccess(true);
      setFormData({ 
        buyerName: "", 
        buyerPhone: "", 
        buyerEmail: "", 
        message: "",
        interestType: "",
        buyTimeline: "",
        hasTradeIn: false,
        financingPreference: "",
        contactPreference: "",
        bestTimeToContact: "",
      });
    },
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    inquiryMutation.mutate(formData);
  };

  const handleContactClose = () => {
    setContactOpen(false);
    setContactSuccess(false);
    inquiryMutation.reset();
  };

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/inventory">
            <Button variant="ghost" className="gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Button>
          </Link>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search make or model..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              data-testid="input-search-details"
            />
            {searchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg">
                {searchResults.map((v) => (
                  <Link key={v.id} href={`/vehicle/${v.id}`}>
                    <div 
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-accent"
                      onClick={() => {
                        setSearch("");
                        setSearchFocused(false);
                      }}
                    >
                      <div className="h-10 w-14 overflow-hidden rounded bg-muted">
                        <img 
                          src={v.photos?.[0] || placeholderCar} 
                          alt={`${v.make} ${v.model}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{v.year} {v.make} {v.model}</p>
                        <p className="text-xs text-muted-foreground">${v.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

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
              <h1 className="vehicle-title font-serif text-4xl font-bold" data-testid="text-vehicle-title">
                {car.year} {car.make} {car.model}
              </h1>
              <p className="vehicle-price mt-2 text-3xl font-bold" data-testid="text-price">
                ${car.price.toLocaleString()}
              </p>
              <Button 
                className="btn-contact mt-4 w-full gap-2" 
                size="lg"
                onClick={() => setContactOpen(true)}
                data-testid="button-contact-top"
              >
                <MessageSquare className="h-5 w-5" />
                Interested? Contact Us
              </Button>
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

            <FinancingCalculator price={car.price} />

            <Button 
              className="btn-contact w-full gap-2" 
              size="lg" 
              data-testid="button-contact"
              onClick={() => setContactOpen(true)}
            >
              <MessageSquare className="h-5 w-5" />
              Contact Us About This Vehicle
            </Button>
          </div>
        </div>

        {/* Vehicle Specifications - Full width section - Only show when specs are available */}
        {!vinLoading && vinData && (!vinData.ErrorCode || vinData.ErrorCode === "0") && (
        <div className="mt-12">
          <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <Car className="h-5 w-5" />
            Vehicle Specifications
          </h3>
              {(
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 text-sm">
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 text-sm">
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
                            <div className="col-span-2 lg:col-span-4">
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
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 text-sm">
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
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 text-sm">
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
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 text-sm">
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
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3 text-sm">
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
        </div>
        )}
      </div>

      <Dialog open={contactOpen} onOpenChange={handleContactClose}>
        <DialogContent className="flex max-h-[85vh] max-w-md flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Inquire About This Vehicle</DialogTitle>
            <DialogDescription>
              {car.year} {car.make} {car.model}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
          {contactSuccess ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <p className="text-lg font-semibold">Inquiry Sent!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We've received your message and will be in touch shortly.
                </p>
              </div>
              <Button onClick={handleContactClose} className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interestType">What are you interested in? *</Label>
                <select
                  id="interestType"
                  data-testid="select-interest-type"
                  value={formData.interestType}
                  onChange={(e) => setFormData({ ...formData, interestType: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select an option...</option>
                  <option value="test_drive">Schedule a Test Drive</option>
                  <option value="financing">Get Financing Information</option>
                  <option value="make_offer">Make an Offer</option>
                  <option value="more_photos">Request More Photos/Video</option>
                  <option value="question">Ask a Question</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerName">Your Name *</Label>
                <Input
                  id="buyerName"
                  data-testid="input-buyer-name"
                  value={formData.buyerName}
                  onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerPhone">Phone Number *</Label>
                <Input
                  id="buyerPhone"
                  type="tel"
                  data-testid="input-buyer-phone"
                  value={formData.buyerPhone}
                  onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Email *</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  data-testid="input-buyer-email"
                  value={formData.buyerEmail}
                  onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="rounded-md border border-border/50 bg-muted/30 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Help us serve you better (optional)</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="buyTimeline" className="text-xs">Buying Timeline</Label>
                    <select
                      id="buyTimeline"
                      data-testid="select-buy-timeline"
                      value={formData.buyTimeline}
                      onChange={(e) => setFormData({ ...formData, buyTimeline: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select...</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="just_browsing">Just Browsing</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="financingPreference" className="text-xs">Financing</Label>
                    <select
                      id="financingPreference"
                      data-testid="select-financing-preference"
                      value={formData.financingPreference}
                      onChange={(e) => setFormData({ ...formData, financingPreference: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select...</option>
                      <option value="cash">Cash</option>
                      <option value="finance">Finance</option>
                      <option value="undecided">Undecided</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasTradeIn"
                    data-testid="checkbox-has-trade-in"
                    checked={formData.hasTradeIn}
                    onChange={(e) => setFormData({ ...formData, hasTradeIn: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="hasTradeIn" className="text-sm cursor-pointer">I have a vehicle to trade in</Label>
                </div>
              </div>

              <div className="rounded-md border border-border/50 bg-muted/30 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact Preferences (optional)</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="contactPreference" className="text-xs">Contact Me By</Label>
                    <select
                      id="contactPreference"
                      data-testid="select-contact-preference"
                      value={formData.contactPreference}
                      onChange={(e) => setFormData({ ...formData, contactPreference: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select...</option>
                      <option value="call">Call</option>
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="bestTimeToContact" className="text-xs">Best Time</Label>
                    <select
                      id="bestTimeToContact"
                      data-testid="select-best-time"
                      value={formData.bestTimeToContact}
                      onChange={(e) => setFormData({ ...formData, bestTimeToContact: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select...</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  data-testid="input-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="I'm interested in this vehicle..."
                  rows={3}
                />
              </div>

              {inquiryMutation.error && (
                <p className="text-sm text-red-500">
                  {inquiryMutation.error.message}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={inquiryMutation.isPending || !formData.interestType}
                data-testid="button-submit-inquiry"
              >
                {inquiryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Inquiry"
                )}
              </Button>
            </form>
          )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
