import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  Doctor,
  CreateDoctorRequest,
  UpdateDoctorRequest,
  GetDoctorsRequest,
  GetAvailableDoctorsRequest,
  DoctorStatisticsResponse,
} from "../types";

/**
 * Doctor API
 * Matches Back-End API endpoints from /api/doctor/*
 */
export class DoctorApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapQueryParams(params?: GetDoctorsRequest) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm,
      specialty: params.specialty,
      isActive: params.isActive,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

  /**
   * Get list of doctors
   * GET /api/doctor
   */
  async getDoctors(
    params?: GetDoctorsRequest
  ): Promise<PaginatedResponse<Doctor>> {
    const response = await this.client.get<PaginatedResponse<Doctor>>(
      "/doctor",
      {
        params: this.mapQueryParams(params),
      }
    );
    return response.data;
  }

  /**
   * Get doctor by ID
   * GET /api/doctor/{id}
   */
  async getDoctorById(id: string): Promise<BaseResponse<Doctor>> {
    const response = await this.client.get<BaseResponse<Doctor>>(
      `/doctor/${id}`
    );
    return response.data;
  }

  /**
   * Get available doctors
   * GET /api/doctor/available
   */
  async getAvailableDoctors(
    params?: GetAvailableDoctorsRequest
  ): Promise<PaginatedResponse<Doctor>> {
    const response = await this.client.get<PaginatedResponse<Doctor>>(
      "/doctor/available",
      { params }
    );
    return response.data;
  }

  /**
   * Create new doctor
   * POST /api/doctor
   */
  async createDoctor(data: CreateDoctorRequest): Promise<BaseResponse<Doctor>> {
    const response = await this.client.post<BaseResponse<Doctor>>(
      "/doctor",
      data
    );
    return response.data;
  }

  /**
   * Update doctor
   * PUT /api/doctor/{id}
   */
  async updateDoctor(
    id: string,
    data: UpdateDoctorRequest
  ): Promise<BaseResponse<Doctor>> {
    const response = await this.client.put<BaseResponse<Doctor>>(
      `/doctor/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Get doctor statistics
   * GET /api/doctor/statistics
   */
  async getDoctorStatistics(): Promise<BaseResponse<DoctorStatisticsResponse>> {
    const response =
      await this.client.get<BaseResponse<DoctorStatisticsResponse>>(
        "/doctor/statistics"
      );
    return response.data;
  }

  /**
   * Get available specialties
   * GET /api/doctor/specialties
   */
  async getDoctorSpecialties(): Promise<BaseResponse<string[]>> {
    const response = await this.client.get<BaseResponse<string[]>>(
      "/doctor/specialties"
    );
    return response.data;
  }
}
