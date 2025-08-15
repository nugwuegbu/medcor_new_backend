import { doctors, appointments, chatMessages, faceAnalysisReports, hairAnalysisReports, clinics, analysisTracking, type Doctor, type InsertDoctor, type Appointment, type InsertAppointment, type ChatMessage, type InsertChatMessage, type User, type InsertUser, type FaceAnalysisReport, type InsertFaceAnalysisReport, type HairAnalysisReport, type InsertHairAnalysisReport, type Clinic, type InsertClinic, type AnalysisTracking, type InsertAnalysisTracking } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByOAuthId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  linkOAuthAccount(userId: number, provider: string, providerId: string): Promise<void>;
  
  // Authentication operations
  verifyUserPassword(email: string, password: string): Promise<User | null>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  
  getAllDoctors(): Promise<Doctor[]>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByUser(userId: number, role: string): Promise<Appointment[]>;
  
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  createFaceAnalysisReport(report: InsertFaceAnalysisReport): Promise<FaceAnalysisReport>;
  createHairAnalysisReport(report: InsertHairAnalysisReport): Promise<HairAnalysisReport>;
  getHairAnalysisReports(sessionId: string): Promise<HairAnalysisReport[]>;
  
  // Clinic operations
  getAllClinics(): Promise<Clinic[]>;
  getClinic(id: number): Promise<Clinic | undefined>;
  getClinicByEmail(email: string): Promise<Clinic | undefined>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: number, updates: Partial<Clinic>): Promise<Clinic>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAdminStats(): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    pendingAppointments: number;
    todayAppointments: number;
    monthlyGrowth: number;
  }>;
  
  // Analysis Tracking operations
  createAnalysisTracking(analysis: InsertAnalysisTracking): Promise<AnalysisTracking>;
  getAnalysisTrackingByTenant(tenantId?: number): Promise<AnalysisTracking[]>;
  getAnalysisTrackingStats(tenantId?: number): Promise<{
    faceAnalyses: number;
    hairAnalyses: number;
    lipsAnalyses: number;
    skinAnalyses: number;
    hairExtensionAnalyses: number;
    totalAnalyses: number;
    growthPercentage: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private appointments: Map<number, Appointment>;
  private chatMessages: Map<number, ChatMessage>;
  private faceAnalysisReports: Map<number, FaceAnalysisReport>;
  private hairAnalysisReports: Map<number, HairAnalysisReport>;
  private clinics: Map<number, Clinic>;
  private analysisTrackingData: Map<number, AnalysisTracking>;
  private currentUserId: number;
  private currentDoctorId: number;
  private currentAppointmentId: number;
  private currentChatMessageId: number;
  private currentFaceAnalysisReportId: number;
  private currentHairAnalysisReportId: number;
  private currentClinicId: number;
  private currentAnalysisTrackingId: number;

  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.appointments = new Map();
    this.chatMessages = new Map();
    this.faceAnalysisReports = new Map();
    this.hairAnalysisReports = new Map();
    this.clinics = new Map();
    this.analysisTrackingData = new Map();
    this.currentUserId = 1;
    this.currentDoctorId = 1;
    this.currentAppointmentId = 1;
    this.currentChatMessageId = 1;
    this.currentFaceAnalysisReportId = 1;
    this.currentHairAnalysisReportId = 1;
    this.currentClinicId = 1;
    this.currentAnalysisTrackingId = 1;
    
    this.seedDoctors();
    this.seedTestData();
  }

  private seedDoctors() {
    const seedDoctors: InsertDoctor[] = [
      {
        name: "Dr. Sarah Johnson",
        specialty: "Cardiology",
        experience: 5,
        education: "MD from Johns Hopkins University",
        photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Johnson is a board-certified cardiologist with over 5 years of experience treating heart conditions.",
        description: "5 years experience in cardiology, graduated from Johns Hopkins University.",
        avatarId: "heygen_avatar_sarah_cardio",
        available: true,
      },
      {
        name: "Dr. Michael Chen",
        specialty: "Orthopedics",
        experience: 7,
        education: "MD from Harvard Medical School",
        photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Chen specializes in sports medicine and joint replacement surgery.",
        description: "7 years in orthopedics, Harvard Medical School graduate, expert in sports medicine.",
        avatarId: "heygen_avatar_michael_ortho",
        available: true,
      },
      {
        name: "Dr. Emily Rodriguez",
        specialty: "Pediatrics",
        experience: 10,
        education: "MD from Stanford University",
        photo: "https://images.unsplash.com/photo-1594824388853-2c5cb2d2f40e?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Rodriguez is passionate about providing comprehensive care for children and adolescents.",
        description: "10 years of pediatric experience, Stanford University alumnus, child health specialist.",
        avatarId: "heygen_avatar_emily_pediatrics",
        available: true,
      },
      {
        name: "Dr. David Wilson",
        specialty: "Neurology",
        experience: 20,
        education: "MD from Mayo Clinic",
        photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Wilson is a leading neurologist specializing in stroke and brain injury treatment.",
        avatarId: "heygen_avatar_david_neuro",
        available: true,
      },
      {
        name: "Dr. Lisa Thompson",
        specialty: "Dermatology",
        experience: 10,
        education: "MD from UCLA",
        photo: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Thompson provides comprehensive dermatological care including cosmetic procedures.",
        avatarId: "heygen_avatar_lisa_dermatology",
        available: true,
      },
      {
        name: "Dr. Robert Kim",
        specialty: "Internal Medicine",
        experience: 18,
        education: "MD from University of Pennsylvania",
        photo: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Kim focuses on preventive care and management of chronic conditions.",
        avatarId: "heygen_avatar_robert_internal",
        available: true,
      },
    ];

    seedDoctors.forEach(doctor => {
      const id = this.currentDoctorId++;
      const fullDoctor: Doctor = { 
        ...doctor, 
        id,
        avatarId: doctor.avatarId || null,
        available: doctor.available ?? true,
        description: doctor.description || null
      };
      this.doctors.set(id, fullDoctor);
    });
  }

  private seedTestData() {
    // Seed test users
    const testUsers: InsertUser[] = [
      {
        username: "john_patient",
        password: "Patient123!",
        email: "john@patient.com",
        name: "John Patient",
        role: "patient",
        phoneNumber: "+1234567890",
        preferredLanguage: "en"
      },
      {
        username: "sarah_doctor", 
        password: "Doctor123!",
        email: "sarah@doctor.com",
        name: "Dr. Sarah Medical",
        role: "doctor",
        phoneNumber: "+1234567891",
        preferredLanguage: "en"
      },
      {
        username: "clinic_staff",
        password: "Clinic123!",
        email: "staff@clinic.com",
        name: "Clinic Manager",
        role: "clinic",
        phoneNumber: "+1234567892",
        preferredLanguage: "en"
      }
    ];

    testUsers.forEach(userData => {
      const id = this.currentUserId++;
      const user: User = { 
        id,
        username: userData.username,
        password: userData.password,
        email: userData.email,
        phoneNumber: userData.phoneNumber || null,
        name: userData.name,
        profilePicture: null,
        preferredLanguage: userData.preferredLanguage || "en",
        faceId: null,
        personId: null,
        lastFaceLogin: null,
        faceLoginEnabled: false,
        faceRegistered: false,
        oauthProvider: null,
        oauthProviderId: null,
        lastLogin: new Date(),
        isNewUser: false,
        role: userData.role || "patient",
        isActive: true,
        emailVerified: true,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(id, user);
    });

    // Seed test appointments
    const testAppointments: InsertAppointment[] = [
      {
        patientName: "John Patient",
        patientEmail: "john@patient.com",
        patientPhone: "+1234567890",
        doctorId: 1,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        appointmentTime: "10:00 AM",
        reason: "General checkup"
      },
      {
        patientName: "Jane Smith",
        patientEmail: "jane@smith.com", 
        patientPhone: "+1234567893",
        doctorId: 2,
        appointmentDate: new Date(),
        appointmentTime: "2:00 PM",
        reason: "Follow-up consultation"
      },
      {
        patientName: "Bob Johnson",
        patientEmail: "bob@johnson.com",
        patientPhone: "+1234567894",
        doctorId: 1,
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        appointmentTime: "11:30 AM",
        reason: "Cardiology consultation"
      }
    ];

    testAppointments.forEach(appointment => {
      const id = this.currentAppointmentId++;
      const fullAppointment: Appointment = { 
        ...appointment, 
        id, 
        status: Math.random() > 0.5 ? "confirmed" : "pending",
        createdAt: new Date()
      };
      this.appointments.set(id, fullAppointment);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async verifyUserPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    // In a real implementation, you would use bcrypt.compare here
    // For now, this is just a placeholder - the actual verification is done in AuthService
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.password = hashedPassword;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async getUserByOAuthId(provider: string, providerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => 
      u.oauthProvider === provider && u.oauthProviderId === providerId
    );
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  async linkOAuthAccount(userId: number, provider: string, providerId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.oauthProvider = provider;
      user.oauthProviderId = providerId;
      this.users.set(userId, user);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      phoneNumber: insertUser.phoneNumber || null,
      name: insertUser.name,
      profilePicture: insertUser.profilePicture || null,
      preferredLanguage: insertUser.preferredLanguage || "en",
      faceId: null,
      personId: null,
      lastFaceLogin: null,
      faceLoginEnabled: false,
      faceRegistered: false,
      oauthProvider: insertUser.oauthProvider || null,
      oauthProviderId: insertUser.oauthProviderId || null,
      lastLogin: null,
      isNewUser: insertUser.isNewUser !== undefined ? insertUser.isNewUser : true,
      role: insertUser.role || "patient",
      isActive: true,
      emailVerified: false,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = this.currentDoctorId++;
    const doctor: Doctor = { 
      ...insertDoctor, 
      id,
      avatarId: insertDoctor.avatarId || null,
      available: insertDoctor.available !== undefined ? insertDoctor.available : true,
      description: insertDoctor.description || null
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      status: "pending",
      createdAt: new Date()
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAppointmentsByUser(userId: number, role: string): Promise<Appointment[]> {
    const allAppointments = Array.from(this.appointments.values());
    
    if (role === 'doctor') {
      // Return appointments where the user is the doctor
      return allAppointments.filter(apt => apt.doctorId === userId);
    } else if (role === 'patient') {
      // Return appointments where the user is the patient
      return allAppointments.filter(apt => apt.patientId === userId);
    } else {
      // For admin/clinic roles, return all appointments
      return allAppointments;
    }
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (message) => message.sessionId === sessionId
    );
  }

  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const message: ChatMessage = { 
      ...insertChatMessage, 
      id, 
      language: insertChatMessage.language || "en",
      speakerType: insertChatMessage.speakerType || "nurse",
      doctorId: insertChatMessage.doctorId || null,
      avatarResponse: insertChatMessage.avatarResponse || null,
      createdAt: new Date(),
      userId: insertChatMessage.userId ?? null,
      faceRecognitionData: insertChatMessage.faceRecognitionData ?? null
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async createFaceAnalysisReport(insertReport: InsertFaceAnalysisReport): Promise<FaceAnalysisReport> {
    const id = this.currentFaceAnalysisReportId++;
    const report: FaceAnalysisReport = { 
      ...insertReport, 
      id, 
      pdfPath: insertReport.pdfPath || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.faceAnalysisReports.set(id, report);
    return report;
  }

  async createHairAnalysisReport(insertReport: InsertHairAnalysisReport): Promise<HairAnalysisReport> {
    const id = this.currentHairAnalysisReportId++;
    const report: HairAnalysisReport = { 
      ...insertReport, 
      id, 
      userId: insertReport.userId || null,
      imageHash: insertReport.imageHash || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.hairAnalysisReports.set(id, report);
    return report;
  }

  async getHairAnalysisReports(sessionId: string): Promise<HairAnalysisReport[]> {
    return Array.from(this.hairAnalysisReports.values()).filter(
      (report) => report.sessionId === sessionId
    );
  }

  // Clinic operations
  async getAllClinics(): Promise<Clinic[]> {
    return Array.from(this.clinics.values());
  }

  async getClinic(id: number): Promise<Clinic | undefined> {
    return this.clinics.get(id);
  }

  async getClinicByEmail(email: string): Promise<Clinic | undefined> {
    return Array.from(this.clinics.values()).find(clinic => clinic.email === email);
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const id = this.currentClinicId++;
    const clinic: Clinic = { 
      ...insertClinic, 
      id,
      registrationStatus: "pending",
      paymentStatus: "pending",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clinics.set(id, clinic);
    return clinic;
  }

  async updateClinic(id: number, updates: Partial<Clinic>): Promise<Clinic> {
    const clinic = this.clinics.get(id);
    if (!clinic) {
      throw new Error("Clinic not found");
    }
    
    const updatedClinic: Clinic = { 
      ...clinic, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.clinics.set(id, updatedClinic);
    return updatedClinic;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAdminStats(): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    pendingAppointments: number;
    todayAppointments: number;
    monthlyGrowth: number;
  }> {
    const users = Array.from(this.users.values());
    const appointments = Array.from(this.appointments.values());
    const doctors = Array.from(this.doctors.values());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= today && aptDate < tomorrow;
    });

    return {
      totalPatients: users.filter(u => u.role === 'patient').length,
      totalDoctors: doctors.length,
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
      todayAppointments: todayAppointments.length,
      monthlyGrowth: Math.floor(Math.random() * 20) + 5 // Mock growth percentage
    };
  }
  
  // Analysis Tracking operations
  async createAnalysisTracking(insertAnalysis: InsertAnalysisTracking): Promise<AnalysisTracking> {
    const id = this.currentAnalysisTrackingId++;
    const analysis: AnalysisTracking = { 
      ...insertAnalysis, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.analysisTrackingData.set(id, analysis);
    return analysis;
  }

  async getAnalysisTrackingByTenant(tenantId?: number): Promise<AnalysisTracking[]> {
    const allAnalyses = Array.from(this.analysisTrackingData.values());
    if (tenantId) {
      return allAnalyses.filter(analysis => analysis.tenantId === tenantId);
    }
    return allAnalyses;
  }

  async getAnalysisTrackingStats(tenantId?: number): Promise<{
    faceAnalyses: number;
    hairAnalyses: number;
    lipsAnalyses: number;
    skinAnalyses: number;
    hairExtensionAnalyses: number;
    totalAnalyses: number;
    growthPercentage: number;
  }> {
    const analyses = await this.getAnalysisTrackingByTenant(tenantId);
    
    const faceAnalyses = analyses.filter(a => a.analysisType === 'face').length;
    const hairAnalyses = analyses.filter(a => a.analysisType === 'hair').length;
    const lipsAnalyses = analyses.filter(a => a.analysisType === 'lips').length;
    const skinAnalyses = analyses.filter(a => a.analysisType === 'skin').length;
    const hairExtensionAnalyses = analyses.filter(a => a.analysisType === 'hair_extension').length;
    
    const totalAnalyses = analyses.length;
    
    // Calculate growth percentage (mock for now - compare with last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAnalyses = analyses.filter(a => new Date(a.createdAt) > thirtyDaysAgo).length;
    const olderAnalyses = totalAnalyses - recentAnalyses;
    const growthPercentage = olderAnalyses > 0 ? Math.round((recentAnalyses - olderAnalyses) / olderAnalyses * 100) : 100;
    
    return {
      faceAnalyses,
      hairAnalyses,
      lipsAnalyses,
      skinAnalyses,
      hairExtensionAnalyses,
      totalAnalyses,
      growthPercentage
    };
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage if DATABASE_URL is available, otherwise fall back to MemStorage
let storage: IStorage;

if (process.env.DATABASE_URL) {
  try {
    storage = new DatabaseStorage();
    console.log("✅ Using PostgreSQL database for persistent storage");
  } catch (error) {
    console.error("❌ Failed to initialize database storage, falling back to memory storage:", error);
    storage = new MemStorage();
  }
} else {
  console.log("⚠️ No DATABASE_URL found, using in-memory storage (data will not persist)");
  storage = new MemStorage();
}

export { storage };
