import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAppointmentSchema } from "@shared/schema";
import type { Doctor } from "@shared/schema";
import { z } from "zod";

const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.string().min(1, "Please select a date"),
  appointmentTime: z.string().min(1, "Please select a time"),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export default function AppointmentForm() {
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");

  const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      doctorId: 0,
      appointmentDate: "",
      appointmentTime: "",
      reason: "",
    },
  });

  const appointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const formattedData = {
        ...data,
        doctorId: parseInt(selectedDoctor),
        appointmentDate: new Date(data.appointmentDate),
      };
      const response = await apiRequest("POST", "/api/appointments", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully booked. We'll contact you soon with confirmation.",
      });
      form.reset();
      setSelectedDoctor("");
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    appointmentMutation.mutate(data);
  };

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  ];

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patientName">Full Name</Label>
          <Input
            id="patientName"
            {...form.register("patientName")}
            placeholder="Enter your full name"
          />
          {form.formState.errors.patientName && (
            <p className="text-sm text-red-500">{form.formState.errors.patientName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientEmail">Email Address</Label>
          <Input
            id="patientEmail"
            type="email"
            {...form.register("patientEmail")}
            placeholder="Enter your email"
          />
          {form.formState.errors.patientEmail && (
            <p className="text-sm text-red-500">{form.formState.errors.patientEmail.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="patientPhone">Phone Number</Label>
        <Input
          id="patientPhone"
          {...form.register("patientPhone")}
          placeholder="Enter your phone number"
        />
        {form.formState.errors.patientPhone && (
          <p className="text-sm text-red-500">{form.formState.errors.patientPhone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Select Doctor</Label>
        <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctorsLoading ? (
              <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
            ) : (
              doctors?.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{doctor.name} - {doctor.specialty}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appointmentDate">Preferred Date</Label>
          <Input
            id="appointmentDate"
            type="date"
            {...form.register("appointmentDate")}
            min={getTomorrowDate()}
          />
          {form.formState.errors.appointmentDate && (
            <p className="text-sm text-red-500">{form.formState.errors.appointmentDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Preferred Time</Label>
          <Select value={form.watch("appointmentTime")} onValueChange={(value) => form.setValue("appointmentTime", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{time}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.appointmentTime && (
            <p className="text-sm text-red-500">{form.formState.errors.appointmentTime.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Visit</Label>
        <Textarea
          id="reason"
          {...form.register("reason")}
          placeholder="Please describe your symptoms or reason for the visit"
          className="min-h-[100px]"
        />
        {form.formState.errors.reason && (
          <p className="text-sm text-red-500">{form.formState.errors.reason.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full medical-button"
        disabled={appointmentMutation.isPending}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {appointmentMutation.isPending ? "Booking..." : "Book Appointment"}
      </Button>
    </form>
  );
}
