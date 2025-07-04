import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  faceId: text("face_id"), // Face recognition ID
  personId: text("person_id"), // Azure Face API person ID
  lastFaceLogin: timestamp("last_face_login"),
  faceLoginEnabled: boolean("face_login_enabled").notNull().default(false),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  experience: integer("experience").notNull(),
  education: text("education").notNull(),
  photo: text("photo").notNull(),
  bio: text("bio").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  preferredLanguage: true,
});

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
