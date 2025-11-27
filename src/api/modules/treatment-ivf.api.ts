import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  TreatmentIVF,
  TreatmentIVFCreateUpdateRequest,
} from "../types";

/**
 * Treatment IVF API
 *
 * Backend Endpoints:
 * - GET    /api/treatments/ivf/{treatmentId}
 * - GET    /api/treatments/ivf/patient/{patientId}
 * - POST   /api/treatments/ivf
 * - PUT    /api/treatments/ivf/{id}
 * - DELETE /api/treatments/ivf/{id}
 */
export class TreatmentIVFApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get IVF treatment by treatment ID
   * GET /api/treatments/ivf/{treatmentId}
   */
  async getIVFByTreatmentId(
    treatmentId: string
  ): Promise<BaseResponse<TreatmentIVF>> {
    const response = await this.client.get<BaseResponse<TreatmentIVF>>(
      `/treatments/ivf/${treatmentId}`
    );
    return response.data;
  }

  /**
   * Get IVF treatments by patient ID
   * GET /api/treatments/ivf/patient/{patientId}
   */
  async getIVFByPatientId(
    patientId: string
  ): Promise<BaseResponse<TreatmentIVF[]> | PaginatedResponse<TreatmentIVF>> {
    const response = await this.client.get<
      BaseResponse<TreatmentIVF[]> | PaginatedResponse<TreatmentIVF>
    >(`/treatments/ivf/patient/${patientId}`);
    return response.data;
  }

  /**
   * Create new IVF treatment
   * POST /api/treatments/ivf
   */
  async createIVF(
    data: TreatmentIVFCreateUpdateRequest
  ): Promise<BaseResponse<TreatmentIVF>> {
    const response = await this.client.post<BaseResponse<TreatmentIVF>>(
      "/treatments/ivf",
      data
    );
    return response.data;
  }

  /**
   * Update IVF treatment
   * PUT /api/treatments/ivf/{id}
   */
  async updateIVF(
    id: string,
    data: TreatmentIVFCreateUpdateRequest
  ): Promise<BaseResponse<TreatmentIVF>> {
    const response = await this.client.put<BaseResponse<TreatmentIVF>>(
      `/treatments/ivf/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete IVF treatment
   * DELETE /api/treatments/ivf/{id}
   */
  async deleteIVF(id: string): Promise<BaseResponse<null>> {
    const response = await this.client.delete<BaseResponse<null>>(
      `/treatments/ivf/${id}`
    );
    return response.data;
  }

  /**
   * Get current step for IVF treatment
   * GET /api/treatments/ivf/{treatmentId}/current-step
   */
  async getCurrentStep(
    treatmentId: string
  ): Promise<BaseResponse<number>> {
    const response = await this.client.get<BaseResponse<number>>(
      `/treatments/ivf/${treatmentId}/current-step`
    );
    return response.data;
  }
}
