import { AxiosInstance } from "axios";
import type {
  AppointmentDoctorAssignment,
  AppointmentDoctorListQuery,
  BaseResponse,
  CreateAppointmentDoctorRequest,
  DynamicResponse,
  UpdateAppointmentDoctorRequest,
  PagingModel,
} from "../types";
import { ensureAppointmentStatus } from "@/utils/appointments";

const normalizeListParams = (params?: AppointmentDoctorListQuery) => {
  if (!params) return undefined;

  const mapped: Record<string, unknown> = {
    page: params.page ?? params.Page,
    size: params.size ?? params.Size,
    sort: params.sort ?? params.Sort,
    order: params.order ?? params.Order,
    appointmentId: params.appointmentId ?? params.AppointmentId,
    doctorId: params.doctorId ?? params.DoctorId,
    role: params.Role,
    searchTerm: params.SearchTerm,
    fromDate: params.FromDate,
    toDate: params.ToDate,
  };

  const status = params.Status;

  if (status) {
    mapped.status = ensureAppointmentStatus(status as string);
  }

  Object.keys(mapped).forEach((key) => {
    if (mapped[key] === undefined || mapped[key] === null) {
      delete mapped[key];
    }
  });

  return mapped;
};

const mapPagingOnly = (
  params?: PagingModel & { Page?: number; Size?: number }
) => {
  if (!params) return undefined;
  const mapped: Record<string, unknown> = {
    page: (params as any).page ?? params.Page ?? params.pageNumber,
    size: (params as any).size ?? params.Size ?? params.pageSize,
    sort: (params as any).sort ?? (params as any).Sort,
    order: (params as any).order ?? (params as any).Order,
  };

  Object.keys(mapped).forEach((key) => {
    if (mapped[key] === undefined || mapped[key] === null) {
      delete mapped[key];
    }
  });

  return mapped;
};

export class AppointmentDoctorApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * List doctor assignments
   * GET /api/appointmentdoctor
   */
  async getAssignments(
    params?: AppointmentDoctorListQuery
  ): Promise<DynamicResponse<AppointmentDoctorAssignment>> {
    const response = await this.client.get<
      DynamicResponse<AppointmentDoctorAssignment>
    >("/appointmentdoctor", { params: normalizeListParams(params) });
    return response.data;
  }

  /**
   * Get assignment by ID
   * GET /api/appointmentdoctor/{id}
   */
  async getAssignmentById(
    id: string
  ): Promise<BaseResponse<AppointmentDoctorAssignment>> {
    const response = await this.client.get<
      BaseResponse<AppointmentDoctorAssignment>
    >(`/appointmentdoctor/${id}`);
    return response.data;
  }

  /**
   * Create assignment
   * POST /api/appointmentdoctor
   */
  async createAssignment(
    data: CreateAppointmentDoctorRequest
  ): Promise<BaseResponse<AppointmentDoctorAssignment>> {
    const response = await this.client.post<
      BaseResponse<AppointmentDoctorAssignment>
    >("/appointmentdoctor", data);
    return response.data;
  }

  /**
   * Update assignment
   * PUT /api/appointmentdoctor/{id}
   */
  async updateAssignment(
    id: string,
    data: UpdateAppointmentDoctorRequest
  ): Promise<BaseResponse<AppointmentDoctorAssignment>> {
    const response = await this.client.put<
      BaseResponse<AppointmentDoctorAssignment>
    >(`/appointmentdoctor/${id}`, data);
    return response.data;
  }

  /**
   * Delete assignment
   * DELETE /api/appointmentdoctor/{id}
   */
  async deleteAssignment(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `/appointmentdoctor/${id}`
    );
    return response.data;
  }

  /**
   * Get assignments by appointment
   * GET /api/appointmentdoctor/appointment/{appointmentId}
   */
  async getAssignmentsByAppointment(
    appointmentId: string,
    params?: PagingModel
  ): Promise<DynamicResponse<AppointmentDoctorAssignment>> {
    const response = await this.client.get<
      DynamicResponse<AppointmentDoctorAssignment>
    >(`/appointmentdoctor/appointment/${appointmentId}`, {
      params: mapPagingOnly(params),
    });
    return response.data;
  }

  /**
   * Get assignments by doctor
   * GET /api/appointmentdoctor/doctor/{doctorId}
   */
  async getAssignmentsByDoctor(
    doctorId: string,
    params?: PagingModel
  ): Promise<DynamicResponse<AppointmentDoctorAssignment>> {
    const response = await this.client.get<
      DynamicResponse<AppointmentDoctorAssignment>
    >(`/appointmentdoctor/doctor/${doctorId}`, {
      params: mapPagingOnly(params),
    });
    return response.data;
  }
}
