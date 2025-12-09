import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  Prescription,
  PrescriptionDetailResponseFull,
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
  GetPrescriptionsRequest,
} from "../types";

/**
 * Prescription API
 *
 * Backend Endpoints:
 * - GET    /api/prescriptions
 * - POST   /api/prescriptions
 * - GET    /api/prescriptions/{id}
 * - PUT    /api/prescriptions/{id}
 * - DELETE /api/prescriptions/{id}
 */
export class PrescriptionApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapQueryParams(params?: GetPrescriptionsRequest) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      MedicalRecordId: params.MedicalRecordId,
      FromDate: params.FromDate,
      ToDate: params.ToDate,
      SearchTerm: params.SearchTerm,
      Page: params.Page,
      Size: params.Size,
      Sort: params.Sort,
      Order: params.Order,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

  /**
   * Get list of prescriptions
   * GET /api/prescriptions
   */
  async getPrescriptions(
    params?: GetPrescriptionsRequest
  ): Promise<PaginatedResponse<Prescription>> {
    const response = await this.client.get<PaginatedResponse<Prescription>>(
      "/prescriptions",
      { params: this.mapQueryParams(params) }
    );
    return response.data;
  }

  /**
   * Get prescription by ID
   * GET /api/prescriptions/{id}
   */
  async getPrescriptionById(
    id: string
  ): Promise<BaseResponse<PrescriptionDetailResponseFull>> {
    const response = await this.client.get<
      BaseResponse<PrescriptionDetailResponseFull>
    >(`/prescriptions/${id}`);
    return response.data;
  }

  /**
   * Create new prescription
   * POST /api/prescriptions
   */
  async createPrescription(
    data: CreatePrescriptionRequest
  ): Promise<BaseResponse<Prescription>> {
    const response = await this.client.post<BaseResponse<Prescription>>(
      "/prescriptions",
      data
    );
    return response.data;
  }

  /**
   * Update prescription
   * PUT /api/prescriptions/{id}
   */
  async updatePrescription(
    id: string,
    data: UpdatePrescriptionRequest
  ): Promise<BaseResponse<Prescription>> {
    const response = await this.client.put<BaseResponse<Prescription>>(
      `/prescriptions/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete prescription
   * DELETE /api/prescriptions/{id}
   */
  async deletePrescription(id: string): Promise<BaseResponse<string>> {
    const response = await this.client.delete<BaseResponse<string>>(
      `/prescriptions/${id}`
    );
    return response.data;
  }
}
