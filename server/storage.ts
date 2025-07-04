import { doctors, appointments, chatMessages, type Doctor, type InsertDoctor, type Appointment, type InsertAppointment, type ChatMessage, type InsertChatMessage, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllDoctors(): Promise<Doctor[]>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private appointments: Map<number, Appointment>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentDoctorId: number;
  private currentAppointmentId: number;
  private currentChatMessageId: number;

  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.appointments = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentDoctorId = 1;
    this.currentAppointmentId = 1;
    this.currentChatMessageId = 1;
    
    this.seedDoctors();
  }

  private seedDoctors() {
    const seedDoctors: InsertDoctor[] = [
      {
        name: "Dr. Sarah Johnson",
        specialty: "Cardiology",
        experience: 15,
        education: "MD from Johns Hopkins University",
        photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Johnson is a board-certified cardiologist with over 15 years of experience treating heart conditions.",
        avatarId: "heygen_avatar_sarah_cardio",
        available: true,
      },
      {
        name: "Dr. Michael Chen",
        specialty: "Orthopedics",
        experience: 12,
        education: "MD from Harvard Medical School",
        photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Chen specializes in sports medicine and joint replacement surgery.",
        avatarId: "heygen_avatar_michael_ortho",
        available: true,
      },
      {
        name: "Dr. Emily Rodriguez",
        specialty: "Pediatrics",
        experience: 8,
        education: "MD from Stanford University",
        photo: "https://images.unsplash.com/photo-1594824388853-2c5cb2d2f40e?w=300&h=300&fit=crop&crop=face",
        bio: "Dr. Rodriguez is passionate about providing comprehensive care for children and adolescents.",
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
        available: doctor.available ?? true
      };
      this.doctors.set(id, fullDoctor);
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      preferredLanguage: insertUser.preferredLanguage || "en",
      faceId: null,
      personId: null,
      lastFaceLogin: null,
      faceLoginEnabled: false
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
      available: insertDoctor.available !== undefined ? insertDoctor.available : true
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
}

export const storage = new MemStorage();
