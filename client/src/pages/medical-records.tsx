import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  User,
  Stethoscope,
  Activity,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from 'wouter';
import { format } from 'date-fns';

interface MedicalRecord {
  id: number;
  record_id: string;
  patient: number;
  patient_name: string;
  patient_details?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  date: string;
  diagnosis: string;
  type: string;
  doctor?: number;
  doctor_name?: string;
  doctor_details?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

interface Patient {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
}

// Form validation schema
const recordFormSchema = z.object({
  patient: z.number().min(1, 'Patient is required'),
  date: z.string().min(1, 'Date is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  type: z.string().min(1, 'Type is required'),
  doctor: z.number().optional(),
  status: z.string().min(1, 'Status is required'),
});

type RecordFormData = z.infer<typeof recordFormSchema>;

export default function MedicalRecords() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null);

  // Initialize form
  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      patient: 0,
      date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      type: 'Consultation',
      doctor: undefined,
      status: 'completed',
    },
  });

  // Fetch medical records
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['/api/medical-records/'],
    retry: 2,
  });

  // Fetch patients for dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/auth/admin/patients/'],
    retry: 2,
  });

  // Fetch doctors for dropdown
  const { data: doctors = [] } = useQuery({
    queryKey: ['/api/auth/admin/doctors/'],
    retry: 2,
  });

  // Create medical record mutation
  const createMutation = useMutation({
    mutationFn: async (data: RecordFormData) => {
      const response = await apiRequest('POST', '/api/medical-records/', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create medical record');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      toast({
        title: "Success",
        description: "Medical record created successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create medical record",
        variant: "destructive",
      });
    },
  });

  // Update medical record mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RecordFormData> }) => {
      const response = await apiRequest('PATCH', `/api/medical-records/${id}/`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update medical record');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      toast({
        title: "Success",
        description: "Medical record updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update medical record",
        variant: "destructive",
      });
    },
  });

  // Delete medical record mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/medical-records/${id}/`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete medical record');
      }
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      toast({
        title: "Success",
        description: "Medical record deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete medical record",
        variant: "destructive",
      });
    },
  });

  // Filter records based on search
  const filteredRecords = records.filter((record: MedicalRecord) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.record_id?.toLowerCase().includes(searchLower) ||
      record.patient_name?.toLowerCase().includes(searchLower) ||
      record.diagnosis?.toLowerCase().includes(searchLower) ||
      record.type?.toLowerCase().includes(searchLower) ||
      record.doctor_name?.toLowerCase().includes(searchLower)
    );
  });

  // Handle form submit for create
  const handleCreate = (data: RecordFormData) => {
    createMutation.mutate(data);
  };

  // Handle form submit for update
  const handleUpdate = (data: RecordFormData) => {
    if (selectedRecord) {
      // Only send changed fields
      const updateData: Partial<RecordFormData> = {};
      if (data.date !== selectedRecord.date) updateData.date = data.date;
      if (data.diagnosis !== selectedRecord.diagnosis) updateData.diagnosis = data.diagnosis;
      if (data.type !== selectedRecord.type) updateData.type = data.type;
      if (data.doctor !== selectedRecord.doctor) updateData.doctor = data.doctor;
      if (data.status !== selectedRecord.status) updateData.status = data.status;
      
      updateMutation.mutate({ id: selectedRecord.id, data: updateData });
    }
  };

  // Handle edit button click
  const handleEditClick = (record: MedicalRecord) => {
    setSelectedRecord(record);
    form.reset({
      patient: record.patient,
      date: record.date,
      diagnosis: record.diagnosis,
      type: record.type,
      doctor: record.doctor || undefined,
      status: record.status,
    });
    setIsEditDialogOpen(true);
  };

  // Handle view button click
  const handleViewClick = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (record: MedicalRecord) => {
    setRecordToDelete(record);
    setIsDeleteDialogOpen(true);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'reviewed':
        return 'secondary';
      case 'active':
        return 'default';
      case 'scheduled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'active':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600">Hospital Administration Portal</p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Medical Records Management</CardTitle>
                <CardDescription>
                  Access and manage patient medical histories
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search patients, doctors, diagnoses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Record ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex justify-center items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          Loading medical records...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No medical records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record: MedicalRecord) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 text-blue-600 rounded-full p-1.5">
                              <FileText className="h-3 w-3" />
                            </div>
                            {record.record_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-100 text-purple-600 rounded-full p-1.5">
                              <User className="h-3 w-3" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {record.patient_details?.full_name || record.patient_name || `Patient ${record.patient}`}
                              </div>
                              {record.patient_details?.email && (
                                <div className="text-xs text-gray-500">{record.patient_details.email}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {record.doctor_details ? (
                            <div className="text-sm">
                              Dr. {record.doctor_details.full_name || record.doctor_details.username}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={record.diagnosis}>
                            {record.diagnosis}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(getStatusBadgeClass(record.status))}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleViewClick(record)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.print()}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditClick(record)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Record</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteClick(record)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Record</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Record Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Medical Record</DialogTitle>
              <DialogDescription>
                Create a new medical record for a patient
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="patient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.map((patient: Patient) => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.first_name} {patient.last_name} ({patient.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select record type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Consultation">Consultation</SelectItem>
                          <SelectItem value="Lab Results">Lab Results</SelectItem>
                          <SelectItem value="Prescription">Prescription</SelectItem>
                          <SelectItem value="X-Ray">X-Ray</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a doctor (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {doctors.map((doctor: Doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                              Dr. {doctor.first_name} {doctor.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter diagnosis details..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Record'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Record Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Medical Record</DialogTitle>
              <DialogDescription>
                Update medical record information
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select record type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Consultation">Consultation</SelectItem>
                          <SelectItem value="Lab Results">Lab Results</SelectItem>
                          <SelectItem value="Prescription">Prescription</SelectItem>
                          <SelectItem value="X-Ray">X-Ray</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a doctor (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {doctors.map((doctor: Doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                              Dr. {doctor.first_name} {doctor.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter diagnosis details..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Updating...' : 'Update Record'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Record Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Medical Record Details</DialogTitle>
              <DialogDescription>
                {selectedRecord?.record_id}
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Patient</Label>
                    <p className="font-medium">
                      {selectedRecord.patient_details?.full_name || selectedRecord.patient_name}
                    </p>
                    {selectedRecord.patient_details?.email && (
                      <p className="text-sm text-gray-500">{selectedRecord.patient_details.email}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Date</Label>
                    <p className="font-medium">
                      {format(new Date(selectedRecord.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Type</Label>
                    <p className="font-medium">{selectedRecord.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Doctor</Label>
                    <p className="font-medium">
                      {selectedRecord.doctor_details 
                        ? `Dr. ${selectedRecord.doctor_details.full_name}`
                        : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <Badge className={cn(getStatusBadgeClass(selectedRecord.status))}>
                      {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Created</Label>
                    <p className="font-medium">
                      {format(new Date(selectedRecord.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Diagnosis</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedRecord.diagnosis}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Medical Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this medical record? This action cannot be undone.
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{recordToDelete?.record_id}</p>
                  <p className="text-sm">
                    Patient: {recordToDelete?.patient_name || `Patient ${recordToDelete?.patient}`}
                  </p>
                  <p className="text-sm">Date: {recordToDelete?.date}</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => recordToDelete && deleteMutation.mutate(recordToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Record
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}