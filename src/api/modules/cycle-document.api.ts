import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  CycleDocument,
  UploadCycleDocumentRequest,
} from "../types";

/**
 * Cycle Document API
 */
export class CycleDocumentApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of cycle documents
   * GET /api/treatment-cycles/{treatmentCycleId}/documents
   */
  async getCycleDocuments(
    treatmentCycleId: string
  ): Promise<DynamicResponse<CycleDocument>> {
    const response = await this.client.get<DynamicResponse<CycleDocument>>(
      `/treatment-cycles/${treatmentCycleId}/documents`
    );
    return response.data;
  }

  /**
   * Get cycle document by ID
   * GET /api/treatment-cycles/{treatmentCycleId}/documents/{id}
   */
  async getCycleDocumentById(
    treatmentCycleId: string,
    id: string
  ): Promise<BaseResponse<CycleDocument>> {
    const response = await this.client.get<BaseResponse<CycleDocument>>(
      `/treatment-cycles/${treatmentCycleId}/documents/${id}`
    );
    return response.data;
  }

  /**
   * Upload cycle document
   * POST /api/treatment-cycles/{treatmentCycleId}/documents
   */
  async uploadCycleDocument(
    treatmentCycleId: string,
    data: UploadCycleDocumentRequest
  ): Promise<BaseResponse<CycleDocument>> {
    const response = await this.client.post<BaseResponse<CycleDocument>>(
      `/treatment-cycles/${treatmentCycleId}/documents`,
      data
    );
    return response.data;
  }

  /**
   * Update cycle document
   * PUT /api/treatment-cycles/{treatmentCycleId}/documents/{id}
   */
  async updateCycleDocument(
    treatmentCycleId: string,
    id: string,
    data: Partial<CycleDocument>
  ): Promise<BaseResponse<CycleDocument>> {
    const response = await this.client.put<BaseResponse<CycleDocument>>(
      `/treatment-cycles/${treatmentCycleId}/documents/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete cycle document
   * DELETE /api/treatment-cycles/{treatmentCycleId}/documents/{id}
   */
  async deleteCycleDocument(
    treatmentCycleId: string,
    id: string
  ): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `/treatment-cycles/${treatmentCycleId}/documents/${id}`
    );
    return response.data;
  }
}
