import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, ChevronRight, ChevronLeft, Car, FileText, User, X, Phone, CheckCircle, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useUpload } from "@/hooks/use-upload";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear + 1 - 1981 + 1 }, (_, i) => (currentYear + 1 - i).toString());

interface NHTSAMake {
  Make_ID: number;
  Make_Name: string;
}

interface NHTSAModel {
  Model_ID: number;
  Model_Name: string;
}

async function fetchMakesForYear(year: string): Promise<NHTSAMake[]> {
  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/passenger%20car?format=json`);
  const data = await res.json();
  return data.Results || [];
}

async function fetchModelsForMakeYear(make: string, year: string): Promise<NHTSAModel[]> {
  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`);
  const data = await res.json();
  return data.Results || [];
}

interface VINDecodeResult {
  year: string;
  make: string;
  model: string;
}

async function decodeVIN(vin: string): Promise<VINDecodeResult | null> {
  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
  const data = await res.json();
  const results = data.Results || [];
  
  const getValue = (variableId: number) => {
    const item = results.find((r: any) => r.VariableId === variableId);
    return item?.Value || "";
  };
  
  const year = getValue(29);
  const make = getValue(26);
  const model = getValue(28);
  
  if (year || make || model) {
    return { year, make, model };
  }
  return null;
}

