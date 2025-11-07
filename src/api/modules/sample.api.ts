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

  /**
   * Get list of samples
   * GET /api/sample
   */
  async getSamples(
    params?: SampleListQuery
  ): Promise<DynamicResponse<LabSample>> {
    const response = await this.client.get<DynamicResponse<LabSample>>(
      "/labsample",
      { params }
    );
    return response.data;
  }

  /**
   * Get sample by ID
   * GET /api/sample/{id}
   */
  async getSampleById(id: string): Promise<BaseResponse<LabSample>> {
    const response = await this.client.get<BaseResponse<LabSample>>(
      `/labsample/${id}`
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
      "/labsample",
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
      `/labsample/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete sample
   * DELETE /api/sample/{id}
   */
  async deleteSample(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/labsample/${id}`);
    return response.data;
  }
}
