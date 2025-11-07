import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  DoctorSchedule,
  DoctorScheduleListQuery,
} from "../types";

/**
 * Doctor Schedule API
 */
export class DoctorScheduleApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of doctor schedules
   * GET /api/doctor-schedule
   */
  async getDoctorSchedules(
    params?: DoctorScheduleListQuery
  ): Promise<DynamicResponse<DoctorSchedule>> {
    const response = await this.client.get<DynamicResponse<DoctorSchedule>>(
      "/doctor-schedule",
      { params }
    );
    return response.data;
  }

  /**
   * Get doctor schedule by ID
   * GET /api/doctor-schedule/{id}
   */
  async getDoctorScheduleById(
    id: string
  ): Promise<BaseResponse<DoctorSchedule>> {
    const response = await this.client.get<BaseResponse<DoctorSchedule>>(
      `/doctor-schedule/${id}`
    );
    return response.data;
  }

  /**
   * Get schedules by doctor ID
   * GET /api/doctor-schedule/doctor/{doctorId}
   */
  async getSchedulesByDoctor(
    doctorId: string
  ): Promise<DynamicResponse<DoctorSchedule>> {
    const response = await this.client.get<DynamicResponse<DoctorSchedule>>(
      `/doctor-schedule/doctor/${doctorId}`
    );
    return response.data;
  }

  /**
   * Create new doctor schedule
   * POST /api/doctor-schedule
   */
  async createDoctorSchedule(
    data: Partial<DoctorSchedule>
  ): Promise<BaseResponse<DoctorSchedule>> {
    const response = await this.client.post<BaseResponse<DoctorSchedule>>(
      "/doctor-schedule",
      data
    );
    return response.data;
  }

  /**
   * Update doctor schedule
   * PUT /api/doctor-schedule/{id}
   */
  async updateDoctorSchedule(
    id: string,
    data: Partial<DoctorSchedule>
  ): Promise<BaseResponse<DoctorSchedule>> {
    const response = await this.client.put<BaseResponse<DoctorSchedule>>(
      `/doctor-schedule/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete doctor schedule
   * DELETE /api/doctor-schedule/{id}
   */
  async deleteDoctorSchedule(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `/doctor-schedule/${id}`
    );
    return response.data;
  }
}
