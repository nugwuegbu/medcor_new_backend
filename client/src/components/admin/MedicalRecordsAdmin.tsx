import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  Search,
  Edit3,
  Trash2,
  Download,
  Plus,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

// Form schema for medical records
const recordSchema = z.object({
  patient: z.number().min(1, 'Patient is required'),
  date: z.string().min(1, 'Date is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required')
});

type RecordFormData = z.infer<typeof recordSchema>;

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
  created_at: string;
  updated_at: string;
  files?: Array<{
    id: number;
    file_name: string;
    file_size: number;
  }>;
}

interface Patient {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const MedicalRecordsAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  
  // Fetch medical records with proper auth
  const { data: recordsResponse, isLoading, error } = useQuery({
    queryKey: ['/api/medical-records/'],
    queryFn: async () => {
      // Use apiRequest with correct signature (url, options)
      return apiRequest('/api/medical-records/', {
        method: 'GET'
      });
    },
    retry: 2,
  });

  // Debug log to see response structure
  console.log('Medical Records Response:', recordsResponse);
  console.log('Response type:', typeof recordsResponse);
  console.log('Is Array?', Array.isArray(recordsResponse));
  console.log('Has results?', recordsResponse?.results);
  
  // Ensure records is always an array - handle both direct array and paginated response
  const records = Array.isArray(recordsResponse) 
    ? recordsResponse 
    : (recordsResponse?.results || recordsResponse || []);

  // Fetch patients for dropdown
  const { data: patientsResponse } = useQuery({
    queryKey: ['/api/auth/admin/patients/'],
    queryFn: async () => {
      // Use apiRequest with correct signature (url, options)
      return apiRequest('/api/auth/admin/patients/', {
        method: 'GET'
      });
    },
    retry: 2,
  });

  // Ensure patients is always an array - handle both direct array and paginated response
  const patients = Array.isArray(patientsResponse) 
    ? patientsResponse 
    : (patientsResponse?.results || patientsResponse || []);

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      patient: 0,
      date: new Date().toISOString().split('T')[0],
      diagnosis: ''
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: RecordFormData) => {
      return apiRequest('/api/medical-records/', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Medical record created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      setShowAddModal(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create record', 
        variant: 'destructive' 
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RecordFormData> }) => {
      return apiRequest(`/api/medical-records/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Medical record updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      setShowEditModal(false);
      setSelectedRecord(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update record', 
        variant: 'destructive' 
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/medical-records/${id}/`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Medical record deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      setShowDeleteDialog(false);
      setSelectedRecord(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete record', 
        variant: 'destructive' 
      });
    }
  });

  // Filter records based on search
  const filteredRecords = records.filter((record: MedicalRecord) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      record.record_id?.toLowerCase().includes(searchLower) ||
      record.patient_name?.toLowerCase().includes(searchLower) ||
      record.patient_details?.full_name?.toLowerCase().includes(searchLower) ||
      record.patient_details?.email?.toLowerCase().includes(searchLower) ||
      record.diagnosis?.toLowerCase().includes(searchLower)
    );
  });
  
  console.log('Records array:', records);
  console.log('Filtered records:', filteredRecords);

  const handleEdit = (record: MedicalRecord) => {
    setSelectedRecord(record);
    form.reset({
      patient: record.patient,
      date: record.date,
      diagnosis: record.diagnosis
    });
    setShowEditModal(true);
  };

  const handleView = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleDelete = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const handleCreateSubmit = (data: RecordFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdateSubmit = (data: RecordFormData) => {
    if (selectedRecord) {
      // Only send changed fields
      const updateData: Partial<RecordFormData> = {};
      if (data.date !== selectedRecord.date) updateData.date = data.date;
      if (data.diagnosis !== selectedRecord.diagnosis) updateData.diagnosis = data.diagnosis;
      
      if (Object.keys(updateData).length > 0) {
        updateMutation.mutate({ id: selectedRecord.id, data: updateData });
      } else {
        toast({ 
          title: 'Info', 
          description: 'No changes detected' 
        });
      }
    }
  };

  const downloadFile = async (recordId: number, fileId: number, fileName: string) => {
    try {
      // Use the apiRequest helper to get the proper Django URL and auth
      const token = localStorage.getItem('adminToken');
      const djangoUrl = import.meta.env.VITE_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${djangoUrl}/api/medical-records/${recordId}/files/${fileId}/download/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to download file', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Medical Records Management</CardTitle>
              <CardDescription>Manage patient medical histories and documents</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                onClick={() => {
                  form.reset({
                    patient: 0,
                    date: new Date().toISOString().split('T')[0],
                    diagnosis: ''
                  });
                  setShowAddModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load medical records</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] })} 
                className="mt-4" 
                variant="outline"
              >
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Record ID</TableHead>
                    <TableHead className="font-semibold">Patient</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Diagnosis</TableHead>
                    <TableHead className="font-semibold">Files</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No medical records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record: MedicalRecord) => (
                      <TableRow key={record.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-mono text-sm">{record.record_id}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                              {(record.patient_details?.first_name?.[0] || record.patient_name?.[0] || 'P').toUpperCase()}
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
                        <TableCell className="text-sm">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">
                          <div className="truncate" title={record.diagnosis}>
                            {record.diagnosis}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.files && record.files.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{record.files.length} file(s)</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No files</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => handleView(record)}
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
                                    onClick={() => handleEdit(record)}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Record</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {record.files?.map((file) => (
                              <TooltipProvider key={file.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => downloadFile(record.id, file.id, file.file_name)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Download {file.file_name}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                    onClick={() => handleDelete(record)}
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
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Medical Record</DialogTitle>
            <DialogDescription>
              Create a new medical record for a patient
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="patient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ''}
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddModal(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Record'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Medical Record</DialogTitle>
            <DialogDescription>
              Update the medical record details
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateSubmit)} className="space-y-4">
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRecord(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Record'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Medical Record Details</DialogTitle>
            <DialogDescription>
              Record ID: {selectedRecord?.record_id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Patient</h4>
                <p>{selectedRecord.patient_details?.full_name || selectedRecord.patient_name}</p>
                {selectedRecord.patient_details?.email && (
                  <p className="text-sm text-gray-500">{selectedRecord.patient_details.email}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Date</h4>
                <p>{format(new Date(selectedRecord.date), 'MMMM d, yyyy')}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Diagnosis</h4>
                <p className="whitespace-pre-wrap">{selectedRecord.diagnosis}</p>
              </div>
              
              {selectedRecord.files && selectedRecord.files.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Attached Files</h4>
                  <div className="space-y-2">
                    {selectedRecord.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.file_name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.file_size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadFile(selectedRecord.id, file.id, file.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medical record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedRecord(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRecord) {
                  deleteMutation.mutate(selectedRecord.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MedicalRecordsAdmin;