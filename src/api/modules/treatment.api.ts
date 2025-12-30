import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  Treatment,
  TreatmentListQuery,
} from "../types";

/**
 * Treatment API
 *
 * Backend Endpoints:
 * - GET    /api/treatment
 * - POST   /api/treatment
 * - GET    /api/treatment/{id}
 * - PUT    /api/treatment/{id}
 * - DELETE /api/treatment/{id}
 * - PUT    /api/treatment/{id}/status
 *
 * Note: Treatment entity exists and has doctorId field for filtering
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
    const mapped = params
      ? {
          PageNumber: params.pageNumber,
          PageSize: params.pageSize,
          TreatmentType: params.treatmentType,
          Status: params.status,
          PatientId: params.patientId,
          DoctorId: params.doctorId,
        }
      : undefined;

    // Remove undefined values
    if (mapped) {
      Object.keys(mapped).forEach((key) => {
        if ((mapped as any)[key] === undefined) {
          delete (mapped as any)[key];
        }
      });
    }

    const response = await this.client.get<DynamicResponse<Treatment>>(
      "/treatment",
      { params: mapped }
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
   * Create new treatment
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
  async deleteTreatment(id: string): Promise<BaseResponse<null>> {
    const response = await this.client.delete<BaseResponse<null>>(
      `/treatment/${id}`
    );
    return response.data;
  }

  /**
   * Update treatment status
   * PUT /api/treatment/{id}/status
   */
  async updateTreatmentStatus(
    id: string,
    status: string
  ): Promise<BaseResponse<Treatment>> {
    const response = await this.client.put<BaseResponse<Treatment>>(
      `/treatment/${id}/status`,
      { status }
    );
    return response.data;
  }

  /**
   * Cancel remaining cycles for a treatment
   * PUT /api/treatment/{treatmentId}/cancel-remaining-cycles
   */
  async cancelRemainingCycles(
    treatmentId: string
  ): Promise<BaseResponse<Treatment>> {
    const response = await this.client.put<BaseResponse<Treatment>>(
      `/treatment/${treatmentId}/cancel-remaining-cycles`
    );
    return response.data;
  }
}
