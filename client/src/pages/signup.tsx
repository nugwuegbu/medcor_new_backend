import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  Shield, 
  CreditCard, 
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertClinicSchema } from "@shared/schema";

const clinicSignupSchema = z.object({
  // Step 1: Clinic Information
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  clinicType: z.string().min(1, "Please select clinic type"),
  licenseNumber: z.string().min(5, "License number must be at least 5 characters"),
  establishedYear: z.string().regex(/^\d{4}$/, "Please enter a valid year"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters"),
  
  // Step 2: Contact Information
  contactPersonName: z.string().min(2, "Contact person name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  alternatePhone: z.string().optional(),
  
  // Step 3: Address Information
  address: z.string().min(10, "Complete address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
  
  // Step 4: Practice Details
  specializations: z.array(z.string()).min(1, "Select at least one specialization"),
  numberOfDoctors: z.string().min(1, "Number of doctors is required"),
  numberOfStaff: z.string().min(1, "Number of staff is required"),
  patientsPerMonth: z.string().min(1, "Estimated patients per month is required"),
  
  // Step 5: Agreement
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
  agreeToPrivacy: z.boolean().refine((val) => val === true, "You must agree to the privacy policy"),
  subscribeToUpdates: z.boolean().optional(),
});

type ClinicSignupForm = z.infer<typeof clinicSignupSchema>;

const clinicTypes = [
  "General Practice", "Dental Clinic", "Eye Care", "Dermatology", 
  "Cardiology", "Orthopedics", "Pediatrics", "Emergency Care",
  "Mental Health", "Physical Therapy", "Specialty Clinic", "Hospital"
];

const specializations = [
  "General Medicine", "Cardiology", "Dermatology", "Orthopedics",
  "Pediatrics", "Gynecology", "Neurology", "Psychiatry",
  "Oncology", "Emergency Medicine", "Radiology", "Pathology",
  "Anesthesiology", "Surgery", "Internal Medicine", "Family Medicine"
];

const pricingPlans = {
  starter: { name: "Starter", price: 299, originalPrice: 399 },
  professional: { name: "Professional", price: 699, originalPrice: 899 },
  enterprise: { name: "Enterprise", price: 1299, originalPrice: 1699 }
};

export default function Signup() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const selectedPlan = searchParams.get('plan') || 'professional';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<ClinicSignupForm>({
    resolver: zodResolver(clinicSignupSchema),
    mode: "onSubmit", // Only validate on submit, not onChange
    defaultValues: {
      specializations: [],
      agreeToTerms: false,
      agreeToPrivacy: false,
      subscribeToUpdates: true,
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: ClinicSignupForm) => {
      // Store clinic data in localStorage temporarily instead of API call
      const clinicData = {
        clinicName: data.clinicName,
        clinicType: data.clinicType,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone || null,
        contactPersonName: data.contactPersonName,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        website: data.website || null,
        description: data.description,
        licenseNumber: data.licenseNumber,
        establishedYear: data.establishedYear, // Keep as string for localStorage
        specializations: data.specializations,
        numberOfDoctors: data.numberOfDoctors, // Keep as string for localStorage
        numberOfStaff: data.numberOfStaff, // Keep as string for localStorage
        patientsPerMonth: data.patientsPerMonth, // Keep as string for localStorage
        selectedPlan,
        agreeToTerms: data.agreeToTerms,
        agreeToPrivacy: data.agreeToPrivacy,
        subscribeToUpdates: data.subscribeToUpdates || false,
        registrationDate: new Date().toISOString()
      };

      // Store in localStorage
      localStorage.setItem('clinicRegistrationData', JSON.stringify(clinicData));
      
      // Simulate API response
      return Promise.resolve({
        success: true,
        message: "Clinic registration data saved locally",
        clinic: {
          id: Date.now().toString(),
          ...clinicData
        }
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Registration Successful!",
        description: "Your clinic data has been saved. Redirecting to payment...",
      });
      
      console.log("Clinic registration saved to localStorage:", response);
      
      // Redirect to payment page with clinic ID
      setTimeout(() => {
        window.location.href = `/payment?plan=${selectedPlan}&clinicId=${response.clinic?.id}`;
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Clinic signup error:", error);
      
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClinicSignupForm) => {
    console.log("Form submission data:", { ...data, specializations: selectedSpecializations });
    signupMutation.mutate({ ...data, specializations: selectedSpecializations });
  };

  const nextStep = () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    form.trigger(fieldsToValidate).then((isValid) => {
      if (isValid) {
        setCurrentStep(prev => Math.min(prev + 1, 5));
      }
    });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1:
        return ["clinicName", "clinicType", "licenseNumber", "establishedYear", "website", "description"] as const;
      case 2:
        return ["contactPersonName", "email", "phone", "alternatePhone"] as const;
      case 3:
        return ["address", "city", "state", "zipCode", "country"] as const;
      case 4:
        return ["numberOfDoctors", "numberOfStaff", "patientsPerMonth"] as const;
      case 5:
        return ["agreeToTerms", "agreeToPrivacy"] as const;
      default:
        return [];
    }
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/pricing">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Register Your Clinic
          </h1>
          <p className="text-gray-600 mb-6">
            Complete your registration to start your AI-powered healthcare journey
          </p>
          
          {/* Selected Plan Badge */}
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg px-6 py-2">
            {pricingPlans[selectedPlan as keyof typeof pricingPlans]?.name} Plan - 
            ${pricingPlans[selectedPlan as keyof typeof pricingPlans]?.price}/month
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep} of 5</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {currentStep === 1 && <><Building2 className="h-5 w-5" /><span>Clinic Information</span></>}
                {currentStep === 2 && <><User className="h-5 w-5" /><span>Contact Information</span></>}
                {currentStep === 3 && <><MapPin className="h-5 w-5" /><span>Address Details</span></>}
                {currentStep === 4 && <><Users className="h-5 w-5" /><span>Practice Details</span></>}
                {currentStep === 5 && <><Shield className="h-5 w-5" /><span>Terms & Agreement</span></>}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Tell us about your healthcare facility"}
                {currentStep === 2 && "Primary contact information"}
                {currentStep === 3 && "Where is your clinic located?"}
                {currentStep === 4 && "Details about your practice"}
                {currentStep === 5 && "Review and agree to our terms"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Step 1: Clinic Information */}
              {currentStep === 1 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic Name *</Label>
                    <Input
                      id="clinicName"
                      placeholder="Enter your clinic name"
                      {...form.register("clinicName")}
                    />
                    {form.formState.errors.clinicName && (
                      <p className="text-sm text-red-500">{form.formState.errors.clinicName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicType">Clinic Type *</Label>
                    <Select onValueChange={(value) => form.setValue("clinicType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select clinic type" />
                      </SelectTrigger>
                      <SelectContent>
                        {clinicTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.clinicType && (
                      <p className="text-sm text-red-500">{form.formState.errors.clinicType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">Medical License Number *</Label>
                    <Input
                      id="licenseNumber"
                      placeholder="Enter license number"
                      {...form.register("licenseNumber")}
                    />
                    {form.formState.errors.licenseNumber && (
                      <p className="text-sm text-red-500">{form.formState.errors.licenseNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="establishedYear">Established Year *</Label>
                    <Input
                      id="establishedYear"
                      placeholder="e.g., 2020"
                      {...form.register("establishedYear")}
                    />
                    {form.formState.errors.establishedYear && (
                      <p className="text-sm text-red-500">{form.formState.errors.establishedYear.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input
                      id="website"
                      placeholder="https://your-clinic.com"
                      {...form.register("website")}
                    />
                    {form.formState.errors.website && (
                      <p className="text-sm text-red-500">{form.formState.errors.website.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Clinic Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your clinic's services and specialties"
                      className="min-h-[100px]"
                      {...form.register("description")}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Contact Information */}
              {currentStep === 2 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                    <Input
                      id="contactPersonName"
                      placeholder="Full name of primary contact"
                      {...form.register("contactPersonName")}
                    />
                    {form.formState.errors.contactPersonName && (
                      <p className="text-sm text-red-500">{form.formState.errors.contactPersonName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@clinic.com"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Primary Phone *</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternatePhone">Alternate Phone</Label>
                    <Input
                      id="alternatePhone"
                      placeholder="+1 (555) 987-6543"
                      {...form.register("alternatePhone")}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Address Information */}
              {currentStep === 3 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Complete Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Street address, building number, floor, etc."
                      {...form.register("address")}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="City name"
                      {...form.register("city")}
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      placeholder="State or Province"
                      {...form.register("state")}
                    />
                    {form.formState.errors.state && (
                      <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                    <Input
                      id="zipCode"
                      placeholder="12345"
                      {...form.register("zipCode")}
                    />
                    {form.formState.errors.zipCode && (
                      <p className="text-sm text-red-500">{form.formState.errors.zipCode.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      placeholder="Country name"
                      {...form.register("country")}
                    />
                    {form.formState.errors.country && (
                      <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Practice Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Medical Specializations *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {specializations.map((spec) => (
                        <div key={spec} className="flex items-center space-x-2">
                          <Checkbox
                            id={spec}
                            checked={selectedSpecializations.includes(spec)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSpecializations([...selectedSpecializations, spec]);
                                form.setValue("specializations", [...selectedSpecializations, spec]);
                              } else {
                                const filtered = selectedSpecializations.filter(s => s !== spec);
                                setSelectedSpecializations(filtered);
                                form.setValue("specializations", filtered);
                              }
                            }}
                          />
                          <Label htmlFor={spec} className="text-sm font-normal">
                            {spec}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.specializations && (
                      <p className="text-sm text-red-500 mt-2">{form.formState.errors.specializations.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="numberOfDoctors">Number of Doctors *</Label>
                      <Select onValueChange={(value) => form.setValue("numberOfDoctors", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1-5</SelectItem>
                          <SelectItem value="6-10">6-10</SelectItem>
                          <SelectItem value="11-25">11-25</SelectItem>
                          <SelectItem value="26-50">26-50</SelectItem>
                          <SelectItem value="50+">50+</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.numberOfDoctors && (
                        <p className="text-sm text-red-500">{form.formState.errors.numberOfDoctors.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numberOfStaff">Total Staff *</Label>
                      <Select onValueChange={(value) => form.setValue("numberOfStaff", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-25">11-25</SelectItem>
                          <SelectItem value="26-50">26-50</SelectItem>
                          <SelectItem value="51-100">51-100</SelectItem>
                          <SelectItem value="100+">100+</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.numberOfStaff && (
                        <p className="text-sm text-red-500">{form.formState.errors.numberOfStaff.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="patientsPerMonth">Patients/Month *</Label>
                      <Select onValueChange={(value) => form.setValue("patientsPerMonth", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-100">1-100</SelectItem>
                          <SelectItem value="101-500">101-500</SelectItem>
                          <SelectItem value="501-1000">501-1000</SelectItem>
                          <SelectItem value="1001-2000">1001-2000</SelectItem>
                          <SelectItem value="2000+">2000+</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.patientsPerMonth && (
                        <p className="text-sm text-red-500">{form.formState.errors.patientsPerMonth.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Terms & Agreement */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Registration Summary</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Clinic:</strong> {form.watch("clinicName")}</p>
                        <p><strong>Type:</strong> {form.watch("clinicType")}</p>
                        <p><strong>Contact:</strong> {form.watch("contactPersonName")}</p>
                        <p><strong>Email:</strong> {form.watch("email")}</p>
                      </div>
                      <div>
                        <p><strong>City:</strong> {form.watch("city")}</p>
                        <p><strong>Doctors:</strong> {form.watch("numberOfDoctors")}</p>
                        <p><strong>Staff:</strong> {form.watch("numberOfStaff")}</p>
                        <p><strong>Plan:</strong> {pricingPlans[selectedPlan as keyof typeof pricingPlans]?.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToTerms"
                        checked={form.watch("agreeToTerms")}
                        onCheckedChange={(checked) => form.setValue("agreeToTerms", checked as boolean)}
                      />
                      <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                        I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and 
                        understand that this is a binding agreement for healthcare AI services.
                      </Label>
                    </div>
                    {form.formState.errors.agreeToTerms && form.formState.isSubmitted && (
                      <p className="text-sm text-red-500">{form.formState.errors.agreeToTerms.message}</p>
                    )}

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToPrivacy"
                        checked={form.watch("agreeToPrivacy")}
                        onCheckedChange={(checked) => form.setValue("agreeToPrivacy", checked as boolean)}
                      />
                      <Label htmlFor="agreeToPrivacy" className="text-sm leading-relaxed">
                        I acknowledge the <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> and 
                        consent to data processing for healthcare services in compliance with HIPAA regulations.
                      </Label>
                    </div>
                    {form.formState.errors.agreeToPrivacy && form.formState.isSubmitted && (
                      <p className="text-sm text-red-500">{form.formState.errors.agreeToPrivacy.message}</p>
                    )}

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="subscribeToUpdates"
                        checked={form.watch("subscribeToUpdates")}
                        onCheckedChange={(checked) => form.setValue("subscribeToUpdates", checked as boolean)}
                      />
                      <Label htmlFor="subscribeToUpdates" className="text-sm leading-relaxed">
                        Send me product updates, healthcare industry insights, and special offers via email.
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={signupMutation.isPending}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {signupMutation.isPending ? (
                  "Processing..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}