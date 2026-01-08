import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Bell, Mail, Phone, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleAlertsProps {
  className?: string;
  fullWidth?: boolean;
}

export function VehicleAlerts({ className, fullWidth }: VehicleAlertsProps) {
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
  const [notifySms, setNotifySms] = useState(true);
  
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    if (phone !== verifiedPhone) {
      setPhoneVerified(false);
      setCodeSent(false);
      setVerificationCode("");
    }
  }, [phone, verifiedPhone]);

  const sendCodeMutation = useMutation({
    mutationFn: async ({ phone, firstName }: { phone: string; firstName: string }) => {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, firstName }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send code");
      }
      return res.json();
    },
    onSuccess: () => {
      setCodeSent(true);
      toast({
        title: "Code Sent",
        description: "Check your phone for the verification code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code.",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const res = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Invalid code");
      }
      return res.json();
    },
    onSuccess: () => {
      setPhoneVerified(true);
      setVerifiedPhone(phone);
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code.",
        variant: "destructive",
      });
    },
  });

  const createAlert = useMutation({
    mutationFn: async (data: any) => {
      console.log("[VehicleAlerts] Submitting alert data:", data);
      const res = await fetch("/api/vehicle-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[VehicleAlerts] Server error:", res.status, errorData);
        throw new Error(errorData.error || "Failed to create alert");
      }
      const result = await res.json();
      console.log("[VehicleAlerts] Alert created successfully:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("[VehicleAlerts] SUCCESS - Alert saved with ID:", data.id);
      toast({
        title: "Alert Created Successfully!",
        description: `You'll be notified at ${email} when matching vehicles are listed.`,
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      console.error("[VehicleAlerts] FAILED:", error.message);
      toast({
        title: "Failed to Create Alert",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setMakes("");
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setCodeSent(false);
    setVerificationCode("");
    setPhoneVerified(false);
    setVerifiedPhone("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("[VehicleAlerts] Form submitted - checking validation...");
    console.log("[VehicleAlerts] Form state:", { name, email, phone, phoneVerified, makes, minPrice, maxPrice, minYear, maxYear });
    
    if (!phoneVerified) {
      console.log("[VehicleAlerts] BLOCKED - Phone not verified");
      toast({
        title: "Phone Verification Required",
        description: "Please verify your phone number before creating an alert.",
        variant: "destructive",
      });
      return;
    }
    
    if (!name || !email) {
      console.log("[VehicleAlerts] BLOCKED - Missing name or email");
      toast({
        title: "Required Fields Missing",
        description: "Please enter your name and email address.",
        variant: "destructive",
      });
      return;
    }
    
    const alertData = {
      name,
      email,
      phone,
      makes: makes ? makes.split(",").map(m => m.trim()) : [],
      models: [],
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      minYear: minYear ? parseInt(minYear) : null,
      maxYear: maxYear ? parseInt(maxYear) : null,
      notifyEmail,
      notifySms,
      phoneVerified: true,
    };
    
    console.log("[VehicleAlerts] Validation passed - calling API with:", alertData);
    createAlert.mutate(alertData);
  };

  const handleSendCode = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid cell phone number.",
        variant: "destructive",
      });
      return;
    }
    sendCodeMutation.mutate({ phone, firstName: name || "Customer" });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={className || `gap-2 bg-white text-[#1a2a3c] border-white/80 hover:bg-white/90 ${fullWidth ? 'w-full' : ''}`}
          data-testid="button-vehicle-alerts"
        >
          <Bell className="h-4 w-4" />
          Get Vehicle Alerts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Vehicle Alerts
          </DialogTitle>
          <DialogDescription>
            Get notified when vehicles matching your preferences become available.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          
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
              <Label htmlFor="alert-phone">Cell Phone * (verification required)</Label>
              <div className="flex gap-2">
                <Input
                  id="alert-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                  disabled={phoneVerified}
                  className={phoneVerified ? "bg-green-50 border-green-500" : ""}
                  data-testid="input-alert-phone"
                />
                {phoneVerified ? (
                  <div className="flex items-center gap-1 text-green-600 px-3 shrink-0">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={sendCodeMutation.isPending || codeSent || phone.replace(/\D/g, "").length < 10}
                    className="shrink-0"
                    data-testid="button-send-code"
                  >
                    {sendCodeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-1" />
                        {codeSent ? "Code Sent" : "Send Code"}
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {codeSent && !phoneVerified && (
                <div className="space-y-2 mt-3 p-3 bg-muted rounded-lg">
                  <Label htmlFor="verificationCode">Enter Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verificationCode"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      data-testid="input-verification-code"
                      className="font-mono text-lg tracking-widest"
                    />
                    <Button
                      type="button"
                      onClick={() => verifyCodeMutation.mutate({ phone, code: verificationCode })}
                      disabled={verificationCode.length !== 6 || verifyCodeMutation.isPending}
                      data-testid="button-verify-code"
                    >
                      {verifyCodeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code sent to your phone.
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setVerificationCode("");
                        sendCodeMutation.mutate({ phone, firstName: name || "Customer" });
                      }}
                      disabled={sendCodeMutation.isPending}
                      className="text-xs h-auto p-0"
                      data-testid="button-resend-code"
                    >
                      {sendCodeMutation.isPending ? "Sending..." : "Send again"}
                    </Button>
                  </div>
                </div>
              )}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alert-min-price">Min Price</Label>
                <Input
                  id="alert-min-price"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="$50,000"
                  className="w-full"
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
                  className="w-full"
                  data-testid="input-alert-max-price"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alert-min-year">Min Year</Label>
                <Input
                  id="alert-min-year"
                  type="number"
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  placeholder="2018"
                  className="w-full"
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
                  className="w-full"
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
                  data-testid="checkbox-notify-sms"
                />
                <label htmlFor="notify-sms" className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  SMS notifications
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              data-testid="button-close-alert"
            >
              Close
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createAlert.isPending || !phoneVerified}
              data-testid="button-submit-alert"
            >
              {createAlert.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : !phoneVerified ? (
                "Verify Phone to Continue"
              ) : (
                "Create Alert"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
