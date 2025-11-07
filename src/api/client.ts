import axios, { AxiosInstance, AxiosError } from "axios";
import type { BaseResponse, AuthResponse } from "./types";
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
} from "./modules";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cryofert.runasp.net/api";

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
            const response = await axios.post<BaseResponse<AuthResponse>>(
              `${API_BASE_URL}/auth/refresh-token`,
              { refreshToken }
            );

            if (response.data.data?.token) {
              localStorage.setItem("authToken", response.data.data.token);
              localStorage.setItem(
                "refreshToken",
                response.data.data.refreshToken || ""
              );
              originalRequest.headers.Authorization = `Bearer ${response.data.data.token}`;
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
  treatmentCycle: TreatmentCycleApi;
  treatment: TreatmentApi;
  cycleDocument: CycleDocumentApi;
  relationship: RelationshipApi;

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
  }
}

export const api = new ApiClient();
export default api;
