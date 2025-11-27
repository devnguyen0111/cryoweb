import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  Agreement,
  AgreementDetailResponse,
  AgreementCreateRequest,
  AgreementUpdateRequest,
  AgreementSignRequest,
  AgreementListQuery,
  PaginatedResponse,
} from "../types";

/**
 * Agreement API
 *
 * Backend Endpoints:
 * - GET    /api/agreement
 * - POST   /api/agreement
 * - GET    /api/agreement/{id}
 * - PUT    /api/agreement/{id}
 * - DELETE /api/agreement/{id}
 * - GET    /api/agreement/code/{code}
 * - POST   /api/agreement/{id}/sign
 * - PUT    /api/agreement/{id}/status
 */
export class AgreementApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of agreements
   * GET /api/agreement
   */
  async getAgreements(
    params?: AgreementListQuery
  ): Promise<PaginatedResponse<Agreement>> {
    // Map frontend params to backend params
    const backendParams: any = {};
    if (params?.TreatmentId) backendParams.TreatmentId = params.TreatmentId;
    if (params?.PatientId) backendParams.PatientId = params.PatientId;
    if (params?.Status) backendParams.Status = params.Status;
    if (params?.FromStartDate)
      backendParams.FromStartDate = params.FromStartDate;
    if (params?.ToStartDate) backendParams.ToStartDate = params.ToStartDate;
    if (params?.FromEndDate) backendParams.FromEndDate = params.FromEndDate;
    if (params?.ToEndDate) backendParams.ToEndDate = params.ToEndDate;
    if (params?.SignedByPatient !== undefined)
      backendParams.SignedByPatient = params.SignedByPatient;
    if (params?.SignedByDoctor !== undefined)
      backendParams.SignedByDoctor = params.SignedByDoctor;
    if (params?.SearchTerm) backendParams.SearchTerm = params.SearchTerm;
    if (params?.Page !== undefined) backendParams.Page = params.Page;
    if (params?.Size !== undefined) backendParams.Size = params.Size;
    if (params?.Sort) backendParams.Sort = params.Sort;
    if (params?.Order) backendParams.Order = params.Order;

    // Legacy support for old parameter names
    if (params && "treatmentId" in params && !backendParams.TreatmentId) {
      backendParams.TreatmentId = (params as any).treatmentId;
    }
    if (params && "patientId" in params && !backendParams.PatientId) {
      backendParams.PatientId = (params as any).patientId;
    }
    if (params && "pageNumber" in params && !backendParams.Page) {
      backendParams.Page = (params as any).pageNumber;
    }
    if (params && "pageSize" in params && !backendParams.Size) {
      backendParams.Size = (params as any).pageSize;
    }

    const response = await this.client.get<PaginatedResponse<Agreement>>(
      "/agreement",
      { params: backendParams }
    );
    return response.data;
  }

  /**
   * Create new agreement
   * POST /api/agreement
   */
  async createAgreement(
    data: AgreementCreateRequest
  ): Promise<BaseResponse<Agreement>> {
    const response = await this.client.post<BaseResponse<Agreement>>(
      "/agreement",
      data
    );
    return response.data;
  }

  /**
   * Get agreement by ID
   * GET /api/agreement/{id}
   */
  async getAgreementById(
    id: string
  ): Promise<BaseResponse<AgreementDetailResponse>> {
    const response = await this.client.get<
      BaseResponse<AgreementDetailResponse>
    >(`/agreement/${id}`);
    return response.data;
  }

  /**
   * Update agreement
   * PUT /api/agreement/{id}
   */
  async updateAgreement(
    id: string,
    data: AgreementUpdateRequest
  ): Promise<BaseResponse<Agreement>> {
    const response = await this.client.put<BaseResponse<Agreement>>(
      `/agreement/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete agreement
   * DELETE /api/agreement/{id}
   */
  async deleteAgreement(id: string): Promise<BaseResponse<null>> {
    const response = await this.client.delete<BaseResponse<null>>(
      `/agreement/${id}`
    );
    return response.data;
  }

  /**
   * Get agreement by code
   * GET /api/agreement/code/{code}
   */
  async getAgreementByCode(code: string): Promise<BaseResponse<Agreement>> {
    const response = await this.client.get<BaseResponse<Agreement>>(
      `/agreement/code/${code}`
    );
    return response.data;
  }

  /**
   * Sign agreement
   * POST /api/agreement/{id}/sign
   */
  async signAgreement(
    id: string,
    data: AgreementSignRequest
  ): Promise<BaseResponse<Agreement>> {
    const response = await this.client.post<BaseResponse<Agreement>>(
      `/agreement/${id}/sign`,
      data
    );
    return response.data;
  }

  /**
   * Update agreement status
   * PUT /api/agreement/{id}/status
   */
  async updateAgreementStatus(
    id: string,
    status: string
  ): Promise<BaseResponse<Agreement>> {
    const response = await this.client.put<BaseResponse<Agreement>>(
      `/agreement/${id}/status`,
      status // Request body is just the status string, not an object
    );
    return response.data;
  }

  /**
   * Request signature for agreement
   * POST /api/agreement/{id}/request-signature
   */
  async requestSignature(
    id: string,
    data?: { email?: string; phone?: string }
  ): Promise<BaseResponse<Agreement>> {
    const response = await this.client.post<BaseResponse<Agreement>>(
      `/agreement/${id}/request-signature`,
      data || {}
    );
    return response.data;
  }

  /**
   * Verify signature for agreement
   * POST /api/agreement/{id}/verify-signature
   */
  async verifySignature(
    id: string,
    data: { code: string; signature?: string }
  ): Promise<BaseResponse<Agreement>> {
    const response = await this.client.post<BaseResponse<Agreement>>(
      `/agreement/${id}/verify-signature`,
      data
    );
    return response.data;
  }
}
