import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VehicleAlerts() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [makes, setMakes] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const { toast } = useToast();

  const createAlert = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/vehicle-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create alert");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Created!",
        description: "You'll be notified when matching vehicles are listed.",
      });
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setMakes("");
      setMinPrice("");
      setMaxPrice("");
      setMinYear("");
      setMaxYear("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert.mutate({
      name,
      email,
      phone: phone || null,
      makes: makes ? makes.split(",").map(m => m.trim()) : [],
      models: [],
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      minYear: minYear ? parseInt(minYear) : null,
      maxYear: maxYear ? parseInt(maxYear) : null,
      notifyEmail,
      notifySms,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-vehicle-alerts">
          <Bell className="h-4 w-4" />
          Get Vehicle Alerts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Vehicle Alerts
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get notified when vehicles matching your preferences become available.
          </p>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="alert-name">Your Name *</Label>
              <Input
                id="alert-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                data-testid="input-alert-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alert-email">Email Address *</Label>
              <Input
                id="alert-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                data-testid="input-alert-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alert-phone">Phone (for SMS alerts)</Label>
              <Input
                id="alert-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                data-testid="input-alert-phone"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alert-makes">Preferred Makes</Label>
              <Input
                id="alert-makes"
                value={makes}
                onChange={(e) => setMakes(e.target.value)}
                placeholder="Porsche, Ferrari, Lamborghini"
                data-testid="input-alert-makes"
              />
              <p className="text-xs text-muted-foreground">Comma-separated, leave blank for all</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alert-min-price">Min Price</Label>
                <Input
                  id="alert-min-price"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="$50,000"
                  data-testid="input-alert-min-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-max-price">Max Price</Label>
                <Input
                  id="alert-max-price"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="$200,000"
                  data-testid="input-alert-max-price"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alert-min-year">Min Year</Label>
                <Input
                  id="alert-min-year"
                  type="number"
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  placeholder="2018"
                  data-testid="input-alert-min-year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-max-year">Max Year</Label>
                <Input
                  id="alert-max-year"
                  type="number"
                  value={maxYear}
                  onChange={(e) => setMaxYear(e.target.value)}
                  placeholder="2024"
                  data-testid="input-alert-max-year"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Notification Preferences</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-email"
                  checked={notifyEmail}
                  onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
                  data-testid="checkbox-notify-email"
                />
                <label htmlFor="notify-email" className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email notifications
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-sms"
                  checked={notifySms}
                  onCheckedChange={(checked) => setNotifySms(checked as boolean)}
                  disabled={!phone}
                  data-testid="checkbox-notify-sms"
                />
                <label htmlFor="notify-sms" className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  SMS notifications {!phone && "(add phone number)"}
                </label>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={createAlert.isPending}
            data-testid="button-submit-alert"
          >
            {createAlert.isPending ? "Creating..." : "Create Alert"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
