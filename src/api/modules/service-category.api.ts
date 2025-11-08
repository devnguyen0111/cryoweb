import { AxiosInstance } from "axios";
import type { BaseResponse, DynamicResponse, ServiceCategory } from "../types";

/**
 * Service Category API
 */
export class ServiceCategoryApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of service categories
   * GET /api/servicecategory
   */
  async getServiceCategories(params?: {
    Page?: number;
    Size?: number;
    SearchTerm?: string;
  }): Promise<DynamicResponse<ServiceCategory>> {
    const response = await this.client.get<DynamicResponse<ServiceCategory>>(
      "/servicecategory",
      { params }
    );
    return response.data;
  }

  /**
   * Get service category by ID
   * GET /api/servicecategory/{id}
   */
  async getServiceCategoryById(
    id: string
  ): Promise<BaseResponse<ServiceCategory>> {
    const response = await this.client.get<BaseResponse<ServiceCategory>>(
      `/servicecategory/${id}`
    );
    return response.data;
  }

  /**
   * Create new service category
   * POST /api/servicecategory
   */
  async createServiceCategory(
    data: Partial<ServiceCategory>
  ): Promise<BaseResponse<ServiceCategory>> {
    const response = await this.client.post<BaseResponse<ServiceCategory>>(
      "/servicecategory",
      data
    );
    return response.data;
  }

  /**
   * Update service category
   * PUT /api/servicecategory/{id}
   */
  async updateServiceCategory(
    id: string,
    data: Partial<ServiceCategory>
  ): Promise<BaseResponse<ServiceCategory>> {
    const response = await this.client.put<BaseResponse<ServiceCategory>>(
      `/servicecategory/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete service category
   * DELETE /api/servicecategory/{id}
   */
  async deleteServiceCategory(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `/servicecategory/${id}`
    );
    return response.data;
  }
}
