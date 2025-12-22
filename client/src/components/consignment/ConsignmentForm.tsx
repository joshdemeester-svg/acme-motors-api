import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, ChevronRight, ChevronLeft, Car, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  // Vehicle Info
  vin: z.string().min(17, "VIN must be at least 17 characters").max(17, "VIN must be 17 characters"),
  year: z.string().min(4, "Year is required"),
  make: z.string().min(2, "Make is required"),
  model: z.string().min(2, "Model is required"),
  mileage: z.string().min(1, "Mileage is required"),
  color: z.string().min(2, "Color is required"),
  
  // Condition
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  accidentHistory: z.enum(["clean", "minor", "major"]),
  description: z.string().optional(),
  
  // Contact
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condition: "excellent",
      accidentHistory: "clean",
    }
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
    setIsSubmitting(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Form Data:", data);
    console.log("Photos:", photos);
    setIsSubmitting(false);
    toast({
      title: "Consignment Request Received",
      description: "We have received your vehicle details. An agent will contact you shortly.",
    });
    // Reset or redirect logic here
  };

  // Mock File Upload Handler
  const handleFileUpload = () => {
    // Just mock adding a file
    setPhotos([...photos, `photo-${photos.length + 1}.jpg`]);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Stepper */}
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
            {step === 2 && "Condition & History"}
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
                    <Input id="vin" placeholder="17-character VIN" {...form.register("vin")} />
                    {form.formState.errors.vin && <p className="text-xs text-destructive">{form.formState.errors.vin.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" placeholder="YYYY" {...form.register("year")} />
                    {form.formState.errors.year && <p className="text-xs text-destructive">{form.formState.errors.year.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input id="make" placeholder="e.g. Porsche" {...form.register("make")} />
                    {form.formState.errors.make && <p className="text-xs text-destructive">{form.formState.errors.make.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" placeholder="e.g. 911 GT3" {...form.register("model")} />
                    {form.formState.errors.model && <p className="text-xs text-destructive">{form.formState.errors.model.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input id="mileage" placeholder="e.g. 12,000" {...form.register("mileage")} />
                    {form.formState.errors.mileage && <p className="text-xs text-destructive">{form.formState.errors.mileage.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Exterior Color</Label>
                    <Input id="color" placeholder="e.g. GT Silver" {...form.register("color")} />
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
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Photos</Label>
                    <div 
                      onClick={handleFileUpload}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/5 p-10 text-center transition-colors hover:bg-muted/10"
                    >
                      <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                      <h4 className="text-sm font-semibold">Click to upload photos</h4>
                      <p className="text-xs text-muted-foreground">Supports JPG, PNG (Max 10MB)</p>
                    </div>
                    {photos.length > 0 && (
                      <div className="mt-4 flex gap-2">
                        {photos.map((_, i) => (
                          <div key={i} className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs font-mono">
                            IMG_{i+1}
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
                    <Input id="firstName" {...form.register("firstName")} />
                    {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...form.register("lastName")} />
                    {form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" {...form.register("email")} />
                    {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" {...form.register("phone")} />
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
            disabled={step === 1 || isSubmitting}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          
          {step < 3 ? (
            <Button onClick={nextStep} className="gap-2">
              Next Step <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? "Submitting..." : "Submit Consignment"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
