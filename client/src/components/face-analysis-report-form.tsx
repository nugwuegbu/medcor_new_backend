import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface FaceAnalysisReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: any;
  onSubmit: (formData: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientJob: string;
  }) => void;
}

export default function FaceAnalysisReportForm({
  isOpen,
  onClose,
  analysisResult,
  onSubmit
}: FaceAnalysisReportFormProps) {
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientJob: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Get Your Full Report</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patientName">Ad Soyad</Label>
            <Input
              id="patientName"
              type="text"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              required
              placeholder="Adınız ve soyadınız"
            />
          </div>

          <div>
            <Label htmlFor="patientEmail">Email</Label>
            <Input
              id="patientEmail"
              type="email"
              value={formData.patientEmail}
              onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
              required
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="patientPhone">Telefon</Label>
            <Input
              id="patientPhone"
              type="tel"
              value={formData.patientPhone}
              onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
              required
              placeholder="+90 XXX XXX XX XX"
            />
          </div>

          <div>
            <Label htmlFor="patientJob">İş/Meslek</Label>
            <Input
              id="patientJob"
              type="text"
              value={formData.patientJob}
              onChange={(e) => setFormData({ ...formData, patientJob: e.target.value })}
              required
              placeholder="Mesleğiniz"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              PDF Report Gönder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}