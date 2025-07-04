import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface ChatDoctorListProps {
  onSelectDoctor?: (doctor: any) => void;
}

export default function ChatDoctorList({ onSelectDoctor }: ChatDoctorListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/doctors']
  });

  const doctors = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading doctors...
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No doctors available
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto p-2">
      <p className="text-sm font-semibold text-gray-700 mb-2">Available Doctors:</p>
      {doctors.map((doctor: any) => (
        <Card 
          key={doctor.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectDoctor?.(doctor)}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <img
                src={doctor.photo}
                alt={doctor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{doctor.name}</h4>
                <p className="text-xs text-gray-600">{doctor.specialty}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs ml-1">{doctor.rating}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {doctor.experience} years
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}