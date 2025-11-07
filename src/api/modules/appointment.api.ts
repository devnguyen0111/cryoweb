import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentListQuery,
} from "../types";

/**
 * Appointment API
 */
export class AppointmentApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of appointments
   * GET /api/appointment
   */
  async getAppointments(
    params?: AppointmentListQuery
  ): Promise<DynamicResponse<Appointment>> {
    const response = await this.client.get<DynamicResponse<Appointment>>(
      "/appointment",
      { params }
    );
    return response.data;
  }

  /**
   * Get appointment by ID
   * GET /api/appointment/{id}
   */
  async getAppointmentById(id: string): Promise<BaseResponse<Appointment>> {
    const response = await this.client.get<BaseResponse<Appointment>>(
      `/appointment/${id}`
    );
    return response.data;
  }

  /**
   * Get appointment details
   * GET /api/appointment/{id}/details
   */
  async getAppointmentDetails(id: string): Promise<BaseResponse<Appointment>> {
    const response = await this.client.get<BaseResponse<Appointment>>(
      `/appointment/${id}/details`
    );
    return response.data;
  }

  /**
   * Create new appointment
   * POST /api/appointment
   */
  async createAppointment(
    data: CreateAppointmentRequest
  ): Promise<BaseResponse<Appointment>> {
    const response = await this.client.post<BaseResponse<Appointment>>(
      "/appointment",
      data
    );
    return response.data;
  }

  /**
   * Update appointment
   * PUT /api/appointment/{id}
   */
  async updateAppointment(
    id: string,
    data: UpdateAppointmentRequest
  ): Promise<BaseResponse<Appointment>> {
    const response = await this.client.put<BaseResponse<Appointment>>(
      `/appointment/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete appointment
   * DELETE /api/appointment/{id}
   */
  async deleteAppointment(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `/appointment/${id}`
    );
    return response.data;
  }

  /**
   * Update appointment status
   * PATCH /api/appointment/{id}/status
   */
  async updateAppointmentStatus(
    id: string,
    status: Appointment["status"]
  ): Promise<BaseResponse<Appointment>> {
    const response = await this.client.patch<BaseResponse<Appointment>>(
      `/appointment/${id}/status`,
      { status }
    );
    return response.data;
  }

  /**
   * Cancel appointment
   * POST /api/appointment/{id}/cancel
   */
  async cancelAppointment(
    id: string,
    reason?: string
  ): Promise<BaseResponse<Appointment>> {
    const response = await this.client.post<BaseResponse<Appointment>>(
      `/appointment/${id}/cancel`,
      { reason }
    );
    return response.data;
  }

  /**
   * Add doctor to appointment
   * POST /api/appointment/{id}/add-doctor
   */
  async addDoctorToAppointment(
    id: string,
    doctorId: string
  ): Promise<BaseResponse<Appointment>> {
    const response = await this.client.post<BaseResponse<Appointment>>(
      `/appointment/${id}/add-doctor`,
      { doctorId }
    );
    return response.data;
  }

  /**
   * Update doctor role in appointment
   * PUT /api/appointment/{id}/doctor-role
   */
  async updateDoctorRole(
    id: string,
    doctorId: string,
    role?: string
  ): Promise<BaseResponse<Appointment>> {
    const response = await this.client.put<BaseResponse<Appointment>>(
      `/appointment/${id}/doctor-role`,
      { doctorId, role }
    );
    return response.data;
  }
}
