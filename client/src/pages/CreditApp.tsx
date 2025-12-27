import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Loader2, Phone, CreditCard, User, Home, Briefcase, ChevronRight, ChevronLeft } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const HOUSING_OPTIONS = [
  { value: "own", label: "Own" },
  { value: "rent", label: "Rent" },
  { value: "live_with_family", label: "Live with Family" },
  { value: "other", label: "Other" },
];

const TIME_OPTIONS = [
  { value: "less_than_1", label: "Less than 1 year" },
  { value: "1_to_2", label: "1-2 years" },
  { value: "2_to_5", label: "2-5 years" },
  { value: "5_plus", label: "5+ years" },
];

export default function CreditApp() {
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    currentAddress: "",
    currentCity: "",
    currentState: "",
    currentZip: "",
    currentHowLong: "",
    housingStatus: "",
    monthlyPayment: "",
    previousAddress: "",
    previousCity: "",
    previousState: "",
    previousZip: "",
    previousHowLong: "",
    employerName: "",
    employerPhone: "",
    jobTitle: "",
    employmentLength: "",
    monthlyIncome: "",
    previousEmployer: "",
    previousJobTitle: "",
    previousEmploymentLength: "",
    additionalIncome: "",
    additionalIncomeSource: "",
    vehicleInterest: "",
    tcpaConsent: false,
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (formData.phone !== verifiedPhone) {
      setPhoneVerified(false);
      setCodeSent(false);
      setVerificationCode("");
    }
  }, [formData.phone, verifiedPhone]);

  useSEO({
    title: "Get Pre-Qualified",
    description: "Start your financing journey today. Complete our quick pre-qualification form to see what you can afford - no impact to your credit score.",
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
      const res = await fetch("/api/credit-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          monthlyPayment: data.monthlyPayment ? parseInt(data.monthlyPayment) : null,
          monthlyIncome: parseInt(data.monthlyIncome) || 0,
          additionalIncome: data.additionalIncome ? parseInt(data.additionalIncome) : null,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit application");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "We'll review your application and contact you shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendCode = () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast({ title: "Error", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }
    sendCodeMutation.mutate({ phone: formData.phone, firstName: formData.firstName || "Customer" });
  };

  const handleVerifyCode = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }
    verifyCodeMutation.mutate({ phone: formData.phone, code: verificationCode });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.phone && formData.email && phoneVerified);
      case 2:
        return !!(formData.currentAddress && formData.currentCity && formData.currentState && formData.currentZip && formData.currentHowLong && formData.housingStatus);
      case 3:
        return !!(formData.employerName && formData.jobTitle && formData.employmentLength && formData.monthlyIncome);
      case 4:
        return formData.tcpaConsent;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({ title: "Please complete all required fields", variant: "destructive" });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) {
      toast({ title: "Please accept the terms", variant: "destructive" });
      return;
    }
    submitMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-serif font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for your pre-qualification application. Our finance team will review your information and contact you within 24 hours.
              </p>
              <Button onClick={() => window.location.href = "/inventory"} data-testid="button-browse-inventory">
                Browse Our Inventory
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Address", icon: Home },
    { number: 3, title: "Employment", icon: Briefcase },
    { number: 4, title: "Review", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Get Pre-Qualified</h1>
            <p className="text-muted-foreground">
              Complete this form to see financing options - no impact to your credit score
            </p>
          </div>

          <div className="flex justify-between mb-8">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center flex-1 ${step.number < 4 ? "relative" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs text-center ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                  {step.number < 4 && (
                    <div
                      className={`absolute top-5 left-[60%] w-[80%] h-0.5 ${
                        isCompleted ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {steps[currentStep - 1].icon && (() => {
                  const Icon = steps[currentStep - 1].icon;
                  return <Icon className="h-5 w-5" />;
                })()}
                Step {currentStep}: {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Tell us about yourself"}
                {currentStep === 2 && "Where do you currently live?"}
                {currentStep === 3 && "Tell us about your employment"}
                {currentStep === 4 && "Review and submit your application"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleChange("firstName", e.target.value)}
                            placeholder="John"
                            data-testid="input-first-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleChange("lastName", e.target.value)}
                            placeholder="Doe"
                            data-testid="input-last-name"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                            data-testid="input-dob"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="john@example.com"
                            data-testid="input-email"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="(555) 123-4567"
                            className="flex-1"
                            disabled={phoneVerified}
                            data-testid="input-phone"
                          />
                          {!phoneVerified && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleSendCode}
                              disabled={sendCodeMutation.isPending || !formData.phone}
                              data-testid="button-send-code"
                            >
                              {sendCodeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Phone className="h-4 w-4 mr-1" />
                                  {codeSent ? "Resend" : "Verify"}
                                </>
                              )}
                            </Button>
                          )}
                          {phoneVerified && (
                            <div className="flex items-center text-green-600 gap-1 px-3">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {codeSent && !phoneVerified && (
                        <div className="space-y-2">
                          <Label htmlFor="verificationCode">Verification Code</Label>
                          <div className="flex gap-2">
                            <Input
                              id="verificationCode"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                              className="flex-1"
                              data-testid="input-verification-code"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyCode}
                              disabled={verifyCodeMutation.isPending || verificationCode.length !== 6}
                              data-testid="button-verify-code"
                            >
                              {verifyCodeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="currentAddress">Current Address *</Label>
                        <Input
                          id="currentAddress"
                          value={formData.currentAddress}
                          onChange={(e) => handleChange("currentAddress", e.target.value)}
                          placeholder="123 Main Street"
                          data-testid="input-current-address"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="currentCity">City *</Label>
                          <Input
                            id="currentCity"
                            value={formData.currentCity}
                            onChange={(e) => handleChange("currentCity", e.target.value)}
                            placeholder="City"
                            data-testid="input-current-city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currentState">State *</Label>
                          <Select value={formData.currentState} onValueChange={(v) => handleChange("currentState", v)}>
                            <SelectTrigger data-testid="select-current-state">
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currentZip">Zip Code *</Label>
                          <Input
                            id="currentZip"
                            value={formData.currentZip}
                            onChange={(e) => handleChange("currentZip", e.target.value)}
                            placeholder="12345"
                            maxLength={5}
                            data-testid="input-current-zip"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="currentHowLong">Time at Address *</Label>
                          <Select value={formData.currentHowLong} onValueChange={(v) => handleChange("currentHowLong", v)}>
                            <SelectTrigger data-testid="select-current-how-long">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="housingStatus">Housing Status *</Label>
                          <Select value={formData.housingStatus} onValueChange={(v) => handleChange("housingStatus", v)}>
                            <SelectTrigger data-testid="select-housing-status">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {HOUSING_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(formData.housingStatus === "own" || formData.housingStatus === "rent") && (
                        <div className="space-y-2">
                          <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                          <Input
                            id="monthlyPayment"
                            type="number"
                            value={formData.monthlyPayment}
                            onChange={(e) => handleChange("monthlyPayment", e.target.value)}
                            placeholder="1500"
                            data-testid="input-monthly-payment"
                          />
                        </div>
                      )}

                      {formData.currentHowLong === "less_than_1" && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium mb-4">Previous Address (if less than 2 years at current)</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="previousAddress">Previous Address</Label>
                              <Input
                                id="previousAddress"
                                value={formData.previousAddress}
                                onChange={(e) => handleChange("previousAddress", e.target.value)}
                                placeholder="456 Oak Avenue"
                                data-testid="input-previous-address"
                              />
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="space-y-2">
                                <Label htmlFor="previousCity">City</Label>
                                <Input
                                  id="previousCity"
                                  value={formData.previousCity}
                                  onChange={(e) => handleChange("previousCity", e.target.value)}
                                  placeholder="City"
                                  data-testid="input-previous-city"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="previousState">State</Label>
                                <Select value={formData.previousState} onValueChange={(v) => handleChange("previousState", v)}>
                                  <SelectTrigger data-testid="select-previous-state">
                                    <SelectValue placeholder="State" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {US_STATES.map((state) => (
                                      <SelectItem key={state} value={state}>{state}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="previousZip">Zip Code</Label>
                                <Input
                                  id="previousZip"
                                  value={formData.previousZip}
                                  onChange={(e) => handleChange("previousZip", e.target.value)}
                                  placeholder="12345"
                                  maxLength={5}
                                  data-testid="input-previous-zip"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="employerName">Employer Name *</Label>
                          <Input
                            id="employerName"
                            value={formData.employerName}
                            onChange={(e) => handleChange("employerName", e.target.value)}
                            placeholder="Company Name"
                            data-testid="input-employer-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employerPhone">Employer Phone</Label>
                          <Input
                            id="employerPhone"
                            type="tel"
                            value={formData.employerPhone}
                            onChange={(e) => handleChange("employerPhone", e.target.value)}
                            placeholder="(555) 123-4567"
                            data-testid="input-employer-phone"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title *</Label>
                          <Input
                            id="jobTitle"
                            value={formData.jobTitle}
                            onChange={(e) => handleChange("jobTitle", e.target.value)}
                            placeholder="Your position"
                            data-testid="input-job-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employmentLength">Time at Employer *</Label>
                          <Select value={formData.employmentLength} onValueChange={(v) => handleChange("employmentLength", v)}>
                            <SelectTrigger data-testid="select-employment-length">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monthlyIncome">Monthly Income (before taxes) *</Label>
                        <Input
                          id="monthlyIncome"
                          type="number"
                          value={formData.monthlyIncome}
                          onChange={(e) => handleChange("monthlyIncome", e.target.value)}
                          placeholder="5000"
                          data-testid="input-monthly-income"
                        />
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-4">Additional Income (optional)</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="additionalIncome">Monthly Amount</Label>
                            <Input
                              id="additionalIncome"
                              type="number"
                              value={formData.additionalIncome}
                              onChange={(e) => handleChange("additionalIncome", e.target.value)}
                              placeholder="0"
                              data-testid="input-additional-income"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="additionalIncomeSource">Source</Label>
                            <Input
                              id="additionalIncomeSource"
                              value={formData.additionalIncomeSource}
                              onChange={(e) => handleChange("additionalIncomeSource", e.target.value)}
                              placeholder="e.g., Rental income, investments"
                              data-testid="input-additional-income-source"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicleInterest">Vehicle Interest (optional)</Label>
                        <Input
                          id="vehicleInterest"
                          value={formData.vehicleInterest}
                          onChange={(e) => handleChange("vehicleInterest", e.target.value)}
                          placeholder="e.g., 2023 Mercedes-Benz C300"
                          data-testid="input-vehicle-interest"
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Personal Information</h4>
                          <p className="text-sm text-muted-foreground">
                            {formData.firstName} {formData.lastName}<br />
                            DOB: {formData.dateOfBirth}<br />
                            {formData.email} | {formData.phone}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Current Address</h4>
                          <p className="text-sm text-muted-foreground">
                            {formData.currentAddress}<br />
                            {formData.currentCity}, {formData.currentState} {formData.currentZip}<br />
                            {HOUSING_OPTIONS.find(o => o.value === formData.housingStatus)?.label} | {TIME_OPTIONS.find(o => o.value === formData.currentHowLong)?.label}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Employment</h4>
                          <p className="text-sm text-muted-foreground">
                            {formData.jobTitle} at {formData.employerName}<br />
                            Monthly Income: ${parseInt(formData.monthlyIncome || "0").toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="tcpaConsent"
                          checked={formData.tcpaConsent}
                          onCheckedChange={(checked) => handleChange("tcpaConsent", !!checked)}
                          data-testid="checkbox-tcpa-consent"
                        />
                        <label htmlFor="tcpaConsent" className="text-sm text-muted-foreground leading-relaxed">
                          I consent to receive calls, text messages, and emails regarding my financing application. 
                          I understand that my consent is not required to make a purchase, and I may opt out at any time.
                          Standard message and data rates may apply.
                        </label>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        By submitting this application, you authorize us to obtain consumer credit reports and verify your employment and income information. 
                        This is a pre-qualification only and does not guarantee financing approval.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between mt-8 pt-4 border-t">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={handleBack} data-testid="button-back">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <Button type="button" onClick={handleNext} disabled={!validateStep(currentStep)} data-testid="button-next">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending || !formData.tcpaConsent}
                      data-testid="button-submit"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
