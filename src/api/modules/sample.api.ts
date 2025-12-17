import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  LabSample,
  SampleListQuery,
  LabSampleDetailResponse,
  GetAllDetailSamplesQuery,
} from "../types";

/**
 * Lab Sample API
 */
export class SampleApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapSampleListQuery(params?: SampleListQuery) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      page: (params as any).page ?? (params as any).Page ?? params.pageNumber,
      size: (params as any).size ?? (params as any).Size ?? params.pageSize,
      sort: (params as any).sort ?? (params as any).Sort ?? (params as any).sortBy,
      order: (params as any).order ?? (params as any).Order ?? (params as any).sortOrder,
      sampleType: params.sampleType ?? (params as any).SampleType,
      status: params.status ?? (params as any).Status,
      searchTerm: params.searchTerm ?? (params as any).SearchTerm,
      patientId: params.patientId ?? (params as any).PatientId,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

  /**
   * Get list of samples
   * GET /api/sample
   */
  async getSamples(
    params?: SampleListQuery
  ): Promise<DynamicResponse<LabSample>> {
    const response = await this.client.get<DynamicResponse<LabSample>>(
      "/LabSample",
      { params: this.mapSampleListQuery(params) }
    );
    return response.data;
  }

  /**
   * Get sample by ID
   * GET /api/sample/{id}
   */
  async getSampleById(id: string): Promise<BaseResponse<LabSample>> {
    const response = await this.client.get<BaseResponse<LabSample>>(
      `/LabSample/${id}`
    );
    return response.data;
  }

  /**
   * Create new sample
   * POST /api/sample
   */
  async createSample(
    data: Partial<LabSample>
  ): Promise<BaseResponse<LabSample>> {
    const response = await this.client.post<BaseResponse<LabSample>>(
      "/LabSample",
      data
    );
    return response.data;
  }

  /**
   * Update sample
   * PUT /api/sample/{id}
   */
  async updateSample(
    id: string,
    data: Partial<LabSample>
  ): Promise<BaseResponse<LabSample>> {
    const response = await this.client.put<BaseResponse<LabSample>>(
      `/LabSample/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete sample
   * DELETE /api/sample/{id}
   */
  async deleteSample(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(`/LabSample/${id}`);
    return response.data;
  }

  /**
   * Get all detail samples with nested objects
   * GET /api/labsample/all-detail
   */
  async getAllDetailSamples(
    params: GetAllDetailSamplesQuery
  ): Promise<DynamicResponse<LabSampleDetailResponse>> {
    // Map parameters to API format
    const queryParams: Record<string, any> = {};
    
    // Required parameter
    queryParams.SampleType = params.SampleType || params.sampleType;
    
    // Optional parameters (new API format - priority)
    if (params.Status !== undefined) queryParams.Status = params.Status;
    if (params.CanFrozen !== undefined) queryParams.CanFrozen = params.CanFrozen;
    if (params.SearchTerm !== undefined) queryParams.SearchTerm = params.SearchTerm;
    if (params.PatientId !== undefined) queryParams.PatientId = params.PatientId;
    if (params.Page !== undefined) queryParams.Page = params.Page;
    if (params.Size !== undefined) queryParams.Size = params.Size;
    if (params.Sort !== undefined) queryParams.Sort = params.Sort;
    if (params.Order !== undefined) queryParams.Order = params.Order;
    
    // Legacy parameters (fallback if new ones not provided)
    if (params.status !== undefined && params.Status === undefined) {
      queryParams.Status = params.status;
    }
    if (params.canFrozen !== undefined && params.CanFrozen === undefined) {
      queryParams.CanFrozen = params.canFrozen;
    }
    if (params.searchTerm !== undefined && params.SearchTerm === undefined) {
      queryParams.SearchTerm = params.searchTerm;
    }
    if (params.patientId !== undefined && params.PatientId === undefined) {
      queryParams.PatientId = params.patientId;
    }
    if (params.pageNumber !== undefined && params.Page === undefined) {
      queryParams.Page = params.pageNumber;
    }
    if (params.pageSize !== undefined && params.Size === undefined) {
      queryParams.Size = params.pageSize;
    }
    if (params.sort !== undefined && params.Sort === undefined) {
      queryParams.Sort = params.sort;
    }
    if (params.order !== undefined && params.Order === undefined) {
      queryParams.Order = params.order;
    }

    const response = await this.client.get<DynamicResponse<LabSampleDetailResponse>>(
      "/labsample/all-detail",
      { params: queryParams }
    );
    return response.data;
  }
}
