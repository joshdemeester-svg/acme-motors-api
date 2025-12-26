import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, CheckCircle, Loader2 } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

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

  useSEO({
    title: "Trade-In Value",
    description: "Get a quick estimate for your trade-in vehicle. Submit your vehicle details and our team will provide a competitive offer.",
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
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      data-testid="input-trade-phone"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="mb-4 font-medium">Vehicle Information</h3>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Select
                        value={formData.year}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
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
                      <Label htmlFor="make">Make *</Label>
                      <Input
                        id="make"
                        value={formData.make}
                        onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                        placeholder="e.g., BMW"
                        required
                        data-testid="input-trade-make"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model *</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="e.g., M5"
                        required
                        data-testid="input-trade-model"
                      />
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

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN (Optional)</Label>
                      <Input
                        id="vin"
                        value={formData.vin}
                        onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                        placeholder="17-character VIN"
                        maxLength={17}
                        data-testid="input-trade-vin"
                      />
                    </div>
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
