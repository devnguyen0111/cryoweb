import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  Treatment,
  TreatmentListQuery,
} from "../types";

/**
 * Treatment API
 */
export class TreatmentApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of treatments
   * GET /api/treatment
   */
  async getTreatments(
    params?: TreatmentListQuery
  ): Promise<DynamicResponse<Treatment>> {
    const response = await this.client.get<DynamicResponse<Treatment>>(
      "/treatment",
      { params }
    );
    return response.data;
  }

  /**
   * Get treatment by ID
   * GET /api/treatment/{id}
   */
  async getTreatmentById(id: string): Promise<BaseResponse<Treatment>> {
    const response = await this.client.get<BaseResponse<Treatment>>(
      `/treatment/${id}`
    );
    return response.data;
  }

  /**
   * Create new treatment (encounter)
   * POST /api/treatment
   */
  async createTreatment(
    data: Partial<Treatment>
  ): Promise<BaseResponse<Treatment>> {
    const response = await this.client.post<BaseResponse<Treatment>>(
      "/treatment",
      data
    );
    return response.data;
  }

  /**
   * Update treatment
   * PUT /api/treatment/{id}
   */
  async updateTreatment(
    id: string,
    data: Partial<Treatment>
  ): Promise<BaseResponse<Treatment>> {
    const response = await this.client.put<BaseResponse<Treatment>>(
      `/treatment/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete treatment
   * DELETE /api/treatment/{id}
   */
  async deleteTreatment(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/treatment/${id}`);
    return response.data;
  }
}
