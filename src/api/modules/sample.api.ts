import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  LabSample,
  SampleListQuery,
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
      page: params.page ?? params.Page,
      size: params.size ?? params.Size,
      sort: params.sort ?? params.Sort,
      order: params.order ?? params.Order,
      sampleType: params.sampleType ?? params.SampleType,
      status: params.status ?? params.Status,
      searchTerm: params.searchTerm ?? params.SearchTerm,
      patientId: params.patientId ?? params.PatientId,
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
  async deleteSample(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/LabSample/${id}`);
    return response.data;
  }
}
