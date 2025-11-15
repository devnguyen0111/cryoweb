import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  Patient,
  PatientDetailResponse,
  CreatePatientRequest,
  UpdatePatientRequest,
  GetPatientsRequest,
  PatientSearchResult,
  PatientStatisticsResponse,
} from "../types";

/**
 * Patient API
 * Matches Back-End API endpoints from /api/patient/*
 */
export class PatientApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapQueryParams(params?: GetPatientsRequest) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm,
      isActive: params.isActive,
      gender: params.gender,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

  /**
   * Get list of patients
   * GET /api/patient
   */
  async getPatients(
    params?: GetPatientsRequest
  ): Promise<PaginatedResponse<Patient>> {
    const response = await this.client.get<PaginatedResponse<Patient>>(
      "/patient",
      { params: this.mapQueryParams(params) }
    );
    return response.data;
  }

  /**
   * Get patient by ID
   * GET /api/patient/{id}
   */
  async getPatientById(id: string): Promise<BaseResponse<Patient>> {
    const response = await this.client.get<BaseResponse<Patient>>(
      `/patient/${id}`
    );
    return response.data;
  }

  /**
   * Get detailed patient information
   * GET /api/patient/{id}/details
   */
  async getPatientDetails(
    id: string
  ): Promise<BaseResponse<PatientDetailResponse>> {
    const response = await this.client.get<BaseResponse<PatientDetailResponse>>(
      `/patient/${id}/details`
    );
    return response.data;
  }

  /**
   * Create new patient
   * POST /api/patient
   */
  async createPatient(
    data: CreatePatientRequest
  ): Promise<BaseResponse<Patient>> {
    const response = await this.client.post<BaseResponse<Patient>>(
      "/patient",
      data
    );
    return response.data;
  }

  /**
   * Update patient
   * PUT /api/patient/{id}
   */
  async updatePatient(
    id: string,
    data: UpdatePatientRequest
  ): Promise<BaseResponse<Patient>> {
    const response = await this.client.put<BaseResponse<Patient>>(
      `/patient/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete patient
   * DELETE /api/patient/{id}
   */
  async deletePatient(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `/patient/${id}`
    );
    return response.data;
  }

  /**
   * Search patients
   * GET /api/patient/search
   */
  async searchPatients(
    searchTerm: string,
    params?: { pageNumber?: number; pageSize?: number }
  ): Promise<PaginatedResponse<PatientSearchResult>> {
    const response = await this.client.get<
      PaginatedResponse<PatientSearchResult>
    >("/patient/search", { params: { searchTerm, ...params } });
    return response.data;
  }

  /**
   * Get patient statistics
   * GET /api/patient/statistics
   */
  async getPatientStatistics(): Promise<
    BaseResponse<PatientStatisticsResponse>
  > {
    const response = await this.client.get<
      BaseResponse<PatientStatisticsResponse>
    >("/patient/statistics");
    return response.data;
  }
}
