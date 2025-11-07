import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  TreatmentCycle,
  TreatmentCycleListQuery,
  StartTreatmentCycleRequest,
  CompleteTreatmentCycleRequest,
  CancelTreatmentCycleRequest,
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
      "/treatment-cycles",
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
      `/treatment-cycles/${id}`
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
      "/treatment-cycles",
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
      `/treatment-cycles/${id}`,
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
      `/treatment-cycles/${id}`
    );
    return response.data;
  }

  /**
   * Start treatment cycle
   * POST /api/treatment-cycles/{id}/start
   */
  async startTreatmentCycle(
    id: string,
    data?: StartTreatmentCycleRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.post<BaseResponse<TreatmentCycle>>(
      `/treatment-cycles/${id}/start`,
      data
    );
    return response.data;
  }

  /**
   * Complete treatment cycle
   * POST /api/treatment-cycles/{id}/complete
   */
  async completeTreatmentCycle(
    id: string,
    data: CompleteTreatmentCycleRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.post<BaseResponse<TreatmentCycle>>(
      `/treatment-cycles/${id}/complete`,
      data
    );
    return response.data;
  }

  /**
   * Cancel treatment cycle
   * POST /api/treatment-cycles/{id}/cancel
   */
  async cancelTreatmentCycle(
    id: string,
    data: CancelTreatmentCycleRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.post<BaseResponse<TreatmentCycle>>(
      `/treatment-cycles/${id}/cancel`,
      data
    );
    return response.data;
  }
}
