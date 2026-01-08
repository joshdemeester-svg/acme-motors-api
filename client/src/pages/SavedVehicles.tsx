import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Heart, Trash2, ArrowLeft, Bell, BellRing, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import type { InventoryCar } from "@shared/schema";
import placeholderCar from '@assets/stock_images/car_silhouette_place_c08b6507.jpg';
import { useSEO } from "@/hooks/use-seo";
import { useSavedVehicles } from "@/hooks/use-saved-vehicles";
import { useToast } from "@/hooks/use-toast";

interface PriceAlert {
  id: string;
  vehicleId: string;
  email: string;
  priceAtSubscription: number;
  active: boolean;
  createdAt: string;
}

export default function SavedVehicles() {
  const { savedIds, toggleSaved, clearSaved, pruneSavedIds } = useSavedVehicles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [priceAlertOpen, setPriceAlertOpen] = useState(false);
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<InventoryCar | null>(null);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertPhone, setAlertPhone] = useState("");
  
  const [testDriveForm, setTestDriveForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });

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

  useEffect(() => {
    if (allInventory.length > 0 && savedIds.length > 0) {
      const validIds = allInventory.map(car => car.id);
      pruneSavedIds(validIds);
    }
  }, [allInventory, pruneSavedIds]);

  const { data: myAlerts = [] } = useQuery<PriceAlert[]>({
    queryKey: ["/api/price-alerts/my", alertEmail],
    queryFn: async () => {
      const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('priceAlertEmail') : null;
      if (!storedEmail) return [];
      const res = await fetch(`/api/price-alerts/my?email=${encodeURIComponent(storedEmail)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: typeof window !== 'undefined',
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data: { vehicleId: string; email: string; phone?: string; priceAtSubscription: number }) => {
      console.log("[PriceAlerts] Submitting price alert:", data);
      const res = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[PriceAlerts] Server error:", res.status, errorData);
        throw new Error(errorData.error || "Failed to create alert");
      }
      const result = await res.json();
      console.log("[PriceAlerts] Alert created successfully:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("[PriceAlerts] SUCCESS - Price alert saved with ID:", data.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('priceAlertEmail', alertEmail);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts/my"] });
      toast({
        title: "Price Alert Set Successfully!",
        description: `We'll notify you at ${alertEmail} if the price drops.`,
      });
      setPriceAlertOpen(false);
      setSelectedVehicle(null);
    },
    onError: (error: Error) => {
      console.error("[PriceAlerts] FAILED:", error.message);
      toast({
        title: "Failed to Create Price Alert",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/price-alerts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts/my"] });
      toast({
        title: "Alert Removed",
        description: "Price alert has been removed.",
      });
    },
  });

  const savedVehicles = allInventory.filter(car => savedIds.includes(car.id));

  const openPriceAlert = (car: InventoryCar) => {
    setSelectedVehicle(car);
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('priceAlertEmail') : null;
    if (storedEmail) setAlertEmail(storedEmail);
    setPriceAlertOpen(true);
  };

  const handleCreateAlert = () => {
    console.log("[PriceAlerts] handleCreateAlert called", { selectedVehicle: selectedVehicle?.id, alertEmail, alertPhone });
    
    if (!selectedVehicle) {
      console.log("[PriceAlerts] BLOCKED - No vehicle selected");
      return;
    }
    if (!alertEmail) {
      console.log("[PriceAlerts] BLOCKED - No email provided");
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    const alertData = {
      vehicleId: selectedVehicle.id,
      email: alertEmail,
      phone: alertPhone || undefined,
      priceAtSubscription: selectedVehicle.price,
    };
    
    console.log("[PriceAlerts] Validation passed - creating alert for:", selectedVehicle.year, selectedVehicle.make, selectedVehicle.model);
    createAlertMutation.mutate(alertData);
  };

  const getAlertForVehicle = (vehicleId: string) => {
    return myAlerts.find(a => a.vehicleId === vehicleId && a.active);
  };

  const testDriveMutation = useMutation({
    mutationFn: async (data: { vehicle: InventoryCar; name: string; email: string; phone: string; preferredDate: string; preferredTime: string; message: string }) => {
      const messageParts = [];
      if (data.preferredDate) messageParts.push(`Preferred Date: ${data.preferredDate}`);
      if (data.preferredTime) messageParts.push(`Preferred Time: ${data.preferredTime}`);
      if (data.message) messageParts.push(data.message);
      
      const res = await fetch("/api/vehicle-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: data.vehicle.id,
          vin: data.vehicle.vin || "",
          year: data.vehicle.year,
          make: data.vehicle.make,
          model: data.vehicle.model,
          buyerName: data.name,
          buyerPhone: data.phone,
          buyerEmail: data.email,
          interestType: "test_drive",
          message: messageParts.join("\n"),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Drive Requested",
        description: "We'll contact you soon to confirm your appointment.",
      });
      setTestDriveOpen(false);
      setSelectedVehicle(null);
      setTestDriveForm({ name: "", email: "", phone: "", preferredDate: "", preferredTime: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openTestDrive = (car: InventoryCar) => {
    setSelectedVehicle(car);
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('priceAlertEmail') : null;
    if (storedEmail) setTestDriveForm(prev => ({ ...prev, email: storedEmail }));
    setTestDriveOpen(true);
  };

  const handleSubmitTestDrive = () => {
    if (!selectedVehicle || !testDriveForm.name || !testDriveForm.email || !testDriveForm.phone) return;
    testDriveMutation.mutate({
      vehicle: selectedVehicle,
      ...testDriveForm,
    });
  };

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
            {savedVehicles.map((car) => {
              const existingAlert = getAlertForVehicle(car.id);
              return (
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
                    
                    <div className="mt-4 flex gap-2">
                      <Link href={`/inventory/${car.slug || car.id}`} className="flex-1">
                        <Button className="w-full" data-testid={`btn-view-saved-${car.id}`}>
                          View Details
                        </Button>
                      </Link>
                      {car.status === "available" && (
                        <>
                          <Button 
                            variant="outline"
                            size="icon"
                            onClick={() => openTestDrive(car)}
                            title="Schedule test drive"
                            data-testid={`btn-test-drive-${car.id}`}
                          >
                            <CalendarDays className="h-4 w-4" />
                          </Button>
                          {existingAlert ? (
                            <Button 
                              variant="secondary"
                              size="icon"
                              onClick={() => deleteAlertMutation.mutate(existingAlert.id)}
                              title="Remove price alert"
                              data-testid={`btn-remove-alert-${car.id}`}
                            >
                              <BellRing className="h-4 w-4 text-primary" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              size="icon"
                              onClick={() => openPriceAlert(car)}
                              title="Set price drop alert"
                              data-testid={`btn-set-alert-${car.id}`}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={priceAlertOpen} onOpenChange={setPriceAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price Drop Alert</DialogTitle>
            <DialogDescription>
              {selectedVehicle && (
                <>
                  Get notified when the price drops on the{" "}
                  <span className="font-semibold">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </span>
                  {" "}(currently ${selectedVehicle.price.toLocaleString()}).
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="alert-email">Email Address *</Label>
              <Input
                id="alert-email"
                type="email"
                placeholder="your@email.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                data-testid="input-alert-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-phone">Phone Number (optional)</Label>
              <Input
                id="alert-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={alertPhone}
                onChange={(e) => setAlertPhone(e.target.value)}
                data-testid="input-alert-phone"
              />
              <p className="text-xs text-muted-foreground">
                Provide your phone to receive SMS alerts.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceAlertOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAlert}
              disabled={!alertEmail || createAlertMutation.isPending}
              data-testid="btn-confirm-alert"
            >
              {createAlertMutation.isPending ? "Setting Alert..." : "Set Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testDriveOpen} onOpenChange={setTestDriveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Schedule a Test Drive
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle && (
                <>
                  Request a test drive for the{" "}
                  <span className="font-semibold">
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="td-name">Full Name *</Label>
              <Input
                id="td-name"
                placeholder="John Smith"
                value={testDriveForm.name}
                onChange={(e) => setTestDriveForm(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-td-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="td-email">Email *</Label>
                <Input
                  id="td-email"
                  type="email"
                  placeholder="you@email.com"
                  value={testDriveForm.email}
                  onChange={(e) => setTestDriveForm(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-td-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="td-phone">Phone *</Label>
                <Input
                  id="td-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={testDriveForm.phone}
                  onChange={(e) => setTestDriveForm(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-td-phone"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="td-date">Preferred Date</Label>
                <Input
                  id="td-date"
                  type="date"
                  value={testDriveForm.preferredDate}
                  onChange={(e) => setTestDriveForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                  data-testid="input-td-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="td-time">Preferred Time</Label>
                <select
                  id="td-time"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={testDriveForm.preferredTime}
                  onChange={(e) => setTestDriveForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                  data-testid="input-td-time"
                >
                  <option value="">Select time...</option>
                  <option value="Morning (9-12)">Morning (9-12)</option>
                  <option value="Afternoon (12-3)">Afternoon (12-3)</option>
                  <option value="Late Afternoon (3-6)">Late Afternoon (3-6)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="td-message">Additional Notes (optional)</Label>
              <Textarea
                id="td-message"
                placeholder="Any special requests or questions..."
                value={testDriveForm.message}
                onChange={(e) => setTestDriveForm(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                data-testid="input-td-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDriveOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitTestDrive}
              disabled={!testDriveForm.name || !testDriveForm.email || !testDriveForm.phone || testDriveMutation.isPending}
              data-testid="btn-submit-test-drive"
            >
              {testDriveMutation.isPending ? "Submitting..." : "Request Test Drive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
