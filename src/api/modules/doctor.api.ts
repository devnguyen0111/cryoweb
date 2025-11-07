import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  Doctor,
  DoctorListQuery,
  DoctorStatistics,
} from "../types";

/**
 * Doctor API
 */
export class DoctorApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of doctors
   * GET /api/doctor
   */
  async getDoctors(params?: DoctorListQuery): Promise<DynamicResponse<Doctor>> {
    const response = await this.client.get<DynamicResponse<Doctor>>("/doctor", {
      params,
    });
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
   * Get doctor statistics
   * GET /api/doctor/{id}/statistics
   */
  async getDoctorStatistics(
    id: string
  ): Promise<BaseResponse<DoctorStatistics>> {
    const response = await this.client.get<BaseResponse<DoctorStatistics>>(
      `/doctor/${id}/statistics`
    );
    return response.data;
  }

  /**
   * Create new doctor
   * POST /api/doctor
   */
  async createDoctor(data: Partial<Doctor>): Promise<BaseResponse<Doctor>> {
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
    data: Partial<Doctor>
  ): Promise<BaseResponse<Doctor>> {
    const response = await this.client.put<BaseResponse<Doctor>>(
      `/doctor/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete doctor
   * DELETE /api/doctor/{id}
   */
  async deleteDoctor(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/doctor/${id}`);
    return response.data;
  }
}
