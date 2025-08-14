import { users, doctors, appointments, chatMessages, faceAnalysisReports, hairAnalysisReports, clinics, analysisTracking, type User, type InsertUser, type Doctor, type InsertDoctor, type Appointment, type InsertAppointment, type ChatMessage, type InsertChatMessage, type FaceAnalysisReport, type InsertFaceAnalysisReport, type HairAnalysisReport, type InsertHairAnalysisReport, type Clinic, type InsertClinic, type AnalysisTracking, type InsertAnalysisTracking } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { IStorage } from "./storage";
import bcrypt from "bcryptjs";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByOAuthId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(
        eq(users.oauthProvider, provider),
        eq(users.oauthProviderId, providerId)
      ));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  async linkOAuthAccount(userId: number, provider: string, providerId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        oauthProvider: provider,
        oauthProviderId: providerId 
      })
      .where(eq(users.id, userId));
  }

  async verifyUserPassword(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !user.password) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors);
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor || undefined;
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const [doctor] = await db
      .insert(doctors)
      .values(insertDoctor)
      .returning();
    return doctor;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async getAppointmentsByUser(userId: number, role: string): Promise<Appointment[]> {
    if (role === 'doctor') {
      return await db.select().from(appointments).where(eq(appointments.doctorId, userId));
    } else {
      return await db.select().from(appointments).where(eq(appointments.patientId, userId));
    }
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async createFaceAnalysisReport(insertReport: InsertFaceAnalysisReport): Promise<FaceAnalysisReport> {
    const [report] = await db
      .insert(faceAnalysisReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async createHairAnalysisReport(insertReport: InsertHairAnalysisReport): Promise<HairAnalysisReport> {
    const [report] = await db
      .insert(hairAnalysisReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getHairAnalysisReports(sessionId: string): Promise<HairAnalysisReport[]> {
    return await db.select().from(hairAnalysisReports).where(eq(hairAnalysisReports.sessionId, sessionId));
  }

  async getAllClinics(): Promise<Clinic[]> {
    return await db.select().from(clinics);
  }

  async getClinic(id: number): Promise<Clinic | undefined> {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id));
    return clinic || undefined;
  }

  async getClinicByEmail(email: string): Promise<Clinic | undefined> {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.email, email));
    return clinic || undefined;
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const [clinic] = await db
      .insert(clinics)
      .values(insertClinic)
      .returning();
    return clinic;
  }

  async updateClinic(id: number, updates: Partial<Clinic>): Promise<Clinic> {
    const [clinic] = await db
      .update(clinics)
      .set(updates)
      .where(eq(clinics.id, id))
      .returning();
    return clinic;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAdminStats(): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    pendingAppointments: number;
    todayAppointments: number;
    monthlyGrowth: number;
  }> {
    const [patientCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'patient'));

    const [doctorCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(doctors);

    const [appointmentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments);

    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.status, 'pending'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(
        gte(appointments.date, today),
        lte(appointments.date, tomorrow)
      ));

    // Calculate monthly growth (simplified - comparing to last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [lastMonthPatients] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        eq(users.role, 'patient'),
        lte(users.createdAt, lastMonth)
      ));

    const growth = patientCount.count > 0 && lastMonthPatients.count > 0
      ? ((patientCount.count - lastMonthPatients.count) / lastMonthPatients.count) * 100
      : 0;

    return {
      totalPatients: Number(patientCount.count) || 0,
      totalDoctors: Number(doctorCount.count) || 0,
      totalAppointments: Number(appointmentCount.count) || 0,
      pendingAppointments: Number(pendingCount.count) || 0,
      todayAppointments: Number(todayCount.count) || 0,
      monthlyGrowth: Math.round(growth)
    };
  }

  async createAnalysisTracking(insertAnalysis: InsertAnalysisTracking): Promise<AnalysisTracking> {
    const [analysis] = await db
      .insert(analysisTracking)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async getAnalysisTrackingByTenant(tenantId?: number): Promise<AnalysisTracking[]> {
    if (tenantId) {
      return await db.select().from(analysisTracking).where(eq(analysisTracking.tenantId, tenantId));
    }
    return await db.select().from(analysisTracking);
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
    const whereClause = tenantId ? eq(analysisTracking.tenantId, tenantId) : undefined;

    const [faceCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analysisTracking)
      .where(whereClause ? and(eq(analysisTracking.analysisType, 'face'), whereClause) : eq(analysisTracking.analysisType, 'face'));

    const [hairCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analysisTracking)
      .where(whereClause ? and(eq(analysisTracking.analysisType, 'hair'), whereClause) : eq(analysisTracking.analysisType, 'hair'));

    const [lipsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analysisTracking)
      .where(whereClause ? and(eq(analysisTracking.analysisType, 'lips'), whereClause) : eq(analysisTracking.analysisType, 'lips'));

    const [skinCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analysisTracking)
      .where(whereClause ? and(eq(analysisTracking.analysisType, 'skin'), whereClause) : eq(analysisTracking.analysisType, 'skin'));

    const [hairExtCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analysisTracking)
      .where(whereClause ? and(eq(analysisTracking.analysisType, 'hair_extension'), whereClause) : eq(analysisTracking.analysisType, 'hair_extension'));

    const totalAnalyses = Number(faceCount.count) + Number(hairCount.count) + Number(lipsCount.count) + 
                         Number(skinCount.count) + Number(hairExtCount.count);

    // Calculate growth (simplified)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [lastMonthCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analysisTracking)
      .where(whereClause ? and(lte(analysisTracking.createdAt, lastMonth), whereClause) : lte(analysisTracking.createdAt, lastMonth));

    const growth = totalAnalyses > 0 && lastMonthCount.count > 0
      ? ((totalAnalyses - Number(lastMonthCount.count)) / Number(lastMonthCount.count)) * 100
      : 0;

    return {
      faceAnalyses: Number(faceCount.count) || 0,
      hairAnalyses: Number(hairCount.count) || 0,
      lipsAnalyses: Number(lipsCount.count) || 0,
      skinAnalyses: Number(skinCount.count) || 0,
      hairExtensionAnalyses: Number(hairExtCount.count) || 0,
      totalAnalyses,
      growthPercentage: Math.round(growth)
    };
  }
}