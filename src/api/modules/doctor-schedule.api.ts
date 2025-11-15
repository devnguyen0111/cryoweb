import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  DoctorSchedule,
  DoctorScheduleDetailResponse,
  CreateDoctorScheduleRequest,
  UpdateDoctorScheduleRequest,
  GetDoctorSchedulesRequest,
  GetBusyScheduleDateRequest,
  BusyScheduleDateResponse,
} from "../types";

/**
 * Doctor Schedule API
 * Matches Back-End API endpoints from /api/doctor-schedules/*
 */
export class DoctorScheduleApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get all doctor schedules
   * GET /api/doctor-schedules
   */
  async getDoctorSchedules(
    params?: GetDoctorSchedulesRequest
  ): Promise<PaginatedResponse<DoctorSchedule>> {
    const response = await this.client.get<PaginatedResponse<DoctorSchedule>>(
      "/doctor-schedules",
      { params }
    );
    return response.data;
  }

  /**
   * Get doctor schedule by ID
   * GET /api/doctor-schedules/{id}
   */
  async getDoctorScheduleById(
    id: string
  ): Promise<BaseResponse<DoctorScheduleDetailResponse>> {
    const response = await this.client.get<
      BaseResponse<DoctorScheduleDetailResponse>
    >(`/doctor-schedules/${id}`);
    return response.data;
  }

  /**
   * Create doctor schedule
   * POST /api/doctor-schedules
   */
  async createDoctorSchedule(
    data: CreateDoctorScheduleRequest
  ): Promise<BaseResponse<DoctorSchedule>> {
    const response = await this.client.post<BaseResponse<DoctorSchedule>>(
      "/doctor-schedules",
      data
    );
    return response.data;
  }

  /**
   * Update doctor schedule
   * PUT /api/doctor-schedules/{id}
   */
  async updateDoctorSchedule(
    id: string,
    data: UpdateDoctorScheduleRequest
  ): Promise<BaseResponse<DoctorSchedule>> {
    const response = await this.client.put<BaseResponse<DoctorSchedule>>(
      `/doctor-schedules/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Get busy schedule dates for a doctor
   * GET /api/doctor-schedules/busy-dates
   */
  async getBusyScheduleDates(
    params: GetBusyScheduleDateRequest
  ): Promise<BaseResponse<BusyScheduleDateResponse>> {
    const response = await this.client.get<
      BaseResponse<BusyScheduleDateResponse>
    >("/doctor-schedules/busy-dates", { params });
    return response.data;
  }

  // Legacy compatibility method
  async getSchedulesByDoctor(
    doctorId: string,
    params?: GetDoctorSchedulesRequest
  ): Promise<PaginatedResponse<DoctorSchedule>> {
    return this.getDoctorSchedules({ ...params, doctorId });
  }
}
