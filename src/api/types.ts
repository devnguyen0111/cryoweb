/**
 * Base API Response Types
 */
export interface BaseResponse<T = any> {
  code?: number;
  systemCode?: string | null;
  message?: string | null;
  data?: T;
  timestamp?: string;
  success?: boolean;
}

export interface DynamicResponse<T = any> extends BaseResponse<T[]> {
  metaData?: {
    page?: number;
    size?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * User Types
 */
export interface User {
  id: string;
  userName?: string | null;
  age?: number | null;
  email?: string;
  phone?: string | null;
  location?: string | null;
  country?: string | null;
  image?: string | null;
  status?: boolean;
  emailVerified?: boolean;
  roleId?: string;
  roleName?: string;
  createdAt?: string;
  updatedAt?: string | null;
  doctorSpecialization?: string | null;
}

/**
 * Auth Types
 */
export interface LoginRequest {
  email: string;
  password: string;
  mobile?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  emailVerified: boolean;
}

/**
 * Login Response - Extends BaseResponse with additional fields
 */
export interface LoginResponse extends BaseResponse<AuthResponse> {
  isBanned?: boolean;
  requiresVerification?: boolean;
  bannedAccountId?: number;
}

/**
 * Appointment Types
 */
export type AppointmentType =
  | "consultation"
  | "procedure"
  | "follow-up"
  | "testing"
  | "other";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export interface Appointment {
  id: string;
  patientId?: string;
  doctorId?: string;
  type?: AppointmentType;
  title?: string;
  description?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  slotId?: string;
  treatmentCycleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  type: AppointmentType;
  title: string;
  description?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  slotId?: string;
  treatmentCycleId?: string;
  reason?: string;
  instructions?: string;
}

export interface UpdateAppointmentRequest {
  type?: AppointmentType;
  title?: string;
  description?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  slotId?: string;
  reason?: string;
  instructions?: string;
}

export interface AppointmentListQuery {
  TreatmentCycleId?: string;
  DoctorId?: string;
  SlotId?: string;
  Type?: AppointmentType;
  Status?: AppointmentStatus;
  AppointmentDateFrom?: string;
  AppointmentDateTo?: string;
  SearchTerm?: string;
  Page?: number;
  Size?: number;
  Sort?: string;
  Order?: "asc" | "desc";
}

/**
 * Patient Types
 */
export interface Patient {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientListQuery {
  SearchTerm?: string;
  Page?: number;
  Size?: number;
  Sort?: string;
  Order?: "asc" | "desc";
}

/**
 * Sample Types
 */
export interface LabSample {
  id: string;
  patientId?: string;
  sampleType?: string;
  collectionDate?: string;
  status?: string;
  createdAt?: string;
}

export interface SampleListQuery {
  PatientId?: string;
  Status?: string;
  SearchTerm?: string;
  Page?: number;
  Size?: number;
}

/**
 * Doctor Types
 */
export interface Doctor {
  id: string;
  accountId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  licenseNumber?: string;
  experience?: number;
  qualifications?: string[];
  bio?: string;
  status?: "active" | "inactive" | "on-leave";
  image?: string;
  rating?: number;
  consultationFee?: number;
  badgeId?: string;
  yearsOfExperience?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorListQuery {
  Page?: number;
  Size?: number;
  SearchTerm?: string;
  Specialty?: string;
  Status?: string;
  Sort?: string;
  Order?: "asc" | "desc";
  AccountId?: string;
}

export interface DoctorStatistics {
  totalDoctors?: number;
  activeDoctors?: number;
  inactiveDoctors?: number;
  totalSchedulesToday?: number;
  totalSlotsToday?: number;
  bookedSlotsToday?: number;
  availableSlotsToday?: number;
  specialties?: SpecialtyStatistic[];
}

export interface SpecialtyStatistic {
  specialty?: string;
  doctorCount?: number;
  averageExperience?: number;
}

/**
 * Service Types
 */
export interface Service {
  id: string;
  name?: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  price?: number;
  duration?: number;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCategory {
  id: string;
  name?: string;
  description?: string;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceListQuery {
  Page?: number;
  Size?: number;
  CategoryId?: string;
  SearchTerm?: string;
  Status?: string;
  Sort?: string;
  Order?: "asc" | "desc";
}

export interface ServiceRequest {
  id: string;
  patientId?: string;
  appointmentId?: string;
  serviceId?: string;
  status?: string;
  requestedDate?: string;
  scheduledDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequestListQuery {
  Page?: number;
  Size?: number;
  PatientId?: string;
  ServiceId?: string;
  Status?: string;
  SearchTerm?: string;
}

/**
 * Slot Types
 */
export interface TimeSlot {
  id: string;
  doctorScheduleId?: string;
  scheduleId?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  isBooked?: boolean;
  bookingStatus?: "available" | "booked" | "blocked" | "cancelled";
  patientId?: string;
  appointmentId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SlotListQuery {
  Page?: number;
  Size?: number;
  ScheduleId?: string;
  DoctorId?: string;
  Date?: string;
  StartDate?: string;
  EndDate?: string;
  BookingStatus?: string;
  SearchTerm?: string;
}

/**
 * Doctor Schedule Types
 */
export interface DoctorSchedule {
  id: string;
  doctorId?: string;
  slotId?: string;
  slot?: TimeSlot;
  workDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorScheduleListQuery {
  Page?: number;
  Size?: number;
  DoctorId?: string;
  WorkDate?: string;
  StartDate?: string;
  EndDate?: string;
  IsAvailable?: boolean;
}

/**
 * Treatment Cycle Types
 */
export interface TreatmentCycle {
  id: string;
  patientId?: string;
  treatmentType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentCycleListQuery {
  Page?: number;
  Size?: number;
  PatientId?: string;
  Status?: string;
  SearchTerm?: string;
}

export interface StartTreatmentCycleRequest {
  startDate?: string;
  notes?: string;
}

export interface CompleteTreatmentCycleRequest {
  endDate?: string;
  outcome: string;
  notes?: string;
}

export interface CancelTreatmentCycleRequest {
  reason: string;
  notes?: string;
}

/**
 * Treatment Types
 */
export type TreatmentTypeEnum = "IVF" | "IUI" | "Consultation" | "Other";

export type TreatmentStatusEnum =
  | "Planned"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "OnHold"
  | "Failed";

export interface Treatment {
  id: string;
  patientId?: string;
  doctorId?: string;
  treatmentName?: string;
  treatmentType?: TreatmentTypeEnum;
  status?: TreatmentStatusEnum;
  diagnosis?: string;
  goals?: string;
  notes?: string;
  estimatedCost?: number;
  actualCost?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentListQuery {
  Page?: number;
  Size?: number;
  PatientId?: string;
  DoctorId?: string;
  TreatmentType?: TreatmentTypeEnum;
  Status?: TreatmentStatusEnum;
  SearchTerm?: string;
  StartDateFrom?: string;
  StartDateTo?: string;
  Sort?: string;
  Order?: "asc" | "desc";
}

/**
 * Relationship Types
 */
export interface Relationship {
  id: string;
  patientId?: string;
  relatedPatientId?: string;
  relationshipType?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Additional Auth Types
 */
export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  phone?: string;
  age?: number;
  location?: string;
  country?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

/**
 * Service Request Details Types
 */
export interface ServiceRequestDetails {
  id: string;
  serviceRequestId?: string;
  serviceId?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequestDetailsListQuery {
  Page?: number;
  Size?: number;
  ServiceRequestId?: string;
  ServiceId?: string;
  SearchTerm?: string;
}

/**
 * Cycle Document Types
 */
export interface CycleDocument {
  id: string;
  treatmentCycleId?: string;
  fileName?: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  title?: string;
  description?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadCycleDocumentRequest {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  title?: string;
  description?: string;
  category?: string;
}
