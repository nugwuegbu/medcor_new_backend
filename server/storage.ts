import { users, doctors, appointments, chatMessages, type Doctor, type InsertDoctor, type Appointment, type InsertAppointment, type ChatMessage, type InsertChatMessage, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByOAuthId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  linkOAuthAccount(userId: number, provider: string, providerId: string): Promise<void>;
  
  getAllDoctors(): Promise<Doctor[]>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Video methods removed - adana01 system discontinued
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private appointments: Map<number, Appointment>;
  private chatMessages: Map<number, ChatMessage>;
  // private videos removed - adana01 system discontinued
  private currentUserId: number;
  private currentDoctorId: number;
  private currentAppointmentId: number;
  private currentChatMessageId: number;

  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.appointments = new Map();
    this.chatMessages = new Map();
    // this.videos removed - adana01 system discontinued
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
      email: insertUser.email || null,
      phoneNumber: insertUser.phoneNumber || null,
      name: insertUser.name || null,
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

  // Video operations
  // Video methods removed - adana01 system discontinued
}

// Database Storage with PostgreSQL persistence
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined; // Not implemented
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return undefined; // Not implemented
  }

  async getUserByOAuthId(provider: string, providerId: string): Promise<User | undefined> {
    return undefined; // Not implemented  
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error("Not implemented");
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    throw new Error("Not implemented");
  }

  async updateUserLastLogin(id: number): Promise<void> {
    // Not implemented
  }

  async linkOAuthAccount(userId: number, provider: string, providerId: string): Promise<void> {
    // Not implemented
  }

  // Doctor operations  
  async getAllDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors);
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db.insert(doctors).values(doctor).returning();
    return newDoctor;
  }

  // Appointment operations
  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  // Chat message operations
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  // Video operations removed - adana01 system discontinued
}

export const storage = new DatabaseStorage();
