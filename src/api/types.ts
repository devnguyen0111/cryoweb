/**
 * TypeScript Type Definitions for CryoFert Backend API
 * Generated for React/Vite Frontend
 */

// ============================================================================
// Base Response Types
// ============================================================================

export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
  systemCode?: string;
}

export interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: T[];
  metaData: {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export interface BaseResponseForLogin<T> extends BaseResponse<T> {
  isBanned: boolean;
  requiresVerification?: boolean;
  bannedAccountId?: number;
}

// Legacy compatibility types for existing code
export interface DynamicResponse<T = any> extends PaginatedResponse<T> {}
export interface PagingMetaData {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
export interface PagingModel {
  pageNumber?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  mobile?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn?: number;
  user: User;
  emailVerified?: boolean;
}

export interface TokenModel {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface EmailVerificationModel {
  email: string;
  verificationCode: string;
}

export interface EmailRequest {
  email: string;
}

// Legacy compatibility
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  emailVerified: boolean;
}

// ============================================================================
// User Types
// ============================================================================

export type UserRole =
  | "Patient"
  | "Doctor"
  | "Admin"
  | "Receptionist"
  | "LaboratoryTechnician";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  phone?: string;
  userName?: string;
  role: UserRole;
  roleName?: string;
  roleId?: string;
  isEmailVerified: boolean;
  emailVerified?: boolean;
  isActive: boolean;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
  age?: number | null;
  location?: string | null;
  country?: string | null;
  image?: string | null;
  doctorSpecialization?: string | null;
}

export interface UserDetailResponse extends User {
  patient?: Patient;
  doctor?: Doctor;
  gender?: boolean; // true for Male, false for Female
  dob?: string; // Date of birth
  totalAppointments?: number | null;
  totalPayments?: number | null;
  totalFeedbacks?: number | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface GetUsersRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  role?: UserRole;
  isActive?: boolean;
}

// ============================================================================
// Patient Types
// ============================================================================

export type Gender = "Male" | "Female" | "Other";

export interface Patient {
  id: string;
  patientCode: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  phoneNumber: string;
  email?: string;
  address?: string;
  bloodType?: string;
  isActive: boolean;
  accountId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientDetailResponse {
  id: string;
  patientCode: string;
  nationalId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phoneNumber?: string;
  email?: string;
  address?: string;
  bloodType?: string;
  isActive?: boolean;
  accountId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Additional fields from details API
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  insurance?: string | null;
  occupation?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  notes?: string | null;
  relationships?: Relationship[];
  treatments?: Treatment[];
  labSamples?: any[];
  appointments?: Appointment[];
  accountInfo?: {
    username: string;
    email: string;
    phone: string;
    address?: string | null;
    isVerified: boolean;
    isActive: boolean;
  };
  treatmentCount?: number;
  labSampleCount?: number;
  relationshipCount?: number;
}

export interface CreatePatientRequest {
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  email?: string;
  address?: string;
  bloodType?: string;
  accountId?: string;
}

export interface UpdatePatientRequest {
  nationalId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phoneNumber?: string;
  email?: string;
  address?: string;
  bloodType?: string;
}

export interface UpdatePatientStatusRequest {
  isActive: boolean;
  reason?: string;
}

export interface GetPatientsRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  gender?: Gender;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PatientSearchResult {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string;
}

export interface PatientStatisticsResponse {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  patientsByGender: Record<Gender, number>;
}

export interface RelatedPatientInfo {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  relationshipType: RelationshipType;
}

// Legacy compatibility
export interface PatientListQuery extends GetPatientsRequest {
  patientCode?: string;
  nationalId?: string;
  fromDate?: string;
  toDate?: string;
}

// ============================================================================
// Doctor Types
// ============================================================================

export interface Doctor {
  id: string;
  badgeId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phoneNumber: string;
  email?: string;
  isActive: boolean;
  accountId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorDetailResponse extends Doctor {
  schedules?: DoctorSchedule[];
  appointments?: Appointment[];
}

export interface CreateDoctorRequest {
  badgeId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phoneNumber: string;
  email?: string;
  accountId: string;
  isActive?: boolean;
}

export interface UpdateDoctorRequest {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

export interface GetDoctorsRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  specialty?: string;
  isActive?: boolean;
}

export interface GetAvailableDoctorsRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  specialty?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface DoctorStatisticsResponse {
  totalDoctors: number;
  activeDoctors: number;
  doctorsBySpecialty: Record<string, number>;
}

// Legacy compatibility
export interface DoctorListQuery extends GetDoctorsRequest {}
export interface DoctorStatistics extends DoctorStatisticsResponse {}
export interface DoctorDetail extends DoctorDetailResponse {}

// ============================================================================
// Appointment Types
// ============================================================================

export type AppointmentStatus =
  | "Pending"
  | "Scheduled"
  | "Confirmed"
  | "CheckedIn"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "NoShow";
// Backend enum: Consultation = 1, Ultrasound = 2, BloodTest = 3, OPU = 4, ET = 5, IUI = 6, FollowUp = 7, Injection = 8, Booking = 9
export type AppointmentType =
  | "Consultation"
  | "Ultrasound"
  | "BloodTest"
  | "OPU"
  | "ET"
  | "IUI"
  | "FollowUp"
  | "Injection"
  | "Booking";

export interface Appointment {
  id: string;
  appointmentCode: string;
  patientId: string;
  slotId: string;
  appointmentDate: string; // ISO datetime
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentDetailResponse extends Appointment {
  patient?: Patient;
  slot?: Slot;
  doctors?: AppointmentDoctor[];
}

// Extended appointment detail from /api/appointment/{id}/details endpoint
export interface AppointmentExtendedDetailResponse {
  id: string;
  patientId?: string; // Added: patient ID reference
  treatmentCycleId?: string | null;
  slotId: string;
  type: AppointmentType;
  typeName?: string;
  status: AppointmentStatus;
  statusName?: string;
  appointmentDate: string; // DateOnly format: YYYY-MM-DD
  reason?: string;
  instructions?: string;
  notes?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  isReminderSent?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  medicalRecord?: any | null; // Medical record details if available
  serviceRequests?: any[]; // Service requests associated with this appointment
  treatmentCycle?: any | null; // Treatment cycle details if linked
  slot?: {
    id: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    schedule?: {
      id: string;
      workDate: string;
      location?: string | null;
      doctor?: {
        id: string;
        badgeId: string;
        specialty: string;
        firstName: string;
        lastName: string;
      };
    };
  };
  patient?: Patient | null;
  doctors?: Array<{
    id: string;
    doctorId: string;
    badgeId: string;
    specialty: string;
    firstName: string;
    lastName: string;
    role: string;
    notes?: string | null;
  }>;
  doctorCount?: number;
}

export interface CreateAppointmentRequest {
  patientId: string;
  slotId: string;
  type: AppointmentType; // Backend uses "type" not "appointmentType"
  appointmentDate: string; // DateOnly format: YYYY-MM-DD (not ISO datetime)
  status?: AppointmentStatus; // Default: "Scheduled"
  reason?: string;
  instructions?: string;
  notes?: string;
  treatmentCycleId?: string;
  doctorIds?: string[]; // Array of doctor IDs
  doctorRoles?: string[]; // Array of roles corresponding to doctorIds
  checkInTime?: string; // ISO datetime
  checkOutTime?: string; // ISO datetime
}

export interface UpdateAppointmentRequest {
  slotId?: string;
  appointmentType?: AppointmentType;
  notes?: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
}

export interface CancelAppointmentRequest {
  cancellationReason?: string;
}

export interface GetAppointmentsRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: AppointmentStatus;
  appointmentType?: AppointmentType;
  patientId?: string;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AppointmentSummary {
  id: string;
  appointmentCode: string;
  appointmentDate: string;
  status: AppointmentStatus;
}

// Legacy compatibility
export interface AppointmentListQuery extends GetAppointmentsRequest {
  searchTerm?: string;
  priority?: string;
  treatmentCycleId?: string;
}

export interface AppointmentHistoryQuery {
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

// ============================================================================
// Appointment Doctor Types
// ============================================================================

export interface AppointmentDoctor {
  id: string;
  appointmentId: string;
  doctorId: string;
  role?: string;
  notes?: string;
  createdAt?: string;
}

export interface CreateAppointmentDoctorRequest {
  appointmentId: string;
  doctorId: string;
  role?: string;
  notes?: string;
}

export interface UpdateAppointmentDoctorRequest {
  role?: string;
  notes?: string;
}

export interface GetAppointmentDoctorsRequest {
  pageNumber?: number;
  pageSize?: number;
  appointmentId?: string;
  doctorId?: string;
}

// Legacy compatibility
export interface AppointmentDoctorAssignment extends AppointmentDoctor {}
export interface AppointmentDoctorListQuery
  extends GetAppointmentDoctorsRequest {
  page?: number;
  Page?: number;
  size?: number;
  Size?: number;
  sort?: string;
  Sort?: string;
  order?: "asc" | "desc";
  Order?: "asc" | "desc";
  AppointmentId?: string;
  DoctorId?: string;
  Role?: string;
  SearchTerm?: string;
  FromDate?: string;
  ToDate?: string;
  Status?: string;
}

// ============================================================================
// Doctor Schedule Types
// ============================================================================

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  workDate: string; // ISO date
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorScheduleDetailResponse extends DoctorSchedule {
  doctor?: Doctor;
  slots?: Slot[];
}

export interface CreateDoctorScheduleRequest {
  doctorId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
  notes?: string;
}

export interface UpdateDoctorScheduleRequest {
  workDate?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  notes?: string;
}

export interface GetDoctorSchedulesRequest {
  pageNumber?: number;
  pageSize?: number;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  isAvailable?: boolean;
}

export interface GetBusyScheduleDateRequest {
  doctorId: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BusyScheduleDateResponse {
  dates: string[]; // Array of ISO dates
}

// ============================================================================
// Slot Types
// ============================================================================

export interface Slot {
  id: string;
  doctorScheduleId: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  isBooked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SlotDetailResponse extends Slot {
  schedule?: DoctorSchedule;
  appointment?: Appointment;
}

export interface CreateSlotRequest {
  doctorScheduleId: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
}

export interface UpdateSlotRequest {
  startTime?: string;
  endTime?: string;
  isBooked?: boolean;
}

export interface GetSlotsRequest {
  pageNumber?: number;
  pageSize?: number;
  scheduleId?: string;
  isBooked?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Legacy compatibility
export interface TimeSlot extends Slot {}
export interface SlotListQuery extends GetSlotsRequest {}

// ============================================================================
// Treatment Types
// ============================================================================

export type TreatmentType = "IVF" | "IUI" | "Other" | "Consultation";
export type TreatmentStatus =
  | "Planning"
  | "InProgress"
  | "Completed"
  | "Cancelled";

export interface Treatment {
  id: string;
  treatmentCode: string;
  patientId: string;
  doctorId: string; // Doctor managing this treatment (ERD: 1 Doctor → 0..* Treatment)
  treatmentName?: string;
  treatmentType: TreatmentType;
  status: TreatmentStatus;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  diagnosis?: string;
  goals?: string;
  notes?: string;
  estimatedCost?: number;
  actualCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentDetailResponseModel extends Treatment {
  patient?: Patient;
  cycles?: TreatmentCycle[];
}

export interface TreatmentCreateUpdateRequest {
  patientId: string;
  doctorId: string; // Doctor managing this treatment (ERD: 1 Doctor → 0..* Treatment)
  treatmentType: TreatmentType;
  startDate?: string;
  notes?: string;
}

export interface GetTreatmentsRequest {
  pageNumber?: number;
  pageSize?: number;
  treatmentType?: TreatmentType;
  status?: TreatmentStatus;
  patientId?: string;
  doctorId?: string; // Filter treatments by managing doctor
}

// Legacy compatibility
export interface TreatmentListQuery extends GetTreatmentsRequest {}

// ============================================================================
// Treatment Cycle Types - Timeline Based System
// ============================================================================

// IVF Timeline Steps (7 steps)
export type IVFStep =
  | "step0_pre_cycle_prep" // Pre-Cycle Preparation (IVF_PreCyclePreparation)
  | "step1_stimulation" // Controlled Ovarian Stimulation (IVF_StimulationStart)
  | "step2_monitoring" // Mid-Stimulation Monitoring (IVF_Monitoring)
  | "step3_trigger" // Ovulation Trigger (IVF_Trigger)
  | "step4_opu" // Oocyte Pick-Up (OPU) (IVF_OPU)
  | "step5_fertilization" // Fertilization/Lab (IVF_Fertilization)
  | "step6_embryo_culture" // Embryo Culture (IVF_EmbryoCulture)
  | "step7_embryo_transfer"; // Embryo Transfer (IVF_EmbryoTransfer)

// IUI Timeline Steps (7 steps matching backend TreatmentStepType enum)
export type IUIStep =
  | "step0_pre_cycle_prep" // Pre-Cycle Preparation (IUI_PreCyclePreparation)
  | "step1_day2_3_assessment" // Day 2-3 Assessment (IUI_Day2_3_Assessment)
  | "step2_follicle_monitoring" // Day 7-10 Follicle Monitoring (IUI_Day7_10_FollicleMonitoring)
  | "step3_trigger" // Day 10-12 Trigger (IUI_Day10_12_Trigger)
  | "step4_iui_procedure" // IUI Procedure (IUI_Procedure)
  | "step5_post_iui" // Post-IUI Monitoring (IUI_PostIUI)
  | "step6_beta_hcg"; // Beta HCG Test (IUI_BetaHCGTest)

export type TreatmentCycleStatus =
  | "Planning" // Not started (legacy)
  | "Planned" // Planned (1)
  | "InProgress" // In treatment (2)
  | "Completed" // Completed (3)
  | "Cancelled" // Cancelled (4)
  | "OnHold" // On hold (5)
  | "Failed" // Failed (6)
  | "Scheduled" // Scheduled (7)
  | 1 // Planned
  | 2 // InProgress
  | 3 // Completed
  | 4 // Cancelled
  | 5 // OnHold
  | 6 // Failed
  | 7; // Scheduled

// Helper function to normalize status (convert number to string)
export function normalizeTreatmentCycleStatus(
  status: TreatmentCycleStatus | number | string | undefined | null
):
  | "Planned"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "OnHold"
  | "Failed"
  | "Scheduled"
  | "Planning"
  | null {
  if (status === null || status === undefined) return null;

  // If already a string, return as is (but ensure it's a valid status)
  if (typeof status === "string") {
    const validStatuses = [
      "Planned",
      "InProgress",
      "Completed",
      "Cancelled",
      "OnHold",
      "Failed",
      "Scheduled",
      "Planning",
    ];
    if (validStatuses.includes(status)) {
      return status as any;
    }
    return null;
  }

  // If number, convert to string
  if (typeof status === "number") {
    const statusMap: Record<number, string> = {
      1: "Planned",
      2: "InProgress",
      3: "Completed",
      4: "Cancelled",
      5: "OnHold",
      6: "Failed",
      7: "Scheduled",
    };
    return (statusMap[status] as any) || null;
  }

  return null;
}

export interface TreatmentCycle {
  id: string;
  treatmentId: string;
  patientId?: string;
  doctorId?: string;
  cycleNumber: number;
  cycleName?: string; // Cycle name (e.g., "IUI Cycle 1")
  orderIndex?: number; // Cycle order
  stepType?: number | string; // Step type (can be number or string enum like "IUI_PreCyclePreparation")
  expectedDurationDays?: number; // Expected number of days
  treatmentType?: "IUI" | "IVF"; // Treatment type
  startDate?: string; // ISO date
  expectedEndDate?: string; // ISO date
  actualEndDate?: string; // ISO date
  endDate?: string; // Alias for actualEndDate
  status: TreatmentCycleStatus;
  protocol?: string; // Protocol name (e.g., "Standard IUI Protocol")
  cost?: number | null; // Cost

  // Timeline tracking
  currentStep?: IVFStep | IUIStep; // Current step in timeline
  completedSteps?: (IVFStep | IUIStep)[]; // Completed steps
  stepDates?: Record<string, string>; // Date of each step execution

  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentCycleDetailResponseModel extends TreatmentCycle {
  treatment?: Treatment;
  samples?: LabSample[];
  appointments?: AppointmentSummary[];
}

export interface CreateTreatmentCycleRequest {
  treatmentId: string;
  cycleName: string;
  cycleNumber: number;
  startDate?: string;
  endDate?: string;
  expectedEndDate?: string;
  protocol?: string;
  notes?: string;
  cost?: number;
  // Timeline fields (optional, can be set after creation)
  currentStep?: IVFStep | IUIStep;
  completedSteps?: (IVFStep | IUIStep)[];
  stepDates?: Record<string, string>;
}

export interface UpdateTreatmentCycleRequest {
  cycleName?: string;
  cycleNumber?: number;
  startDate?: string;
  endDate?: string;
  status?: TreatmentCycleStatus;
  protocol?: string;
  notes?: string;
  cost?: number;
  isAdminOverride?: boolean;
  // Legacy fields for backward compatibility
  expectedEndDate?: string;
  currentStep?: IVFStep | IUIStep;
  completedSteps?: (IVFStep | IUIStep)[];
  stepDates?: Record<string, string>;
}

export interface StartTreatmentCycleRequest {
  startDate: string;
  notes?: string;
}

export interface CompleteTreatmentCycleRequest {
  endDate: string;
  outcome?: string;
  notes?: string;
}

export interface CancelTreatmentCycleRequest {
  reason?: string;
  notes?: string;
}

export interface UpdateTreatmentCycleStatusRequest {
  TreatmentId: string;
  CycleNumber: number;
  Status: TreatmentCycleStatus;
  Notes?: string;
}

export interface GetTreatmentCyclesRequest {
  pageNumber?: number;
  pageSize?: number;
  Page?: number; // Backend uses Page/Size
  Size?: number;
  TreatmentId?: string;
  treatmentId?: string;
  PatientId?: string;
  patientId?: string; // Filter by patient
  DoctorId?: string;
  doctorId?: string; // Filter by doctor (Backend supports this)
  Status?: TreatmentCycleStatus;
  status?: TreatmentCycleStatus;
  FromDate?: string; // Filter by start date range
  ToDate?: string;
  startDateFrom?: string; // Legacy support
  startDateTo?: string;
  SearchTerm?: string;
  searchTerm?: string;
  Sort?: string;
  Order?: string;
}

export interface AddCycleSampleRequest {
  sampleCode: string;
  sampleType: string;
  collectionDate: string; // ISO date
  notes?: string;
}

export interface AddCycleAppointmentRequest {
  appointmentDate: string; // Date format: "YYYY-MM-DD"
  type: string;
  reason?: string;
  instructions?: string;
  notes?: string;
  slotId?: string;
}

export interface TreatmentCycleBillingResponse {
  treatmentCycleId: string;
  estimatedCost: number;
  totalPaid: number;
  outstanding: number;
  items: Array<{
    description: string;
    amount: number;
    date: string; // ISO date
    reference: string;
  }>;
}

export interface DocumentSummary {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  uploadDate: string; // ISO date
}

export interface AddCycleDocumentRequest {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  title?: string;
  description?: string;
  category?: string;
}

// Legacy type for backward compatibility
export interface UploadCycleDocumentRequest {
  fileId: string;
  description?: string;
}

// ============================================================================
// Treatment IVF Types
// ============================================================================

export type IVFCycleStatus =
  | "Planning"
  | "Stimulation"
  | "Retrieval"
  | "Fertilization"
  | "Transfer"
  | "Completed"
  | "Cancelled";

export interface TreatmentIVF {
  id: string;
  treatmentId: string;
  cycleStatus: IVFCycleStatus;
  stimulationProtocol?: string;
  retrievalDate?: string;
  fertilizationDate?: string;
  transferDate?: string;
  notes?: string;
}

export interface TreatmentIVFCreateUpdateRequest {
  treatmentId: string;
  cycleStatus?: IVFCycleStatus;
  stimulationProtocol?: string;
  retrievalDate?: string;
  fertilizationDate?: string;
  transferDate?: string;
  notes?: string;
}

// ============================================================================
// Treatment IUI Types
// ============================================================================

export type IUICycleStatus =
  | "Planning"
  | "Monitoring"
  | "Insemination"
  | "Completed"
  | "Cancelled";

export interface TreatmentIUI {
  id: string;
  treatmentId: string;
  cycleStatus: IUICycleStatus;
  inseminationDate?: string;
  notes?: string;
}

export interface TreatmentIUICreateUpdateRequest {
  treatmentId: string;
  protocol?: string;
  medications?: string;
  monitoring?: string;
  ovulationTriggerDate?: string;
  inseminationDate?: string;
  motileSpermCount?: number;
  numberOfAttempts?: number;
  outcome?: string;
  notes?: string;
  status?: IUICycleStatus;
}

// ============================================================================
// Service Types
// ============================================================================

export interface Service {
  id: string;
  name: string; // Primary field from API
  serviceName?: string; // Legacy compatibility
  code?: string; // Primary field from API
  serviceCode?: string; // Legacy compatibility
  serviceCategoryId: string; // Primary field from API
  categoryId?: string; // Legacy compatibility
  serviceCategoryName?: string; // Included in API response
  price: number;
  description?: string;
  unit?: string;
  duration?: number | null;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface ServiceCategory {
  id: string;
  name: string; // Primary field from API
  categoryName?: string; // Legacy compatibility
  code: string; // Primary field from API
  categoryCode?: string; // Legacy compatibility
  description?: string;
  isActive: boolean;
  displayOrder?: number;
  serviceCount?: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface ServiceCreateUpdateRequestModel {
  serviceCode: string;
  serviceName: string;
  categoryId: string;
  price: number;
  description?: string;
  isActive?: boolean;
}

export interface ServiceCategoryRequestModel {
  categoryCode: string;
  categoryName: string;
  description?: string;
  isActive?: boolean;
}

export interface GetServicesRequest {
  pageNumber?: number;
  pageSize?: number;
  categoryId?: string;
  isActive?: boolean;
  searchTerm?: string;
}

export interface GetServiceCategoriesRequest {
  pageNumber?: number;
  pageSize?: number;
  isActive?: boolean;
}

// Legacy compatibility
export interface ServiceListQuery extends GetServicesRequest {}

// ============================================================================
// Service Request Types
// ============================================================================

export type ServiceRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Completed"
  | "Cancelled";

export interface ServiceRequest {
  id: string;
  requestCode?: string; // May not be in response
  appointmentId: string | null;
  patientId?: string; // May not be in response
  status: ServiceRequestStatus;
  statusName?: string; // Included in API response
  requestDate: string; // Primary field from API (ISO date-time)
  requestedDate?: string; // Legacy compatibility (ISO date)
  approvedDate?: string | null; // ISO date-time
  approvedBy?: string | null;
  totalAmount?: number; // Included in API response
  notes?: string | null;
  serviceDetails?: ServiceRequestDetail[]; // Nested in API response
  createdAt?: string;
  updatedAt?: string | null;
}

export interface ServiceRequestDetail {
  id: string;
  serviceRequestId: string;
  serviceId: string;
  serviceName?: string; // Included in API response
  serviceCode?: string | null; // Included in API response
  serviceUnit?: string | null; // Included in API response
  quantity: number;
  unitPrice: number; // Primary field from API
  price?: number; // Legacy compatibility
  discount?: number | null;
  totalPrice: number; // Included in API response
  notes?: string | null;
  imageUrl?: string | null; // Image URL for service request detail
  fileUrl?: string | null; // File URL (alternative to imageUrl)
  mediaId?: string | null; // Reference to Media entity
}

export interface ServiceRequestCreateRequestModel {
  appointmentId?: string | null; // Can be null
  patientId?: string; // May be optional
  requestDate?: string; // ISO date-time
  requestedDate?: string; // Legacy compatibility (ISO date)
  notes?: string | null;
  serviceDetails: {
    serviceId: string;
    quantity: number;
    unitPrice?: number; // Primary field
    price?: number; // Legacy compatibility
    notes?: string | null;
  }[];
}

export interface ServiceRequestUpdateRequestModel {
  requestedDate?: string;
  notes?: string;
}

export interface ServiceRequestDetailCreateRequestModel {
  serviceId: string;
  quantity: number;
  price?: number;
  notes?: string;
}

export interface ServiceRequestDetailUpdateRequestModel {
  quantity?: number;
  price?: number;
  notes?: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  mediaId?: string | null;
}

export interface GetServiceRequestsRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: ServiceRequestStatus;
  appointmentId?: string;
  patientId?: string;
  requestDateFrom?: string; // ISO date-time
  requestDateTo?: string; // ISO date-time
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  sort?: string;
  order?: string;
}

// Legacy compatibility
export interface ServiceRequestDetails extends ServiceRequestDetail {}
export interface ServiceRequestListQuery extends GetServiceRequestsRequest {}

// ============================================================================
// Cryobank Types
// ============================================================================

export type SampleType = "Sperm" | "Oocyte" | "Embryo";
export type CryoLocationType = "Tank" | "Canister" | "Goblet" | "Slot";
export type ContractStatus = "Active" | "Expired" | "Terminated";

export interface CryoStorageContract {
  id: string;
  contractNumber: string;
  patientId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  sampleType: SampleType;
  storageFee: number;
  status: ContractStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CryoStorageContractDetailResponse extends CryoStorageContract {
  patient?: Patient;
  imports?: CryoImport[];
}

export interface CreateCryoStorageContractRequest {
  patientId: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  sampleType: SampleType;
  storageFee: number;
  notes?: string;
}

export interface UpdateCryoStorageContractRequest {
  endDate?: string;
  storageFee?: number;
  status?: ContractStatus;
  notes?: string;
}

export interface GetCryoStorageContractsRequest {
  pageNumber?: number;
  pageSize?: number;
  patientId?: string;
  status?: ContractStatus;
  sampleType?: SampleType;
}

export interface CryoLocation {
  id: string;
  locationCode: string;
  locationType: CryoLocationType;
  parentId?: string;
  sampleType: SampleType;
  isActive: boolean;
  capacity?: number;
  currentCount?: number;
  notes?: string;
}

export interface CryoLocationSummaryResponse {
  id: string;
  locationCode: string;
  locationType: CryoLocationType;
  sampleType: SampleType;
  isActive: boolean;
  children?: CryoLocationSummaryResponse[];
}

export interface CryoLocationFullTreeResponse extends CryoLocation {
  children?: CryoLocationFullTreeResponse[];
}

export interface CryoLocationUpdateRequest {
  locationCode?: string;
  isActive?: boolean;
  capacity?: number;
  notes?: string;
}

export interface CryoImport {
  id: string;
  importCode: string;
  contractId: string;
  locationId: string;
  sampleType: SampleType;
  importDate: string; // ISO date
  quantity: number;
  notes?: string;
  createdAt?: string;
}

export interface CreateCryoImportRequest {
  contractId: string;
  locationId: string;
  sampleType: SampleType;
  importDate: string;
  quantity: number;
  notes?: string;
}

export interface UpdateCryoImportRequest {
  locationId?: string;
  quantity?: number;
  notes?: string;
}

export interface GetCryoImportsRequest {
  pageNumber?: number;
  pageSize?: number;
  contractId?: string;
  sampleType?: SampleType;
  dateFrom?: string;
  dateTo?: string;
}

export interface CryoExport {
  id: string;
  exportCode: string;
  importId: string;
  exportDate: string; // ISO date
  reason: string;
  notes?: string;
  createdAt?: string;
}

export interface CreateCryoExportRequest {
  importId: string;
  exportDate: string;
  reason: string;
  notes?: string;
}

export interface UpdateCryoExportRequest {
  exportDate?: string;
  reason?: string;
  notes?: string;
}

export interface GetCryoExportsRequest {
  pageNumber?: number;
  pageSize?: number;
  importId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CryoPackage {
  id: string;
  packageCode: string;
  packageName: string;
  sampleType: SampleType;
  duration: number; // months
  price: number;
  description?: string;
  isActive: boolean;
}

export interface CreateCryoPackageRequest {
  packageCode: string;
  packageName: string;
  sampleType: SampleType;
  duration: number;
  price: number;
  description?: string;
}

export interface UpdateCryoPackageRequest {
  packageName?: string;
  duration?: number;
  price?: number;
  description?: string;
  isActive?: boolean;
}

export interface GetCryoPackagesRequest {
  pageNumber?: number;
  pageSize?: number;
  sampleType?: SampleType;
  isActive?: boolean;
}

// ============================================================================
// Lab Sample Types
// ============================================================================

export type SpecimenStatus =
  | "Collected"
  | "Processing"
  | "Stored"
  | "Used"
  | "Discarded"
  | "QualityChecked";

export interface LabSample {
  id: string;
  sampleCode: string;
  patientId: string;
  treatmentCycleId?: string;
  sampleType: SampleType;
  collectionDate: string; // ISO date
  status: SpecimenStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabSampleSperm extends LabSample {
  volume?: number;
  concentration?: number;
  motility?: number;
  morphology?: number;
}

export interface LabSampleOocyte extends LabSample {
  quantity: number;
  maturity?: string;
  quality?: string;
}

export interface LabSampleEmbryo extends LabSample {
  quantity: number;
  stage?: string;
  quality?: string;
  creationDate: string; // ISO date
}

export interface CreateLabSampleSpermRequest {
  patientId: string;
  treatmentCycleId?: string;
  collectionDate: string;
  volume?: number;
  concentration?: number;
  motility?: number;
  morphology?: number;
  status: SpecimenStatus;
  notes?: string;
}

export interface CreateLabSampleOocyteRequest {
  patientId: string;
  treatmentCycleId?: string;
  collectionDate: string;
  quantity: number;
  maturity?: string;
  quality?: string;
  status: SpecimenStatus;
  notes?: string;
}

export interface CreateLabSampleEmbryoRequest {
  patientId: string;
  treatmentCycleId?: string;
  creationDate: string;
  quantity: number;
  stage?: string;
  quality?: string;
  status: SpecimenStatus;
  notes?: string;
}

export interface UpdateLabSampleSpermRequest {
  volume?: number;
  concentration?: number;
  motility?: number;
  morphology?: number;
  status?: SpecimenStatus;
  notes?: string;
}

export interface UpdateLabSampleOocyteRequest {
  quantity?: number;
  maturity?: string;
  quality?: string;
  status?: SpecimenStatus;
  notes?: string;
}

export interface UpdateLabSampleEmbryoRequest {
  quantity?: number;
  stage?: string;
  quality?: string;
  status?: SpecimenStatus;
  notes?: string;
}

export interface GetLabSamplesRequest {
  pageNumber?: number;
  pageSize?: number;
  sampleType?: SampleType;
  patientId?: string;
  treatmentCycleId?: string;
  status?: SpecimenStatus;
}

// Legacy compatibility
export interface SampleListQuery extends GetLabSamplesRequest {
  searchTerm?: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionStatus =
  | "Pending"
  | "Completed"
  | "Failed"
  | "Cancelled";
export type TransactionType = "Payment" | "Refund";

export interface Transaction {
  id: string;
  transactionCode: string;
  paymentUrl?: string;
  transactionType: TransactionType;
  amount: number;
  currency?: string;
  transactionDate?: string;
  status: TransactionStatus;
  paymentMethod?: string;
  paymentGateway?: string;
  referenceNumber?: string;
  description?: string;
  notes?: string;
  patientId?: string;
  patientName?: string;
  processedDate?: string;
  processedBy?: string;
  relatedEntityType?: "ServiceRequest" | "Appointment" | "CryoStorageContract";
  relatedEntityId?: string;
  // Legacy fields for backward compatibility
  serviceRequestId?: string;
  appointmentId?: string;
  vnPayUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create transaction request
 * POST /api/transaction
 * Uses query parameters: RelatedEntityType and RelatedEntityId
 */
export interface CreateTransactionRequest {
  relatedEntityType: "ServiceRequest" | "Appointment" | "CryoStorageContract";
  relatedEntityId: string;
}

export interface GetTransactionsRequest {
  patientId?: string;
  relatedEntityType?: "ServiceRequest" | "Appointment" | "CryoStorageContract";
  relatedEntityId?: string;
  fromDate?: string; // ISO date-time
  toDate?: string; // ISO date-time
  status?: TransactionStatus;
  page?: number;
  size?: number;
  sort?: string;
  order?: string;
  // Legacy fields for backward compatibility
  pageNumber?: number;
  pageSize?: number;
  transactionType?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Relationship Types
// ============================================================================

export type RelationshipType = "Spouse" | "Partner" | "Other";
export type RelationshipStatus = "Pending" | "Approved" | "Rejected";

export interface Relationship {
  id: string;
  patient1Id: string;
  patient2Id: string;
  relationshipType: RelationshipType;
  status: RelationshipStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRelationshipRequest {
  patient1Id: string;
  patient2Id: string;
  relationshipType: RelationshipType;
  notes?: string;
}

export interface UpdateRelationshipRequest {
  relationshipType?: RelationshipType;
  notes?: string;
}

export interface ApproveRelationshipRequest {
  relationshipId: string;
}

export interface RejectRelationshipRequest {
  relationshipId: string;
}

export interface GetRelationshipsRequest {
  pageNumber?: number;
  pageSize?: number;
  patientId?: string;
  relationshipType?: RelationshipType;
  status?: RelationshipStatus;
}

// ============================================================================
// Medicine Types
// ============================================================================

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  dosage?: string;
  form?: string;
  indication?: string;
  contraindication?: string;
  sideEffects?: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMedicineRequest {
  name: string;
  genericName?: string;
  dosage?: string;
  form?: string;
  indication?: string;
  contraindication?: string;
  sideEffects?: string;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateMedicineRequest {
  name?: string;
  genericName?: string;
  dosage?: string;
  form?: string;
  indication?: string;
  contraindication?: string;
  sideEffects?: string;
  isActive?: boolean;
  notes?: string;
}

// ============================================================================
// Prescription Types
// ============================================================================

export interface PrescriptionDetail {
  id?: string;
  medicineId: string;
  medicineName?: string;
  dosage?: string;
  form?: string;
  quantity: number;
  frequency?: string;
  durationDays?: number;
  instructions?: string;
  notes?: string;
}

export interface PrescriptionDetailResponse extends PrescriptionDetail {
  id: string;
  medicineName: string;
  form?: string;
}

export interface Prescription {
  id: string;
  medicalRecordId: string;
  medicalRecordDiagnosis?: string;
  prescriptionDate: string; // ISO date-time
  diagnosis?: string;
  instructions?: string;
  notes?: string;
  isFilled: boolean;
  filledDate?: string | null; // ISO date-time
  createdAt?: string;
  updatedAt?: string | null;
  prescriptionDetails?: PrescriptionDetail[];
}

export interface PrescriptionDetailResponseFull extends Prescription {
  prescriptionDetails: PrescriptionDetailResponse[];
}

export interface CreatePrescriptionRequest {
  medicalRecordId: string;
  prescriptionDate?: string; // ISO date-time
  diagnosis?: string;
  instructions?: string;
  notes?: string;
  prescriptionDetails: {
    medicineId: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    durationDays?: number;
    instructions?: string;
    notes?: string;
  }[];
}

export interface UpdatePrescriptionRequest {
  diagnosis?: string;
  instructions?: string;
  notes?: string;
  prescriptionDetails: {
    medicineId: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    durationDays?: number;
    instructions?: string;
    notes?: string;
  }[];
}

export interface GetPrescriptionsRequest {
  MedicalRecordId?: string;
  FromDate?: string; // ISO date-time
  ToDate?: string; // ISO date-time
  SearchTerm?: string;
  Page?: number;
  Size?: number;
  Sort?: string;
  Order?: string;
}

// ============================================================================
// Media Types
// ============================================================================

export interface Media {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadMediaRequest {
  file: File;
  entityType?: string;
  entityId?: string;
  description?: string;
}

export interface UpdateMediaRequest {
  description?: string;
  entityType?: string;
  entityId?: string;
}

export interface GetMediasRequest {
  pageNumber?: number;
  pageSize?: number;
  entityType?: string;
  entityId?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

// Legacy notification types - deprecated, use the types below instead
export type LegacyNotificationType = "Info" | "Warning" | "Error" | "Success";
export type LegacyNotificationStatus = "Unread" | "Read";

export interface LegacyNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType?: LegacyNotificationType;
  status: LegacyNotificationStatus;
  linkUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LegacyCreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  notificationType?: LegacyNotificationType;
  linkUrl?: string;
}

export interface LegacyUpdateNotificationRequest {
  id: string;
  title?: string;
  message?: string;
  notificationType?: LegacyNotificationType;
  status?: LegacyNotificationStatus;
  linkUrl?: string;
}

export interface GetNotificationsRequest {
  pageNumber?: number;
  pageSize?: number;
  userId?: string;
  notificationType?: NotificationType;
  status?: NotificationStatus;
  isActive?: boolean;
}

// ============================================================================
// Cycle Document Types (Legacy)
// ============================================================================

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
  fileId: string;
  description?: string;
}

// Legacy compatibility types
export interface ResetPasswordRequest {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  verificationCode: string;
}

// ============================================================================
// Agreement Types
// ============================================================================

export type AgreementStatus =
  | "Pending" // 0
  | "Active" // 1
  | "Completed" // 2
  | "Canceled"; // 3

export interface Agreement {
  id: string;
  agreementCode?: string;
  treatmentId?: string;
  treatmentName?: string;
  patientId: string;
  patientName?: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  status: AgreementStatus;
  statusName?: string;
  signedByPatient?: boolean;
  signedByDoctor?: boolean;
  fileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for backward compatibility
  code?: string;
  title?: string;
  content?: string;
  doctorId?: string;
  doctorSigned?: boolean;
  doctorSignedDate?: string;
  doctorSignedBy?: string;
  patientSigned?: boolean;
  patientSignedDate?: string;
  patientSignedBy?: string;
}

export interface AgreementDetailResponse extends Agreement {
  treatment?: {
    id: string;
    name: string;
    description: string;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dob: string;
    gender: string;
  };
}

export interface AgreementCreateRequest {
  treatmentId?: string;
  patientId: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  fileUrl?: string;
}

export interface AgreementUpdateRequest {
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  status?: AgreementStatus;
  signedByPatient?: boolean;
  signedByDoctor?: boolean;
  fileUrl?: string;
}

export interface AgreementSignRequest {
  signedByPatient?: boolean;
  signedByDoctor?: boolean;
}

export interface AgreementListQuery {
  TreatmentId?: string;
  PatientId?: string;
  Status?: AgreementStatus;
  FromStartDate?: string;
  ToStartDate?: string;
  FromEndDate?: string;
  ToEndDate?: string;
  SignedByPatient?: boolean;
  SignedByDoctor?: boolean;
  SearchTerm?: string;
  Page?: number;
  Size?: number;
  Sort?: string;
  Order?: string;
}

// ============================================================================
// Medical Record Types
// ============================================================================

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  chiefComplaint?: string | null;
  history?: string | null;
  physicalExamination?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  followUpInstructions?: string | null;
  vitalSigns?: string | null;
  labResults?: string | null;
  imagingResults?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface MedicalRecordDetailResponse extends MedicalRecord {
  appointment?: Appointment;
  patient?: Patient;
}

export interface CreateMedicalRecordRequest {
  appointmentId: string;
  chiefComplaint?: string;
  history?: string;
  physicalExamination?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  vitalSigns?: string;
  labResults?: string;
  imagingResults?: string;
  notes?: string;
}

export interface UpdateMedicalRecordRequest {
  chiefComplaint?: string;
  history?: string;
  physicalExamination?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  vitalSigns?: string;
  labResults?: string;
  imagingResults?: string;
  notes?: string;
}

export interface MedicalRecordListQuery {
  AppointmentId?: string;
  PatientId?: string;
  SearchTerm?: string;
  Page?: number;
  Size?: number;
  Sort?: string;
  Order?: "asc" | "desc";
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | "Appointment"
  | "Medication"
  | "Test"
  | "Payment"
  | "Treatment"
  | "Relationship"
  | "Reminder";

export type NotificationStatus =
  | "Scheduled"
  | "Sent"
  | "Delivered"
  | "Read"
  | "Failed";

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  status: NotificationStatus;
  patientId: string;
  patientName?: string;
  userId?: string;
  userName?: string;
  scheduledTime?: string;
  sentTime?: string;
  readTime?: string;
  channel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isImportant?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationRequest {
  title: string;
  content: string;
  type: NotificationType;
  patientId: string;
  userId?: string;
  scheduledTime?: string;
  channel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isImportant?: boolean;
  notes?: string;
}

export interface UpdateNotificationRequest {
  id?: string;
  title?: string;
  content?: string;
  type?: NotificationType;
  patientId?: string;
  userId?: string;
  status?: NotificationStatus;
  scheduledTime?: string;
  sentTime?: string;
  readTime?: string;
  channel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isImportant?: boolean;
  notes?: string;
}

export interface GetNotificationsRequest {
  SearchTerm?: string;
  PatientId?: string;
  UserId?: string;
  Type?: NotificationType;
  Status?: NotificationStatus;
  IsImportant?: boolean;
  FromDate?: string;
  ToDate?: string;
  Page?: number;
  Size?: number;
  Sort?: string;
  Order?: string;
}
