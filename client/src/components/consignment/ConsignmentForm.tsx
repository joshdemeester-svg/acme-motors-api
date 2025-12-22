import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, ChevronRight, ChevronLeft, Car, FileText, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useUpload } from "@/hooks/use-upload";

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
  phone: z.string().min(10, "Phone number is required"),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "Vehicle Details", icon: Car },
  { id: 2, title: "Condition & Photos", icon: FileText },
  { id: 3, title: "Contact Info", icon: User },
];

export function ConsignmentForm() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    }
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

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["vin", "year", "make", "model", "mileage", "color"];
    } else if (step === 2) {
      fieldsToValidate = ["condition", "accidentHistory"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: FormData) => {
    submitMutation.mutate({ ...data, photos: uploadedPhotos });
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
          </CardTitle>
          <CardDescription>
            {step === 1 && "Please provide the basic details of your vehicle."}
            {step === 2 && "Tell us about the condition and upload photos."}
            {step === 3 && "How can we reach you with our valuation?"}
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
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN Number</Label>
                    <Input id="vin" placeholder="17-character VIN" {...form.register("vin")} data-testid="input-vin" />
                    {form.formState.errors.vin && <p className="text-xs text-destructive">{form.formState.errors.vin.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" placeholder="YYYY" {...form.register("year")} data-testid="input-year" />
                    {form.formState.errors.year && <p className="text-xs text-destructive">{form.formState.errors.year.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input id="make" placeholder="e.g. Porsche" {...form.register("make")} data-testid="input-make" />
                    {form.formState.errors.make && <p className="text-xs text-destructive">{form.formState.errors.make.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" placeholder="e.g. 911 GT3" {...form.register("model")} data-testid="input-model" />
                    {form.formState.errors.model && <p className="text-xs text-destructive">{form.formState.errors.model.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input id="mileage" placeholder="e.g. 12,000" {...form.register("mileage")} data-testid="input-mileage" />
                    {form.formState.errors.mileage && <p className="text-xs text-destructive">{form.formState.errors.mileage.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Exterior Color</Label>
                    <Input id="color" placeholder="e.g. GT Silver" {...form.register("color")} data-testid="input-color" />
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
                        <SelectTrigger data-testid="select-condition">
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
                        <SelectTrigger data-testid="select-accident">
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
                      className="min-h-[100px]"
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
                    <Input id="firstName" {...form.register("firstName")} data-testid="input-firstname" />
                    {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...form.register("lastName")} data-testid="input-lastname" />
                    {form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" {...form.register("email")} data-testid="input-email" />
                    {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" {...form.register("phone")} data-testid="input-phone" />
                    {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
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
          
          {step < 3 ? (
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
