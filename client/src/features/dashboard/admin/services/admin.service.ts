import { AdminStats, AnalysisTrackingStats } from '../types';

export class AdminService {
  private static baseUrl = '';

  private static getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  static async fetchUsers() {
    const response = await fetch(`${this.baseUrl}/api/auth/users/`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  static async fetchDoctors() {
    const response = await fetch(`${this.baseUrl}/api/auth/admin/doctors/`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch doctors');
    return response.json();
  }

  static async fetchPatients() {
    const response = await fetch(`${this.baseUrl}/api/auth/admin/patients/`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  }

  static async fetchAppointments() {
    try {
      const response = await fetch(`${this.baseUrl}/api/appointments/appointments/`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Appointments endpoint not available');
          return [];
        }
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  static async fetchAnalysisStats(): Promise<AnalysisTrackingStats> {
    const response = await fetch(`${this.baseUrl}/api/analysis-tracking-stats`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch analysis stats');
    return response.json();
  }

  static async fetchRecentAnalyses() {
    const response = await fetch(`${this.baseUrl}/api/analysis-tracking`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch recent analyses');
    return response.json();
  }

  static async createUser(userData: any) {
    const response = await fetch(`${this.baseUrl}/api/auth/admin/users/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  static async updateUser(userId: number, userData: any) {
    const response = await fetch(`${this.baseUrl}/api/auth/admin/users/${userId}/`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }

  static async deleteUser(userId: number) {
    const response = await fetch(`${this.baseUrl}/api/auth/admin/users/${userId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  }

  static async createAppointment(appointmentData: any) {
    const response = await fetch(`${this.baseUrl}/api/appointments/appointments/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(appointmentData),
    });
    if (!response.ok) throw new Error('Failed to create appointment');
    return response.json();
  }

  static async updateAppointment(appointmentId: number, appointmentData: any) {
    const response = await fetch(`${this.baseUrl}/api/appointments/appointments/${appointmentId}/`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(appointmentData),
    });
    if (!response.ok) throw new Error('Failed to update appointment');
    return response.json();
  }

  static async deleteAppointment(appointmentId: number) {
    const response = await fetch(`${this.baseUrl}/api/appointments/appointments/${appointmentId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete appointment');
    return response.json();
  }

  static calculateStats(data: {
    patients: any[];
    doctors: any[];
    appointments: any[];
  }): AdminStats {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalPatients: data.patients?.length || 0,
      totalDoctors: data.doctors?.length || 0,
      totalAppointments: data.appointments?.length || 0,
      pendingAppointments: data.appointments?.filter((a: any) => 
        a.appointment_status === 'Pending' || a.status === 'Pending'
      ).length || 0,
      todayAppointments: data.appointments?.filter((a: any) => {
        return a.appointment_slot_date === today || a.appointment_date === today;
      }).length || 0,
      monthlyGrowth: 12.5 // Placeholder - calculate from actual data
    };
  }

  static generateActivityFeed(data: {
    appointments: any[];
    patients: any[];
    doctors: any[];
  }) {
    const activities: any[] = [];
    const now = new Date();

    const getRelativeTime = (dateStr: string) => {
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    };

    // Process recent appointments
    if (data.appointments?.length > 0) {
      const recentAppointments = data.appointments
        .filter((apt: any) => apt.created_at || apt.updated_at)
        .slice(0, 5);
      
      recentAppointments.forEach((apt: any) => {
        const patientName = apt.patient_name || `Patient #${apt.patient_id}`;
        const doctorName = apt.doctor_name || `Doctor #${apt.doctor_id}`;
        const status = apt.appointment_status || apt.status || 'Pending';
        const timestamp = apt.updated_at || apt.created_at || new Date().toISOString();
        
        let type: 'blue' | 'green' | 'yellow' | 'red' = 'blue';
        let message = '';
        
        if (status === 'Completed') {
          type = 'green';
          message = 'Appointment completed';
        } else if (status === 'Cancelled') {
          type = 'red';
          message = 'Appointment cancelled';
        } else if (status === 'Approved' || status === 'Confirmed') {
          type = 'blue';
          message = 'Appointment confirmed';
        } else {
          type = 'yellow';
          message = 'New appointment scheduled';
        }
        
        activities.push({
          type,
          message,
          description: `${doctorName} with ${patientName}`,
          time: getRelativeTime(timestamp),
          timestamp: new Date(timestamp).getTime()
        });
      });
    }

    // Process recently added patients
    if (data.patients?.length > 0) {
      const recentPatients = data.patients
        .filter((patient: any) => patient.created_at)
        .slice(0, 3);
      
      recentPatients.forEach((patient: any) => {
        const name = `${patient.first_name || ''} ${patient.last_name || ''}`?.trim() || 
                     patient.email || `Patient #${patient.id}`;
        const timestamp = patient.created_at || new Date().toISOString();
        
        activities.push({
          type: 'green' as const,
          message: 'New patient registered',
          description: name,
          time: getRelativeTime(timestamp),
          timestamp: new Date(timestamp).getTime()
        });
      });
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }
}