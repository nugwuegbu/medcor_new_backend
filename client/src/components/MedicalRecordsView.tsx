import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Upload,
  File,
  Paperclip,
  X
} from 'lucide-react';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const MedicalRecordsView = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Fetch medical records
  const { data: records, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/medical-records/'],
    queryFn: () => apiRequest('/api/medical-records/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    }),
    retry: 2,
    refetchOnMount: true
  });

  // Fetch patients for dropdown
  const { data: patients } = useQuery({
    queryKey: ['/api/auth/admin/patients/'],
    queryFn: () => apiRequest('/api/auth/admin/patients/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    })
  });

  // Form schema for medical records
  const recordSchema = z.object({
    patient: z.string().min(1, 'Patient is required'),
    date: z.string().min(1, 'Date is required'),
    diagnosis: z.string().min(1, 'Diagnosis is required')
  });

  const form = useForm<z.infer<typeof recordSchema>>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      patient: '',
      date: new Date().toISOString().split('T')[0],
      diagnosis: ''
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('patient', data.patient);
      formData.append('date', data.date);
      formData.append('diagnosis', data.diagnosis);
      
      // Append files
      uploadedFiles.forEach(file => {
        formData.append('uploaded_files', file);
      });
      
      return apiRequest('/api/medical-records/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Medical record created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      setShowAddModal(false);
      form.reset();
      setUploadedFiles([]);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create record', variant: 'destructive' });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const formData = new FormData();
      formData.append('date', data.date);
      formData.append('diagnosis', data.diagnosis);
      
      // Append new files
      uploadedFiles.forEach(file => {
        formData.append('uploaded_files', file);
      });
      
      return apiRequest(`/api/medical-records/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Medical record updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      setShowEditModal(false);
      setSelectedRecord(null);
      form.reset();
      setUploadedFiles([]);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update record', variant: 'destructive' });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/medical-records/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Medical record deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records/'] });
      setShowDeleteDialog(false);
      setSelectedRecord(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete record', variant: 'destructive' });
    }
  });

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Download file
  const downloadFile = async (recordId: string, fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/medical-records/${recordId}/files/${fileId}/download/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
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
      toast({ title: 'Error', description: 'Failed to download file', variant: 'destructive' });
    }
  };

  // Filter records based on search
  const filteredRecords = records?.filter((record: any) => 
    record.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.record_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    form.reset({
      patient: record.patient.toString(),
      date: record.date,
      diagnosis: record.diagnosis
    });
    setUploadedFiles([]);
    setShowEditModal(true);
  };

  const handleDelete = (record: any) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const handleSubmit = (data: z.infer<typeof recordSchema>) => {
    if (showEditModal && selectedRecord) {
      updateMutation.mutate({ id: selectedRecord.id, data });
    } else {
      createMutation.mutate(data);
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
                  form.reset();
                  setUploadedFiles([]);
                  setShowAddModal(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load medical records</p>
              <Button onClick={() => refetch()} className="mt-4" variant="outline">
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
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No medical records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords?.map((record: any) => (
                      <TableRow key={record.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-mono text-sm">{record.record_id}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                              {record.patient_name?.charAt(0) || 'P'}
                            </div>
                            <span>{record.patient_name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(record.date)}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{record.diagnosis}</TableCell>
                        <TableCell>
                          {record.files?.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-4 w-4" />
                              <span className="text-sm">{record.files.length} file(s)</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No files</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
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
                            
                            {record.files?.map((file: any) => (
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

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedRecord(null);
          setUploadedFiles([]);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? 'Edit Medical Record' : 'Add New Medical Record'}
            </DialogTitle>
            <DialogDescription>
              {showEditModal ? 'Update the medical record details' : 'Create a new medical record for a patient'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {!showEditModal && (
                <FormField
                  control={form.control}
                  name="patient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients?.map((patient: any) => (
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
              )}
              
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
              
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Medical Files</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showEditModal && selectedRecord?.files?.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Existing Files:</p>
                      {selectedRecord.files.map((file: any) => (
                        <div key={file.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded mb-1">
                          <File className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{file.file_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedRecord(null);
                    setUploadedFiles([]);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {showEditModal ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    showEditModal ? 'Update Record' : 'Create Record'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
            <AlertDialogCancel onClick={() => setSelectedRecord(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedRecord && deleteMutation.mutate(selectedRecord.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MedicalRecordsView;