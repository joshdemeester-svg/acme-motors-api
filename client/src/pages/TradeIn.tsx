import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Car, CheckCircle, Loader2, ChevronsUpDown, Check, Phone } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

const conditions = [
  { value: "excellent", label: "Excellent - Like new, minimal wear" },
  { value: "good", label: "Good - Minor cosmetic imperfections" },
  { value: "fair", label: "Fair - Some mechanical or cosmetic issues" },
  { value: "poor", label: "Poor - Significant issues present" },
];

export default function TradeIn() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    year: "",
    make: "",
    model: "",
    mileage: "",
    condition: "",
    vin: "",
    payoffAmount: "",
    additionalInfo: "",
  });
  const [vinLoading, setVinLoading] = useState(false);
  const [makeOpen, setMakeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const { toast } = useToast();

  // Reset verification when phone changes
  useEffect(() => {
    if (formData.phone !== verifiedPhone) {
      setPhoneVerified(false);
      setCodeSent(false);
      setVerificationCode("");
    }
  }, [formData.phone, verifiedPhone]);

  const { data: makes = [], isLoading: isLoadingMakes } = useQuery<{ MakeId: number; MakeName: string }[]>({
    queryKey: ["/api/vehicle-makes"],
    queryFn: async () => {
      const res = await fetch("/api/vehicle-makes");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: models = [], isLoading: isLoadingModels } = useQuery<{ Model_ID: number; Model_Name: string }[]>({
    queryKey: ["/api/vehicle-models", formData.make, formData.year],
    queryFn: async () => {
      if (!formData.make || !formData.year) return [];
      const res = await fetch(`/api/vehicle-models/${encodeURIComponent(formData.make)}/${formData.year}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!formData.make && !!formData.year,
  });

  const handleVinDecode = async (vin: string) => {
    if (vin.length !== 17) return;
    
    setVinLoading(true);
    try {
      const res = await fetch(`/api/vin-decode/${vin}`);
      if (!res.ok) throw new Error("Failed to decode VIN");
      const data = await res.json();
      
      if (data.ErrorCode && data.ErrorCode !== "0") {
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        year: data.ModelYear || prev.year,
        make: data.Make || prev.make,
        model: data.Model || prev.model,
      }));
      
      toast({ title: "VIN Decoded", description: `Found: ${data.ModelYear} ${data.Make} ${data.Model}` });
    } catch {
      // Silently fail for auto-decode
    } finally {
      setVinLoading(false);
    }
  };

  useSEO({
    title: "Trade-In Value",
    description: "Get a quick estimate for your trade-in vehicle. Submit your vehicle details and our team will provide a competitive offer.",
  });

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
        title: "Verification Code Sent",
        description: "Please check your phone for the verification code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Code",
        description: error.message || "Please try again.",
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
      setVerifiedPhone(formData.phone);
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Please check your code and try again.",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/trade-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneVerified) {
      toast({
        title: "Phone Verification Required",
        description: "Please verify your phone number before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container px-4 py-24 md:px-6">
          <div className="mx-auto max-w-lg text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <h1 className="mb-4 font-serif text-3xl font-bold">Trade-In Request Submitted!</h1>
            <p className="mb-8 text-muted-foreground">
              Thank you for your interest! Our team will review your vehicle details and contact you within 24 hours with a competitive offer.
            </p>
            <Button onClick={() => window.location.href = "/"}>Return Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-serif text-4xl font-bold">Get Your Trade-In Value</h1>
            <p className="text-muted-foreground">
              Thinking about trading in your current vehicle? Submit your details below and we'll provide a competitive offer.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Details
              </CardTitle>
              <CardDescription>
                Provide accurate information for the best estimate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      data-testid="input-trade-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      data-testid="input-trade-lastname"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="input-trade-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        disabled={phoneVerified}
                        className={phoneVerified ? "bg-green-50 border-green-300" : ""}
                        data-testid="input-trade-phone"
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
                          onClick={() => {
                            if (formData.phone.replace(/\D/g, "").length >= 10 && formData.firstName.trim()) {
                              sendCodeMutation.mutate({ phone: formData.phone, firstName: formData.firstName });
                            } else {
                              toast({
                                title: "Missing Information",
                                description: "Please enter your first name and a valid phone number first.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={sendCodeMutation.isPending || codeSent}
                          className="shrink-0"
                          data-testid="button-send-code"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          {sendCodeMutation.isPending ? "Sending..." : codeSent ? "Code Sent" : "Send Code"}
                        </Button>
                      )}
                    </div>
                    
                    {codeSent && !phoneVerified && (
                      <div className="space-y-2 mt-3 p-3 bg-muted rounded-lg">
                        <Label htmlFor="verificationCode">Enter Verification Code</Label>
                        <div className="flex gap-2">
                          <Input
                            id="verificationCode"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="6-digit code"
                            maxLength={6}
                            className="flex-1"
                            data-testid="input-verification-code"
                          />
                          <Button
                            type="button"
                            onClick={() => verifyCodeMutation.mutate({ phone: formData.phone, code: verificationCode })}
                            disabled={verificationCode.length !== 6 || verifyCodeMutation.isPending}
                            data-testid="button-verify-code"
                          >
                            {verifyCodeMutation.isPending ? "Verifying..." : "Verify"}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => {
                            setCodeSent(false);
                            setVerificationCode("");
                          }}
                          className="text-xs h-auto p-0"
                          data-testid="button-resend-code"
                        >
                          Didn't receive it? Send again
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="mb-4 font-medium">Vehicle Information</h3>
                  
                  <div className="mb-4 space-y-2">
                    <Label htmlFor="vin">VIN (Enter to auto-fill vehicle details)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="vin"
                        value={formData.vin}
                        onChange={(e) => {
                          const newVin = e.target.value.toUpperCase();
                          setFormData(prev => ({ ...prev, vin: newVin }));
                          if (newVin.length === 17) {
                            handleVinDecode(newVin);
                          }
                        }}
                        placeholder="17-character VIN"
                        maxLength={17}
                        className="flex-1"
                        data-testid="input-trade-vin"
                      />
                      {vinLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Decoding...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Enter your VIN to automatically fill year, make, and model</p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Select
                        value={formData.year}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, year: value, model: "" }))}
                      >
                        <SelectTrigger data-testid="select-trade-year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Make *</Label>
                      <Popover open={makeOpen} onOpenChange={setMakeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={makeOpen}
                            className="w-full justify-between font-normal"
                            data-testid="select-trade-make"
                            disabled={isLoadingMakes}
                          >
                            {formData.make || (isLoadingMakes ? "Loading..." : "Search make...")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search make..." />
                            <CommandList>
                              <CommandEmpty>No make found.</CommandEmpty>
                              <CommandGroup>
                                {makes
                                  .filter((make) => make.MakeName)
                                  .sort((a, b) => (a.MakeName || "").localeCompare(b.MakeName || ""))
                                  .map((make) => (
                                    <CommandItem
                                      key={make.MakeId}
                                      value={make.MakeName}
                                      onSelect={() => {
                                        setFormData(prev => ({ ...prev, make: make.MakeName, model: "" }));
                                        setMakeOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.make === make.MakeName ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {make.MakeName}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Model *</Label>
                      <Popover open={modelOpen} onOpenChange={setModelOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={modelOpen}
                            className="w-full justify-between font-normal"
                            data-testid="select-trade-model"
                            disabled={!formData.make || !formData.year || isLoadingModels}
                          >
                            {formData.model || (!formData.make ? "Select make first" : !formData.year ? "Select year first" : isLoadingModels ? "Loading..." : "Search model...")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search model..." />
                            <CommandList>
                              <CommandEmpty>No model found.</CommandEmpty>
                              <CommandGroup>
                                {models
                                  .filter((model) => model.Model_Name)
                                  .sort((a, b) => (a.Model_Name || "").localeCompare(b.Model_Name || ""))
                                  .map((model) => (
                                    <CommandItem
                                      key={model.Model_ID}
                                      value={model.Model_Name}
                                      onSelect={() => {
                                        setFormData(prev => ({ ...prev, model: model.Model_Name }));
                                        setModelOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.model === model.Model_Name ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {model.Model_Name}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Mileage *</Label>
                      <Input
                        id="mileage"
                        type="number"
                        value={formData.mileage}
                        onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                        placeholder="e.g., 25000"
                        required
                        data-testid="input-trade-mileage"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                      >
                        <SelectTrigger data-testid="select-trade-condition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map((cond) => (
                            <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="payoffAmount">Loan Payoff Amount (if any)</Label>
                      <Input
                        id="payoffAmount"
                        type="number"
                        value={formData.payoffAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, payoffAmount: e.target.value }))}
                        placeholder="$0"
                        data-testid="input-trade-payoff"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Any modifications, recent repairs, or other details about your vehicle..."
                    rows={4}
                    data-testid="textarea-trade-info"
                  />
                </div>

                {submitMutation.error && (
                  <p className="text-sm text-destructive">{submitMutation.error.message}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitMutation.isPending || !formData.year || !formData.condition}
                  data-testid="button-submit-trade"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Get My Trade-In Value"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By submitting, you agree to be contacted regarding your trade-in request.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
