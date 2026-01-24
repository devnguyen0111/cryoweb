import axios, { AxiosInstance, AxiosError } from "axios";
import type { BaseResponse, TokenModel } from "./types";
import {
  AuthApi,
  UserApi,
  AppointmentApi,
  PatientApi,
  SampleApi,
  DoctorApi,
  DoctorScheduleApi,
  ServiceApi,
  ServiceCategoryApi,
  ServiceRequestApi,
  ServiceRequestDetailsApi,
  SlotApi,
  TreatmentCycleApi,
  TreatmentApi,
  CycleDocumentApi,
  RelationshipApi,
  AppointmentDoctorApi,
  TreatmentIUIApi,
  TreatmentIVFApi,
  AgreementApi,
  MedicalRecordApi,
  TransactionApi,
  NotificationApi,
  PrescriptionApi,
  MedicineApi,
  MediaApi,
  CryoLocationApi,
  CryoImportApi,
} from "./modules";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cryofert-bfbqgkgzf8b3e9ap.southeastasia-01.azurewebsites.net/api";

/**
 * Create axios instance with default config
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  // Request interceptor - Add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - Handle errors
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const response = await axios.post<BaseResponse<TokenModel>>(
              `${API_BASE_URL}/auth/refresh-token`,
              { refreshToken }
            );

            const nextToken = response.data.data?.token;
            const nextRefreshToken = response.data.data?.refreshToken;

            if (nextToken && nextRefreshToken) {
              localStorage.setItem("authToken", nextToken);
              localStorage.setItem("refreshToken", nextRefreshToken);
              originalRequest.headers.Authorization = `Bearer ${nextToken}`;
              return instance(originalRequest);
            }
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const client = createAxiosInstance();

/**
 * Main API Client Class
 * Aggregates all API modules
 */
export class ApiClient {
  auth: AuthApi;
  user: UserApi;
  appointment: AppointmentApi;
  patient: PatientApi;
  sample: SampleApi;
  doctor: DoctorApi;
  doctorSchedule: DoctorScheduleApi;
  service: ServiceApi;
  serviceCategory: ServiceCategoryApi;
  serviceRequest: ServiceRequestApi;
  serviceRequestDetails: ServiceRequestDetailsApi;
  slot: SlotApi;
  cryoLocation: CryoLocationApi;
  cryoImport: CryoImportApi;

  treatmentCycle: TreatmentCycleApi;
  treatment: TreatmentApi;
  cycleDocument: CycleDocumentApi;
  relationship: RelationshipApi;
  appointmentDoctor: AppointmentDoctorApi;
  treatmentIUI: TreatmentIUIApi;
  treatmentIVF: TreatmentIVFApi;
  agreement: AgreementApi;
  medicalRecord: MedicalRecordApi;
  transaction: TransactionApi;
  notification: NotificationApi;
  prescription: PrescriptionApi;
  medicine: MedicineApi;
  media: MediaApi;
  

  constructor() {
    this.auth = new AuthApi(client);
    this.user = new UserApi(client);
    this.appointment = new AppointmentApi(client);
    this.patient = new PatientApi(client);
    this.sample = new SampleApi(client);
    this.doctor = new DoctorApi(client);
    this.doctorSchedule = new DoctorScheduleApi(client);
    this.service = new ServiceApi(client);
    this.serviceCategory = new ServiceCategoryApi(client);
    this.serviceRequest = new ServiceRequestApi(client);
    this.serviceRequestDetails = new ServiceRequestDetailsApi(client);
    this.slot = new SlotApi(client);
    this.treatmentCycle = new TreatmentCycleApi(client);
    this.treatment = new TreatmentApi(client);
    this.cycleDocument = new CycleDocumentApi(client);
    this.relationship = new RelationshipApi(client);
    this.appointmentDoctor = new AppointmentDoctorApi(client);
    this.treatmentIUI = new TreatmentIUIApi(client);
    this.treatmentIVF = new TreatmentIVFApi(client);
    this.agreement = new AgreementApi(client);
    this.medicalRecord = new MedicalRecordApi(client);
    this.transaction = new TransactionApi(client);
    this.notification = new NotificationApi(client);
    this.prescription = new PrescriptionApi(client);
    this.medicine = new MedicineApi(client);
    this.media = new MediaApi(client);
    this.cryoLocation = new CryoLocationApi(client);
    this.cryoImport = new CryoImportApi(client);
    
  }
}

export const api = new ApiClient();
export default api;
