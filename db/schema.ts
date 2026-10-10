import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema mirrors the domain classes in the supplied class diagram and extends
// them with authentication, billing, notifications and audit logging required by SRS.
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text("role", { enum: ["PATIENT", "DOCTOR"] }).notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  createdAt: text("created_at").notNull(),
});

export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id),
  patientCode: text("patient_code").notNull().unique(),
  insuranceNumber: text("insurance_number"),
  insuranceLevel: integer("insurance_level").notNull().default(0),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  address: text("address").notNull(),
  bloodType: text("blood_type").notNull(),
  emergencyContact: text("emergency_contact").notNull(),
});

export const doctors = sqliteTable("doctors", {
  id: text("id").primaryKey(),
  userId: text("user_id").unique().references(() => users.id),
  doctorCode: text("doctor_code").notNull().unique(),
  fullName: text("full_name").notNull(),
  specialty: text("specialty").notNull(),
  degree: text("degree").notNull(),
  room: text("room").notNull(),
  consultationFee: integer("consultation_fee").notNull(),
  avatarColor: text("avatar_color").notNull(),
  availableStatus: text("available_status").notNull().default("AVAILABLE"),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  appointmentCode: text("appointment_code").notNull().unique(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").notNull().references(() => doctors.id),
  specialty: text("specialty").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  reason: text("reason").notNull(),
  insuranceStatus: text("insurance_status").notNull(),
  insuranceCoverage: integer("insurance_coverage").notNull().default(0),
  feeOriginal: integer("fee_original").notNull(),
  feePayable: integer("fee_payable").notNull(),
  paymentStatus: text("payment_status").notNull(),
  paymentMethod: text("payment_method"),
  status: text("status").notNull(),
  queueToken: text("queue_token"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const medicalRecords = sqliteTable("medical_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").notNull().references(() => doctors.id),
  appointmentId: text("appointment_id").notNull().unique().references(() => appointments.id),
  diagnosis: text("diagnosis").notNull(),
  notes: text("notes").notNull(),
  visitDate: text("visit_date").notNull(),
});

export const prescriptions = sqliteTable("prescriptions", {
  id: text("id").primaryKey(),
  recordId: text("record_id").notNull().references(() => medicalRecords.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").notNull().references(() => doctors.id),
  appointmentId: text("appointment_id").notNull().references(() => appointments.id),
  status: text("status").notNull(),
  reExamDate: text("re_exam_date"),
  createdAt: text("created_at").notNull(),
});

export const prescriptionItems = sqliteTable("prescription_items", {
  id: text("id").primaryKey(),
  prescriptionId: text("prescription_id").notNull().references(() => prescriptions.id),
  medicineName: text("medicine_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  durationDays: integer("duration_days").notNull(),
  instruction: text("instruction").notNull(),
  unitPrice: integer("unit_price").notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id").notNull().unique().references(() => appointments.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  serviceFee: integer("service_fee").notNull(),
  medicineFee: integer("medicine_fee").notNull().default(0),
  insuranceDiscount: integer("insurance_discount").notNull().default(0),
  total: integer("total").notNull(),
  status: text("status").notNull(),
  paymentMethod: text("payment_method"),
  paidAt: text("paid_at"),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: text("expires_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: text("details").notNull(),
  createdAt: text("created_at").notNull(),
});
