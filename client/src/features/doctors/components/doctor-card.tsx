import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Star, Users } from "lucide-react";
import { Link } from "wouter";
import type { Doctor } from "@shared/schema";

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <Card className="medical-card">
      <CardHeader className="text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
          <img 
            src={doctor.photo} 
            alt={doctor.name}
            className="w-full h-full object-cover"
          />
        </div>
        <CardTitle className="text-xl">{doctor.name}</CardTitle>
        <Badge variant="secondary" className="mx-auto">
          {doctor.specialty}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-2" />
          {doctor.experience} years experience
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Star className="h-4 w-4 mr-2" />
          {doctor.education}
        </div>
        <p className="text-sm text-muted-foreground">
          {doctor.bio}
        </p>
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              doctor.available ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {doctor.available ? 'Available' : 'Busy'}
          </div>
          <Link href="/appointments">
            <Button size="sm" className="medical-button">
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
