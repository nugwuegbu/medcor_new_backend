import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  name: text("name").notNull(),
  profilePicture: text("profile_picture"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  faceId: text("face_id"), // Face recognition ID
  personId: text("person_id"), // Azure Face API person ID
  lastFaceLogin: timestamp("last_face_login"),
  faceLoginEnabled: boolean("face_login_enabled").notNull().default(false),
  faceRegistered: boolean("face_registered").notNull().default(false),
  oauthProvider: text("oauth_provider"), // google, apple, facebook
  oauthProviderId: text("oauth_provider_id"),
  lastLogin: timestamp("last_login"),
  isNewUser: boolean("is_new_user").notNull().default(true),
  role: text("role").notNull().default("patient"), // patient, doctor, admin, clinic, superadmin
  tenantId: integer("tenant_id").references(() => tenants.id),
  isActive: boolean("is_active").notNull().default(true),
  emailVerified: boolean("email_verified").notNull().default(false),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  experience: integer("experience").notNull(),
  education: text("education").notNull(),
  photo: text("photo").notNull(),
  bio: text("bio").notNull(),
  description: text("description"), // Short hover description for HeyGen
  avatarId: text("avatar_id"), // HeyGen avatar ID for this doctor
  available: boolean("available").notNull().default(true),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone").notNull(),
  doctorId: integer("doctor_id").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id"), // Link to recognized user
  message: text("message").notNull(),
  response: text("response").notNull(),
  avatarResponse: json("avatar_response"), // HeyGen avatar response data
  language: text("language").notNull().default("en"),
  speakerType: text("speaker_type").notNull().default("nurse"), // "nurse" or "doctor"
  doctorId: integer("doctor_id"), // If speaking with a specific doctor
  faceRecognitionData: json("face_recognition_data"), // Face recognition results
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysisTracking = pgTable("analysis_tracking", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  patientName: text("patient_name").notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  analysisType: text("analysis_type").notNull(), // face, hair, lips, skin, hair_extension
  resultSummary: text("result_summary").notNull(),
  recommendations: text("recommendations"),
  analysisData: json("analysis_data"), // Detailed analysis data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const faceRecognitionLogs = pgTable("face_recognition_logs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id"),
  faceId: text("face_id").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  detectedLanguage: text("detected_language"),
  imageHash: text("image_hash"), // For privacy - store hash not image
  recognitionStatus: text("recognition_status").notNull(), // "recognized", "new_face", "failed"
  createdAt: timestamp("created_at").defaultNow(),
});

export const faceAnalysisReports = pgTable("face_analysis_reports", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone").notNull(),
  patientJob: text("patient_job").notNull(),
  analysisResult: json("analysis_result").notNull(),
  pdfPath: text("pdf_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const hairAnalysisReports = pgTable("hair_analysis_reports", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id"), // Link to user if logged in
  hairType: text("hair_type").notNull(),
  hairCondition: text("hair_condition").notNull(),
  scalpHealth: text("scalp_health").notNull(),
  recommendations: json("recommendations").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  analysisResult: json("analysis_result").notNull(), // Full YCE response
  imageHash: text("image_hash"), // For privacy - store hash not image
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  clinicName: text("clinic_name").notNull(),
  clinicType: text("clinic_type").notNull(),
  licenseNumber: text("license_number").notNull(),
  establishedYear: text("established_year").notNull(),
  website: text("website"),
  description: text("description").notNull(),
  contactPersonName: text("contact_person_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull(),
  specializations: json("specializations").notNull(), // Array of strings
  numberOfDoctors: text("number_of_doctors").notNull(),
  numberOfStaff: text("number_of_staff").notNull(),
  patientsPerMonth: text("patients_per_month").notNull(),
  selectedPlan: text("selected_plan").notNull(), // starter, professional, enterprise
  registrationStatus: text("registration_status").notNull().default("pending"), // pending, approved, rejected
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  agreeToTerms: boolean("agree_to_terms").notNull().default(false),
  agreeToPrivacy: boolean("agree_to_privacy").notNull().default(false),
  subscribeToUpdates: boolean("subscribe_to_updates").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Multi-tenant tables
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  domain: text("domain"),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  settings: json("settings").notNull().default({}),
  branding: json("branding").notNull().default({}),
  features: json("features").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  plan: text("plan").notNull(), // basic, professional, enterprise
  status: text("status").notNull().default("active"), // active, trial, cancelled, expired
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, yearly
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date"),
  cancelledAt: timestamp("cancelled_at"),
  metadata: json("metadata").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertFaceAnalysisReportSchema = createInsertSchema(faceAnalysisReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHairAnalysisReportSchema = createInsertSchema(hairAnalysisReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  registrationStatus: true,
  paymentStatus: true,
  isActive: true,
});

// Tenant schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisTrackingSchema = createInsertSchema(analysisTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
  role: z.enum(["patient", "doctor", "clinic", "admin"]).default("patient"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type FaceAnalysisReport = typeof faceAnalysisReports.$inferSelect;
export type InsertFaceAnalysisReport = z.infer<typeof insertFaceAnalysisReportSchema>;
export type HairAnalysisReport = typeof hairAnalysisReports.$inferSelect;
export type InsertHairAnalysisReport = z.infer<typeof insertHairAnalysisReportSchema>;
export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type AnalysisTracking = typeof analysisTracking.$inferSelect;
export type InsertAnalysisTracking = z.infer<typeof insertAnalysisTrackingSchema>;

export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;

// JWT payload interface
export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}