const formSchema = z.object({
  vin: z.string().min(17, "VIN must be at least 17 characters").max(17, "VIN must be 17 characters"),
  year: z.string().min(4, "Year is required"),
  make: z.string().min(2, "Make is required"),
  model: z.string().min(2, "Model is required"),
  mileage: z.string().min(1, "Mileage is required"),
  color: z.string().min(2, "Color is required"),
  
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  accidentHistory: z.enum(["clean", "minor", "major"]),
  description: z.string().optional(),
  
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Cell phone number is required"),
  
  salvageTitle: z.boolean().default(false),
  mechanicalIssues: z.string().optional(),
  lienStatus: z.boolean().default(false),
  ownershipConfirmed: z.boolean().refine(val => val === true, "You must confirm ownership"),
  agreementAccepted: z.boolean().refine(val => val === true, "You must accept the consignment agreement"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and privacy policy"),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "Vehicle Details", icon: Car },
  { id: 2, title: "Condition & Photos", icon: FileText },
  { id: 3, title: "Contact Info", icon: User },
  { id: 4, title: "Disclosures & Agreement", icon: Shield },
];

export function ConsignmentForm() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [isDecodingVin, setIsDecodingVin] = useState(false);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setUploadedPhotos(prev => [...prev, response.objectPath]);
      toast({ title: "Photo uploaded successfully" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condition: "excellent",
      accidentHistory: "clean",
      salvageTitle: false,
      lienStatus: false,
      ownershipConfirmed: false,
      agreementAccepted: false,
      termsAccepted: false,
    }
  });

  const { data: makes = [], isLoading: isLoadingMakes } = useQuery({
    queryKey: ["vehicleMakes", selectedYear],
    queryFn: () => fetchMakesForYear(selectedYear),
    enabled: !!selectedYear,
    staleTime: 1000 * 60 * 60,
  });

  const { data: models = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ["vehicleModels", selectedMake, selectedYear],
    queryFn: () => fetchModelsForMakeYear(selectedMake, selectedYear),
    enabled: !!selectedMake && !!selectedYear,
    staleTime: 1000 * 60 * 60,
  });

  const handleVinDecode = async (vin: string) => {
    if (vin.length !== 17) return;
    
    setIsDecodingVin(true);
    try {
      const decoded = await decodeVIN(vin);
      if (decoded) {
        if (decoded.year) {
          setSelectedYear(decoded.year);
          form.setValue("year", decoded.year);
        }
        if (decoded.make) {
          setSelectedMake(decoded.make);
          form.setValue("make", decoded.make);
        }
        if (decoded.model) {
          form.setValue("model", decoded.model);
        }
        toast({
          title: "VIN Decoded",
          description: "Vehicle information has been filled in automatically.",
        });
      }
    } catch (error) {
      console.error("VIN decode error:", error);
    } finally {
      setIsDecodingVin(false);
    }
  };

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
      setVerifiedPhone(form.getValues("phone"));
      toast({
        title: "Phone Verified",
        description: "Your cell phone has been verified successfully.",
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
    mutationFn: async (data: FormData & { photos: string[] }) => {
      const res = await fetch("/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Consignment Request Received",
        description: "We have received your vehicle details. An agent will contact you shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const currentPhone = form.watch("phone");
  useEffect(() => {
    if (currentPhone !== verifiedPhone) {
      setPhoneVerified(false);
      setCodeSent(false);
      setVerificationCode("");
    }
  }, [currentPhone, verifiedPhone]);

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["vin", "year", "make", "model", "mileage", "color"];
    } else if (step === 2) {
      fieldsToValidate = ["condition", "accidentHistory"];
    } else if (step === 3) {
      fieldsToValidate = ["firstName", "lastName", "email", "phone"];
      if (!phoneVerified) {
        toast({ title: "Phone Verification Required", description: "Please verify your phone number before continuing.", variant: "destructive" });
        return;
      }
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: FormData) => {
    submitMutation.mutate({ 
      ...data, 
      photos: uploadedPhotos,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-4 font-serif text-3xl font-bold">Thank You!</h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              Your consignment request has been submitted successfully. 
              One of our specialists will contact you within 24-48 hours to discuss your vehicle.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8 relative flex justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-muted"></div>
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-2">
            <div 
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                step >= s.id 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-muted-foreground/30 bg-background text-muted-foreground"
              )}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <span className={cn(
              "text-xs font-medium uppercase tracking-wider",
              step >= s.id ? "text-primary" : "text-muted-foreground"
            )}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">
            {step === 1 && "Vehicle Information"}
            {step === 2 && "Condition & Photos"}
            {step === 3 && "Your Contact Details"}
            {step === 4 && "Disclosures & Agreement"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Please provide the basic details of your vehicle."}
            {step === 2 && "Tell us about the condition and upload photos."}
            {step === 3 && "How can we reach you with our valuation?"}
            {step === 4 && "Review disclosures and accept the consignment agreement."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="consignment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid gap-6 md:grid-cols-2"
                >
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vin">VIN Number</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="vin" 
                        placeholder="17-character VIN" 
                        {...form.register("vin")} 
                        data-testid="input-vin" 
                        className="border-white/30"
                        onChange={(e) => {
                          form.setValue("vin", e.target.value.toUpperCase());
                          if (e.target.value.length === 17) {
                            handleVinDecode(e.target.value.toUpperCase());
                          }
                        }}
                      />
                      {isDecodingVin && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Decoding...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Enter VIN to auto-fill vehicle details</p>
                    {form.formState.errors.vin && <p className="text-xs text-destructive">{form.formState.errors.vin.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select 
                      value={selectedYear}
                      onValueChange={(value) => {
                        setSelectedYear(value);
                        form.setValue("year", value);
                        setSelectedMake("");
                        form.setValue("make", "");
                        form.setValue("model", "");
                      }}
                    >
                      <SelectTrigger data-testid="select-year" className="border-white/30">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.year && <p className="text-xs text-destructive">{form.formState.errors.year.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input id="mileage" placeholder="e.g. 12,000" {...form.register("mileage")} data-testid="input-mileage" className="border-white/30" />
                    {form.formState.errors.mileage && <p className="text-xs text-destructive">{form.formState.errors.mileage.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Select 
                      value={selectedMake || ""}
                      onValueChange={(value) => {
                        setSelectedMake(value);
                        form.setValue("make", value);
                        form.setValue("model", "");
                      }}
                      disabled={!selectedYear || isLoadingMakes}
                    >
                      <SelectTrigger data-testid="select-make" className="border-white/30">
                        <SelectValue placeholder={!selectedYear ? "Select year first" : isLoadingMakes ? "Loading makes..." : "Select make"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {makes.length === 0 && !isLoadingMakes && selectedYear && (
                          <SelectItem value="_empty" disabled>No makes found</SelectItem>
                        )}
                        {makes
                          .filter((make) => make.Make_Name)
                          .sort((a, b) => (a.Make_Name || "").localeCompare(b.Make_Name || ""))
                          .map((make) => (
                            <SelectItem key={make.Make_ID} value={make.Make_Name}>{make.Make_Name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.make && <p className="text-xs text-destructive">{form.formState.errors.make.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select 
                      value={form.watch("model") || ""}
                      onValueChange={(value) => form.setValue("model", value)}
                      disabled={!selectedMake || !selectedYear || isLoadingModels}
                    >
                      <SelectTrigger data-testid="select-model" className="border-white/30">
                        <SelectValue placeholder={!selectedMake ? "Select make first" : isLoadingModels ? "Loading models..." : "Select model"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {models.length === 0 && !isLoadingModels && selectedMake && (
                          <SelectItem value="_empty" disabled>No models found</SelectItem>
                        )}
                        {models
                          .filter((model) => model.Model_Name)
                          .sort((a, b) => (a.Model_Name || "").localeCompare(b.Model_Name || ""))
                          .map((model) => (
                            <SelectItem key={model.Model_ID} value={model.Model_Name}>{model.Model_Name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.model && <p className="text-xs text-destructive">{form.formState.errors.model.message}</p>}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="color">Exterior Color</Label>
                    <Input id="color" placeholder="e.g. GT Silver" {...form.register("color")} data-testid="input-color" className="border-white/30" />
                    {form.formState.errors.color && <p className="text-xs text-destructive">{form.formState.errors.color.message}</p>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Overall Condition</Label>
                      <Select 
                        onValueChange={(value) => form.setValue("condition", value as any)} 
                        defaultValue={form.getValues("condition")}
                      >
                        <SelectTrigger data-testid="select-condition" className="border-white/30">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent (Showroom)</SelectItem>
                          <SelectItem value="good">Good (Minor Wear)</SelectItem>
                          <SelectItem value="fair">Fair (Visible Wear)</SelectItem>
                          <SelectItem value="poor">Poor (Needs Work)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Accident History</Label>
                      <Select 
                        onValueChange={(value) => form.setValue("accidentHistory", value as any)} 
                        defaultValue={form.getValues("accidentHistory")}
                      >
                        <SelectTrigger data-testid="select-accident" className="border-white/30">
                          <SelectValue placeholder="Select history" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clean">Clean Title / No Accidents</SelectItem>
                          <SelectItem value="minor">Minor Fender Bender</SelectItem>
                          <SelectItem value="major">Major Accident / Rebuilt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description / Modifications / Options</Label>
                    <Textarea 
                      placeholder="Tell us about special features, modifications, or history..." 
                      className="min-h-[100px] border-white/30"
                      {...form.register("description")} 
                      data-testid="textarea-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Photos</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        disabled={isUploading}
                        data-testid="input-photos"
                      />
                      <div 
                        className={cn(
                          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/5 p-10 text-center transition-colors hover:bg-muted/10",
                          isUploading && "opacity-50 pointer-events-none"
                        )}
                      >
                        <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                        <h4 className="text-sm font-semibold">
                          {isUploading ? "Uploading..." : "Click or tap to upload photos"}
                        </h4>
                        <p className="text-xs text-muted-foreground">Supports JPG, PNG (Max 10MB)</p>
                      </div>
                    </div>
                    {uploadedPhotos.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {uploadedPhotos.map((photo, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={photo}
                              alt={`Upload ${i + 1}`}
                              className="h-20 w-20 rounded-md border object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid gap-6 md:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...form.register("firstName")} data-testid="input-firstname" className="border-white/30" />
                    {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...form.register("lastName")} data-testid="input-lastname" className="border-white/30" />
                    {form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" {...form.register("email")} data-testid="input-email" className="border-white/30" />
                    {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone">Cell Phone</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="(555) 123-4567" 
                        {...form.register("phone")} 
                        data-testid="input-phone"
                        disabled={phoneVerified}
                        className={phoneVerified ? "bg-green-50 border-green-300" : "border-white/30"}
                      />
                      {phoneVerified ? (
                        <div className="flex items-center gap-1 text-green-600 px-3">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const phone = form.getValues("phone");
                            const firstName = form.getValues("firstName");
                            if (phone.length >= 10) {
                              sendCodeMutation.mutate({ phone, firstName });
                            } else {
                              toast({
                                title: "Invalid Phone",
                                description: "Please enter a valid cell phone number.",
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
                    {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
                    
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
                            className="font-mono text-lg tracking-widest border-white/30"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const phone = form.getValues("phone");
                              verifyCodeMutation.mutate({ phone, code: verificationCode });
                            }}
                            disabled={verificationCode.length !== 6 || verifyCodeMutation.isPending}
                            data-testid="button-verify-code"
                          >
                            {verifyCodeMutation.isPending ? "Verifying..." : "Verify"}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Enter the 6-digit code sent to your phone. Code expires in 10 minutes.
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
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
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Vehicle Disclosures</h3>
                    <p className="text-sm text-muted-foreground">
                      Please answer the following questions about your vehicle. These are optional but help us better understand your vehicle's history.
                    </p>
                    
                    <div className="space-y-5 p-4 border border-white/30 rounded-lg">
                      <div className="space-y-2">
                        <Label className="font-medium">Does your vehicle have a salvage or rebuilt title?</Label>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="salvageTitle-yes"
                              name="salvageTitle"
                              checked={form.watch("salvageTitle") === true}
                              onChange={() => form.setValue("salvageTitle", true)}
                              className="h-4 w-4 border-2 border-white/50 text-primary focus:ring-primary"
                              data-testid="radio-salvage-yes"
                            />
                            <Label htmlFor="salvageTitle-yes" className="cursor-pointer">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="salvageTitle-no"
                              name="salvageTitle"
                              checked={form.watch("salvageTitle") === false}
                              onChange={() => form.setValue("salvageTitle", false)}
                              className="h-4 w-4 border-2 border-white/50 text-primary focus:ring-primary"
                              data-testid="radio-salvage-no"
                            />
                            <Label htmlFor="salvageTitle-no" className="cursor-pointer">No</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-medium">Is there an existing lien on the vehicle?</Label>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="lienStatus-yes"
                              name="lienStatus"
                              checked={form.watch("lienStatus") === true}
                              onChange={() => form.setValue("lienStatus", true)}
                              className="h-4 w-4 border-2 border-white/50 text-primary focus:ring-primary"
                              data-testid="radio-lien-yes"
                            />
                            <Label htmlFor="lienStatus-yes" className="cursor-pointer">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="lienStatus-no"
                              name="lienStatus"
                              checked={form.watch("lienStatus") === false}
                              onChange={() => form.setValue("lienStatus", false)}
                              className="h-4 w-4 border-2 border-white/50 text-primary focus:ring-primary"
                              data-testid="radio-lien-no"
                            />
                            <Label htmlFor="lienStatus-no" className="cursor-pointer">No</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mechanicalIssues">Known Mechanical Issues (optional)</Label>
                        <Textarea 
                          id="mechanicalIssues"
                          placeholder="Describe any known mechanical issues, warning lights, or needed repairs..."
                          className="min-h-[80px] border-white/30"
                          {...form.register("mechanicalIssues")}
                          data-testid="textarea-mechanical-issues"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Seller Verification & Agreement</h3>
                    <p className="text-sm text-muted-foreground">
                      Please check all boxes below to confirm and proceed with your consignment request.
                    </p>
                    
                    <div className="space-y-4 p-4 border border-white/30 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          id="ownershipConfirmed" 
                          checked={form.watch("ownershipConfirmed")}
                          onCheckedChange={(checked) => form.setValue("ownershipConfirmed", checked as boolean)}
                          data-testid="checkbox-ownership"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="ownershipConfirmed" className="cursor-pointer font-medium">
                            I am the legal owner or authorized seller of this vehicle *
                          </Label>
                          <p className="text-xs text-muted-foreground">You must be the registered owner or have legal authority to sell</p>
                        </div>
                      </div>
                      {form.formState.errors.ownershipConfirmed && (
                        <p className="text-xs text-destructive">{form.formState.errors.ownershipConfirmed.message}</p>
                      )}

                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          id="agreementAccepted" 
                          checked={form.watch("agreementAccepted")}
                          onCheckedChange={(checked) => form.setValue("agreementAccepted", checked as boolean)}
                          data-testid="checkbox-agreement"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="agreementAccepted" className="cursor-pointer font-medium">
                            I accept the Consignment Agreement *
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            By checking this box, I agree to consign my vehicle under the terms and conditions of the consignment agreement
                          </p>
                        </div>
                      </div>
                      {form.formState.errors.agreementAccepted && (
                        <p className="text-xs text-destructive">{form.formState.errors.agreementAccepted.message}</p>
                      )}

                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          id="termsAccepted" 
                          checked={form.watch("termsAccepted")}
                          onCheckedChange={(checked) => form.setValue("termsAccepted", checked as boolean)}
                          data-testid="checkbox-terms"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="termsAccepted" className="cursor-pointer font-medium">
                            I accept the Terms of Service and Privacy Policy *
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            I have read and agree to the terms of service and privacy policy
                          </p>
                        </div>
                      </div>
                      {form.formState.errors.termsAccepted && (
                        <p className="text-xs text-destructive">{form.formState.errors.termsAccepted.message}</p>
                      )}
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Digital Signature:</strong> By submitting this form, I certify that all information provided is accurate and complete to the best of my knowledge. This electronic submission serves as my digital signature and acknowledgment.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={step === 1 || submitMutation.isPending}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          
          {step < 4 ? (
            <Button onClick={nextStep} className="gap-2" data-testid="button-next">
              Next Step <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={submitMutation.isPending}
              className="min-w-[140px]"
              data-testid="button-submit"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Consignment"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
