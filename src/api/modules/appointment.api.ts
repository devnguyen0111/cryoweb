import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  Appointment,
  AppointmentDetailResponse,
  AppointmentExtendedDetailResponse,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentStatusRequest,
  CancelAppointmentRequest,
  GetAppointmentsRequest,
  AppointmentSummary,
} from "../types";

/**
 * Appointment API
 * Matches Back-End API endpoints from /api/appointment/*
 */
export class AppointmentApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapQueryParams(params?: GetAppointmentsRequest) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      status: params.status,
      appointmentType: params.appointmentType,
      patientId: params.patientId,
      doctorId: params.doctorId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

  /**
   * Get list of appointments
   * GET /api/appointment
   */
  async getAppointments(
    params?: GetAppointmentsRequest
  ): Promise<PaginatedResponse<Appointment>> {
    const response = await this.client.get<PaginatedResponse<Appointment>>(
      "/appointment",
      { params: this.mapQueryParams(params) }
    );
    return response.data;
  }

  /**
   * Get appointment by ID
   * GET /api/appointment/{id}
   */
  async getAppointmentById(
    id: string
  ): Promise<BaseResponse<AppointmentDetailResponse>> {
    const response = await this.client.get<
      BaseResponse<AppointmentDetailResponse>
    >(`/appointment/${id}`);
    return response.data;
  }

  /**
   * Get extended appointment details
   * GET /api/appointment/{id}/details
   * Returns more detailed information including medical records, service requests, and nested doctor/schedule info
   */
  async getAppointmentDetails(
    id: string
  ): Promise<BaseResponse<AppointmentExtendedDetailResponse>> {
    const response = await this.client.get<
      BaseResponse<AppointmentExtendedDetailResponse>
    >(`/appointment/${id}/details`);
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
   * Update appointment status
   * PUT /api/appointment/{id}/status
   */
  async updateAppointmentStatus(
    id: string,
    data: UpdateAppointmentStatusRequest
  ): Promise<BaseResponse<Appointment>> {
    const response = await this.client.put<BaseResponse<Appointment>>(
      `/appointment/${id}/status`,
      data
    );
    return response.data;
  }

  /**
   * Cancel appointment
   * POST /api/appointment/{id}/cancel
   */
  async cancelAppointment(
    id: string,
    data: CancelAppointmentRequest
  ): Promise<BaseResponse<Appointment>> {
    const response = await this.client.post<BaseResponse<Appointment>>(
      `/appointment/${id}/cancel`,
      data
    );
    return response.data;
  }

  /**
   * Check in appointment
   * POST /api/appointment/{id}/check-in
   */
  async checkIn(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.post<BaseResponse<void>>(
      `/appointment/${id}/check-in`
    );
    return response.data;
  }

  /**
   * Check out appointment
   * POST /api/appointment/{id}/check-out
   */
  async checkOut(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.post<BaseResponse<void>>(
      `/appointment/${id}/check-out`
    );
    return response.data;
  }

  /**
   * Get appointments by treatment cycle
   * GET /api/appointment/treatment-cycle/{treatmentCycleId}
   */
  async getAppointmentsByTreatmentCycle(
    treatmentCycleId: string
  ): Promise<PaginatedResponse<AppointmentSummary>> {
    const response = await this.client.get<
      PaginatedResponse<AppointmentSummary>
    >(`/appointment/treatment-cycle/${treatmentCycleId}`);
    return response.data;
  }

  /**
   * Get appointments by doctor (dedicated endpoint)
   * GET /api/appointment/doctor/{doctorId}
   *
   * Note: You can also use getAppointments({ doctorId }) which uses /api/appointment?DoctorId=...
   * Both approaches work. This is a dedicated endpoint for convenience.
   */
  async getAppointmentsByDoctor(
    doctorId: string,
    params?: GetAppointmentsRequest
  ): Promise<PaginatedResponse<Appointment>> {
    const response = await this.client.get<PaginatedResponse<Appointment>>(
      `/appointment/doctor/${doctorId}`,
      { params: this.mapQueryParams(params) }
    );
    return response.data;
  }

  /**
   * Get appointment by slot
   * GET /api/appointment/slot/{slotId}
   */
  async getAppointmentBySlot(
    slotId: string
  ): Promise<PaginatedResponse<Appointment>> {
    const response = await this.client.get<PaginatedResponse<Appointment>>(
      `/appointment/slot/${slotId}`
    );
    return response.data;
  }

  /**
   * Add doctor to appointment
   * POST /api/appointment/{id}/doctors
   */
  async addDoctorToAppointment(
    appointmentId: string,
    data: { doctorId: string; role?: string; notes?: string }
  ): Promise<BaseResponse<any>> {
    const response = await this.client.post<BaseResponse<any>>(
      `/appointment/${appointmentId}/doctors`,
      data
    );
    return response.data;
  }

  /**
   * Update doctor assignment in appointment
   * PUT /api/appointment/{id}/doctors/{doctorId}
   */
  async updateDoctorInAppointment(
    appointmentId: string,
    doctorId: string,
    data: { role?: string; notes?: string }
  ): Promise<BaseResponse<any>> {
    const response = await this.client.put<BaseResponse<any>>(
      `/appointment/${appointmentId}/doctors/${doctorId}`,
      data
    );
    return response.data;
  }

  /**
   * Remove doctor from appointment
   * DELETE /api/appointment/{id}/doctors/{doctorId}
   */
  async removeDoctorFromAppointment(
    appointmentId: string,
    doctorId: string
  ): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `/appointment/${appointmentId}/doctors/${doctorId}`
    );
    return response.data;
  }

  /**
   * Get booking appointments by patient
   * GET /api/appointment/patient/{patientId}/booking
   */
  async getBookingAppointmentsByPatient(
    patientId: string
  ): Promise<PaginatedResponse<Appointment>> {
    const response = await this.client.get<PaginatedResponse<Appointment>>(
      `/appointment/patient/${patientId}/booking`
    );
    return response.data;
  }
}
