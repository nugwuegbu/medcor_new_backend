import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '../services/admin.service';
import { AdminStats, AnalysisTrackingStats, ActivityFeedItem } from '../types';

export const useAdminData = () => {
  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: AdminService.fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch doctors
  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: AdminService.fetchDoctors,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch patients
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['admin', 'patients'],
    queryFn: AdminService.fetchPatients,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['admin', 'appointments'],
    queryFn: AdminService.fetchAppointments,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch analysis stats
  const { data: analysisStats, isLoading: analysisStatsLoading } = useQuery<AnalysisTrackingStats>({
    queryKey: ['admin', 'analysis-stats'],
    queryFn: AdminService.fetchAnalysisStats,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Calculate admin stats
  const stats: AdminStats = AdminService.calculateStats({
    patients: patients || [],
    doctors: doctors || [],
    appointments: appointments || [],
  });

  // Generate activity feed
  const activityFeed: ActivityFeedItem[] = AdminService.generateActivityFeed({
    appointments: appointments || [],
    patients: patients || [],
    doctors: doctors || [],
  });

  const isLoading = usersLoading || doctorsLoading || patientsLoading || appointmentsLoading;

  const queryClient = useQueryClient();

  return {
    users: users || [],
    doctors: doctors || [],
    patients: patients || [],
    appointments: appointments || [],
    stats,
    analysisStats,
    activityFeed,
    isLoading,
    refetch: {
      users: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
      doctors: () => queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] }),
      patients: () => queryClient.invalidateQueries({ queryKey: ['admin', 'patients'] }),
      appointments: () => queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] }),
    },
  };
};