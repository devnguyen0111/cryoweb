import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  TreatmentCycle,
  TreatmentCycleListQuery,
} from "../types";

/**
 * Treatment Cycle API
 */
export class TreatmentCycleApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of treatment cycles
   * GET /api/treatment-cycle
   */
  async getTreatmentCycles(
    params?: TreatmentCycleListQuery
  ): Promise<DynamicResponse<TreatmentCycle>> {
    const response = await this.client.get<DynamicResponse<TreatmentCycle>>(
      "/treatment-cycle",
      { params }
    );
    return response.data;
  }

  /**
   * Get treatment cycle by ID
   * GET /api/treatment-cycle/{id}
   */
  async getTreatmentCycleById(
    id: string
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.get<BaseResponse<TreatmentCycle>>(
      `/treatment-cycle/${id}`
    );
    return response.data;
  }

  /**
   * Create new treatment cycle
   * POST /api/treatment-cycle
   */
  async createTreatmentCycle(
    data: Partial<TreatmentCycle>
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.post<BaseResponse<TreatmentCycle>>(
      "/treatment-cycle",
      data
    );
    return response.data;
  }

  /**
   * Update treatment cycle
   * PUT /api/treatment-cycle/{id}
   */
  async updateTreatmentCycle(
    id: string,
    data: Partial<TreatmentCycle>
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.put<BaseResponse<TreatmentCycle>>(
      `/treatment-cycle/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete treatment cycle
   * DELETE /api/treatment-cycle/{id}
   */
  async deleteTreatmentCycle(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `/treatment-cycle/${id}`
    );
    return response.data;
  }
}
