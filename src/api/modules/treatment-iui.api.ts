import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  TreatmentIUI,
  TreatmentIUICreateUpdateRequest,
} from "../types";

/**
 * Treatment IUI API
 *
 * Backend Endpoints:
 * - GET    /api/treatments/iui/{treatmentId}
 * - GET    /api/treatments/iui/patient/{patientId}
 * - POST   /api/treatments/iui
 * - PUT    /api/treatments/iui/{id}
 * - DELETE /api/treatments/iui/{id}
 */
export class TreatmentIUIApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get IUI treatment by treatment ID
   * GET /api/treatments/iui/{treatmentId}
   */
  async getIUIByTreatmentId(
    treatmentId: string
  ): Promise<BaseResponse<TreatmentIUI>> {
    const response = await this.client.get<BaseResponse<TreatmentIUI>>(
      `/treatments/iui/${treatmentId}`
    );
    return response.data;
  }

  /**
   * Get IUI treatments by patient ID
   * GET /api/treatments/iui/patient/{patientId}
   */
  async getIUIByPatientId(
    patientId: string
  ): Promise<BaseResponse<TreatmentIUI[]> | PaginatedResponse<TreatmentIUI>> {
    const response = await this.client.get<
      BaseResponse<TreatmentIUI[]> | PaginatedResponse<TreatmentIUI>
    >(`/treatments/iui/patient/${patientId}`);
    return response.data;
  }

  /**
   * Create new IUI treatment
   * POST /api/treatments/iui
   */
  async createIUI(
    data: TreatmentIUICreateUpdateRequest
  ): Promise<BaseResponse<TreatmentIUI>> {
    const response = await this.client.post<BaseResponse<TreatmentIUI>>(
      "/treatments/iui",
      data
    );
    return response.data;
  }

  /**
   * Update IUI treatment
   * PUT /api/treatments/iui/{id}
   */
  async updateIUI(
    id: string,
    data: TreatmentIUICreateUpdateRequest
  ): Promise<BaseResponse<TreatmentIUI>> {
    const response = await this.client.put<BaseResponse<TreatmentIUI>>(
      `/treatments/iui/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete IUI treatment
   * DELETE /api/treatments/iui/{id}
   */
  async deleteIUI(id: string): Promise<BaseResponse<null>> {
    const response = await this.client.delete<BaseResponse<null>>(
      `/treatments/iui/${id}`
    );
    return response.data;
  }

  /**
   * Get current step for IUI treatment
   * GET /api/treatments/iui/{treatmentId}/current-step
   */
  async getCurrentStep(
    treatmentId: string
  ): Promise<BaseResponse<number>> {
    const response = await this.client.get<BaseResponse<number>>(
      `/treatments/iui/${treatmentId}/current-step`
    );
    return response.data;
  }
}
