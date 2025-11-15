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
  fullName: string;
  phoneNumber?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
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

// ============================================================================
// User Types
// ============================================================================

export type UserRole = 'Patient' | 'Doctor' | 'Admin' | 'Receptionist' | 'LaboratoryTechnician';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDetailResponse extends User {
  patient?: Patient;
  doctor?: Doctor;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
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

export type Gender = 'Male' | 'Female' | 'Other';

export interface Patient {
  id: string;
  patientCode: string;
  nationalId: string;
  fullName: string;
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

export interface PatientDetailResponse extends Patient {
  relationships?: Relationship[];
  treatments?: Treatment[];
  appointments?: Appointment[];
}

export interface CreatePatientRequest {
  nationalId: string;
  fullName: string;
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
  fullName?: string;
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
  sortOrder?: 'asc' | 'desc';
}

export interface PatientSearchResult {
  id: string;
  patientCode: string;
  fullName: string;
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
  fullName: string;
  relationshipType: RelationshipType;
}

// ============================================================================
// Doctor Types
// ============================================================================

export interface Doctor {
  id: string;
  badgeId: string;
  fullName: string;
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
  fullName: string;
  specialty: string;
  phoneNumber: string;
  email?: string;
  accountId: string;
  isActive?: boolean;
}

export interface UpdateDoctorRequest {
  fullName?: string;
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

// ============================================================================
// Appointment Types
// ============================================================================

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type AppointmentType = 'Consultation' | 'Treatment' | 'FollowUp';

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
        fullName: string;
      };
    };
  };
  patient?: Patient | null;
  doctors?: Array<{
    id: string;
    doctorId: string;
    badgeId: string;
    specialty: string;
    fullName: string;
    role: string;
    notes?: string | null;
  }>;
  doctorCount?: number;
}

export interface CreateAppointmentRequest {
  patientId: string;
  slotId: string;
  appointmentType: AppointmentType;
  notes?: string;
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

// ============================================================================
// Treatment Types
// ============================================================================

export type TreatmentType = 'IVF' | 'IUI' | 'Other';
export type TreatmentStatus = 'Planning' | 'InProgress' | 'Completed' | 'Cancelled';

export interface Treatment {
  id: string;
  treatmentCode: string;
  patientId: string;
  treatmentType: TreatmentType;
  status: TreatmentStatus;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentDetailResponseModel extends Treatment {
  patient?: Patient;
  cycles?: TreatmentCycle[];
}

export interface TreatmentCreateUpdateRequest {
  patientId: string;
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
}

// ============================================================================
// Treatment Cycle Types
// ============================================================================

export type TreatmentCycleStatus = 'Planning' | 'InProgress' | 'Completed' | 'Cancelled';

export interface TreatmentCycle {
  id: string;
  treatmentId: string;
  cycleNumber: number;
  startDate?: string; // ISO date
  expectedEndDate?: string; // ISO date
  actualEndDate?: string; // ISO date
  status: TreatmentCycleStatus;
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
  cycleNumber: number;
  startDate?: string;
  expectedEndDate?: string;
  notes?: string;
}

export interface UpdateTreatmentCycleRequest {
  cycleNumber?: number;
  startDate?: string;
  expectedEndDate?: string;
  notes?: string;
}

export interface StartTreatmentCycleRequest {
  startDate: string;
  notes?: string;
}

export interface CompleteTreatmentCycleRequest {
  endDate: string;
  result?: string;
  notes?: string;
}

export interface CancelTreatmentCycleRequest {
  cancellationReason: string;
}

export interface GetTreatmentCyclesRequest {
  pageNumber?: number;
  pageSize?: number;
  treatmentId?: string;
  patientId?: string;
  status?: TreatmentCycleStatus;
}

export interface AddCycleSampleRequest {
  sampleId: string;
  notes?: string;
}

export interface AddCycleAppointmentRequest {
  appointmentId: string;
  notes?: string;
}

export interface TreatmentCycleBillingResponse {
  cycleId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  transactions: Transaction[];
}

export interface DocumentSummary {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface UploadCycleDocumentRequest {
  fileId: string;
  description?: string;
}

// ============================================================================
// Treatment IVF Types
// ============================================================================

export type IVFCycleStatus = 'Planning' | 'Stimulation' | 'Retrieval' | 'Fertilization' | 'Transfer' | 'Completed' | 'Cancelled';

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

export type IUICycleStatus = 'Planning' | 'Monitoring' | 'Insemination' | 'Completed' | 'Cancelled';

export interface TreatmentIUI {
  id: string;
  treatmentId: string;
  cycleStatus: IUICycleStatus;
  inseminationDate?: string;
  notes?: string;
}

export interface TreatmentIUICreateUpdateRequest {
  treatmentId: string;
  cycleStatus?: IUICycleStatus;
  inseminationDate?: string;
  notes?: string;
}

// ============================================================================
// Service Types
// ============================================================================

export interface Service {
  id: string;
  serviceCode: string;
  serviceName: string;
  name?: string; // Backend may return 'name' instead of 'serviceName'
  categoryId: string;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  isActive: boolean;
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

// ============================================================================
// Service Request Types
// ============================================================================

export type ServiceRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';

export interface ServiceRequest {
  id: string;
  requestCode: string;
  appointmentId: string;
  patientId: string;
  status: ServiceRequestStatus;
  requestedDate?: string; // ISO date
  approvedDate?: string; // ISO date
  approvedBy?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequestDetail {
  id: string;
  serviceRequestId: string;
  serviceId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface ServiceRequestCreateRequestModel {
  appointmentId: string;
  patientId: string;
  requestedDate?: string;
  notes?: string;
  serviceDetails: {
    serviceId: string;
    quantity: number;
    price?: number;
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
}

export interface GetServiceRequestsRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: ServiceRequestStatus;
  appointmentId?: string;
  patientId?: string;
}

// ============================================================================
// Cryobank Types
// ============================================================================

export type SampleType = 'Sperm' | 'Oocyte' | 'Embryo';
export type CryoLocationType = 'Tank' | 'Canister' | 'Goblet' | 'Slot';
export type ContractStatus = 'Active' | 'Expired' | 'Terminated';

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

export type SpecimenStatus = 'Collected' | 'Processing' | 'Stored' | 'Used' | 'Discarded';

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

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionStatus = 'Pending' | 'Completed' | 'Failed' | 'Cancelled';
export type TransactionType = 'Payment' | 'Refund';

export interface Transaction {
  id: string;
  transactionCode: string;
  serviceRequestId?: string;
  appointmentId?: string;
  amount: number;
  status: TransactionStatus;
  transactionType: TransactionType;
  paymentMethod?: string;
  description?: string;
  vnPayUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionRequest {
  serviceRequestId?: string;
  appointmentId?: string;
  amount: number;
  description?: string;
  paymentMethod?: string;
}

export interface GetTransactionsRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: TransactionStatus;
  transactionType?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
}

// ============================================================================
// Relationship Types
// ============================================================================

export type RelationshipType = 'Spouse' | 'Partner' | 'Other';
export type RelationshipStatus = 'Pending' | 'Approved' | 'Rejected';

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

export interface PagingModel {
  pageNumber?: number;
  pageSize?: number;
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

export type NotificationType = 'Info' | 'Warning' | 'Error' | 'Success';
export type NotificationStatus = 'Unread' | 'Read';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType?: NotificationType;
  status: NotificationStatus;
  linkUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  notificationType?: NotificationType;
  linkUrl?: string;
}

export interface UpdateNotificationRequest {
  id: string;
  title?: string;
  message?: string;
  notificationType?: NotificationType;
  status?: NotificationStatus;
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

