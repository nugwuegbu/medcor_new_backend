import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Star, Users } from "lucide-react";
import { Link } from "wouter";
import type { Doctor } from "@shared/schema";

export default function Doctors() {
  const { data: doctors, isLoading, error } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Doctors</h1>
            <p className="text-muted-foreground">
              We're experiencing technical difficulties. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Our Medical Experts</h1>
          <p className="text-muted-foreground">
            Meet our team of board-certified doctors and specialists
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors?.map((doctor) => (
            <Card key={doctor.id} className="medical-card">
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
          ))}
        </div>

        {doctors?.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Doctors Available</h3>
            <p className="text-muted-foreground">
              Please check back later for available doctors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
