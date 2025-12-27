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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, CheckCircle, Clock, Loader2, Car, Phone } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import type { InventoryCar } from "@shared/schema";

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

const appointmentTypes = [
  { value: "test_drive", label: "Test Drive", description: "Experience the vehicle firsthand" },
  { value: "showroom_visit", label: "Showroom Visit", description: "View our full inventory in person" },
  { value: "inspection", label: "Vehicle Inspection", description: "Detailed walkthrough with our specialist" },
];

export default function Appointments() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    appointmentType: "",
    vehicleId: "",
    preferredDate: "",
    preferredTime: "",
    alternateDate: "",
    alternateTime: "",
    notes: "",
  });
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

  useSEO({
    title: "Schedule Appointment",
    description: "Book a test drive, showroom visit, or vehicle inspection. Our team will confirm your appointment within 24 hours.",
  });

  const { data: inventory = [] } = useQuery<InventoryCar[]>({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: async (data: { phone: string; firstName: string }) => {
      const res = await fetch("/api/verification/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send code");
      }
      return res.json();
    },
    onSuccess: () => {
      setCodeSent(true);
      toast({
        title: "Code Sent",
        description: "A verification code has been sent to your phone.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: { phone: string; code: string }) => {
      const res = await fetch("/api/verification/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Invalid code");
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/appointments", {
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

  const today = new Date().toISOString().split('T')[0];

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
            <h1 className="mb-4 font-serif text-3xl font-bold">Appointment Request Submitted!</h1>
            <p className="mb-8 text-muted-foreground">
              Thank you for scheduling with us! Our team will review your request and confirm your appointment within 24 hours via phone or email.
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
            <h1 className="mb-4 font-serif text-4xl font-bold">Schedule an Appointment</h1>
            <p className="text-muted-foreground">
              Book a test drive, showroom visit, or vehicle inspection. We'll confirm your appointment within 24 hours.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Details
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      data-testid="input-appt-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      data-testid="input-appt-lastname"
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
                      data-testid="input-appt-email"
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
                        data-testid="input-appt-phone"
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

                {/* Appointment Type */}
                <div className="space-y-3">
                  <Label>Appointment Type *</Label>
                  <RadioGroup
                    value={formData.appointmentType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, appointmentType: value }))}
                    className="grid gap-3"
                  >
                    {appointmentTypes.map((type) => (
                      <div key={type.value} className="flex items-start space-x-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value={type.value} id={type.value} data-testid={`radio-${type.value}`} />
                        <div className="flex-1">
                          <Label htmlFor={type.value} className="font-medium cursor-pointer">{type.label}</Label>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Vehicle Selection (for test drives) */}
                {formData.appointmentType === "test_drive" && (
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Select Vehicle *</Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleId: value }))}
                    >
                      <SelectTrigger data-testid="select-vehicle">
                        <SelectValue placeholder="Choose a vehicle for your test drive" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map((car) => (
                          <SelectItem key={car.id} value={car.id}>
                            {car.year} {car.make} {car.model} - ${car.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Preferred Date/Time */}
                <div className="border-t pt-6">
                  <h3 className="mb-4 flex items-center gap-2 font-medium">
                    <Clock className="h-4 w-4" />
                    Preferred Date & Time
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">Preferred Date *</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        min={today}
                        value={formData.preferredDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                        required
                        data-testid="input-preferred-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">Preferred Time *</Label>
                      <Select
                        value={formData.preferredTime}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTime: value }))}
                      >
                        <SelectTrigger data-testid="select-preferred-time">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="alternateDate">Alternate Date (Optional)</Label>
                      <Input
                        id="alternateDate"
                        type="date"
                        min={today}
                        value={formData.alternateDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, alternateDate: e.target.value }))}
                        data-testid="input-alternate-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alternateTime">Alternate Time (Optional)</Label>
                      <Select
                        value={formData.alternateTime}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, alternateTime: value }))}
                      >
                        <SelectTrigger data-testid="select-alternate-time">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any specific questions or requests..."
                    rows={3}
                    data-testid="textarea-notes"
                  />
                </div>

                {submitMutation.error && (
                  <p className="text-sm text-destructive">{submitMutation.error.message}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitMutation.isPending || !phoneVerified || !formData.appointmentType || !formData.preferredDate || !formData.preferredTime}
                  data-testid="button-submit-appointment"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Request Appointment"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  We'll confirm your appointment via phone or email within 24 hours.
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
