export type Role = "PATIENT" | "DOCTOR";

export type AppointmentStatus =
  | "INITIATED"
  | "INSURANCE_VERIFIED"
  | "CONFIRMED"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "CANCELLED";

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  phone: string;
}

export interface Doctor {
  id: string;
  doctorCode: string;
  fullName: string;
  specialty: string;
  degree: string;
  room: string;
  consultationFee: number;
  avatarColor: string;
  availableStatus: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string;
  insuranceNumber?: string | null;
  insuranceLevel: number;
  dateOfBirth: string;
  gender: string;
  address: string;
  bloodType: string;
  emergencyContact: string;
}

export interface Appointment {
  id: string;
  appointmentCode: string;
  scheduledDate: string;
  scheduledTime: string;
  specialty: string;
  reason: string;
  insuranceStatus: string;
  insuranceCoverage: number;
  feeOriginal: number;
  feePayable: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  status: AppointmentStatus;
  queueToken?: string | null;
  doctorId: string;
  doctorName: string;
  doctorCode: string;
  room: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientPhone: string;
}

export interface PrescriptionItem {
  id?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instruction: string;
  unitPrice: number;
}

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  notes: string;
  visitDate: string;
  prescriptionId?: string | null;
  reExamDate?: string | null;
  prescriptionStatus?: string | null;
  items: PrescriptionItem[];
}

export interface Invoice {
  id: string;
  appointmentId: string;
  appointmentCode: string;
  serviceFee: number;
  medicineFee: number;
  insuranceDiscount: number;
  total: number;
  status: string;
  paymentMethod?: string | null;
  paidAt?: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface BootstrapData {
  user: UserProfile;
  profile: Patient | Doctor;
  doctors: Doctor[];
  appointments: Appointment[];
  records: MedicalRecord[];
  invoices: Invoice[];
  notifications: NotificationItem[];
}
