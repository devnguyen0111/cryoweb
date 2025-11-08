import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  Patient,
  PatientListQuery,
} from "../types";

/**
 * Patient API
 */
export class PatientApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of patients
   * GET /api/patient
   */
  async getPatients(
    params?: PatientListQuery
  ): Promise<DynamicResponse<Patient>> {
    const response = await this.client.get<DynamicResponse<Patient>>(
      "/patient",
      { params }
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
  async getPatientDetails(id: string): Promise<BaseResponse<Patient>> {
    const response = await this.client.get<BaseResponse<Patient>>(
      `/patient/${id}/details`
    );
    return response.data;
  }

  /**
   * Create new patient
   * POST /api/patient
   */
  async createPatient(data: Partial<Patient>): Promise<BaseResponse<Patient>> {
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
    data: Partial<Patient>
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
  async deletePatient(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/patient/${id}`);
    return response.data;
  }
}
