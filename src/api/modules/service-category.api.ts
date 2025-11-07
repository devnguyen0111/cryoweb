import { AxiosInstance } from "axios";
import type { BaseResponse, DynamicResponse, ServiceCategory } from "../types";

/**
 * Service Category API
 */
export class ServiceCategoryApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of service categories
   * GET /api/service-category
   */
  async getServiceCategories(params?: {
    Page?: number;
    Size?: number;
    SearchTerm?: string;
  }): Promise<DynamicResponse<ServiceCategory>> {
    const response = await this.client.get<DynamicResponse<ServiceCategory>>(
      "/service-category",
      { params }
    );
    return response.data;
  }

  /**
   * Get service category by ID
   * GET /api/service-category/{id}
   */
  async getServiceCategoryById(
    id: string
  ): Promise<BaseResponse<ServiceCategory>> {
    const response = await this.client.get<BaseResponse<ServiceCategory>>(
      `/service-category/${id}`
    );
    return response.data;
  }

  /**
   * Create new service category
   * POST /api/service-category
   */
  async createServiceCategory(
    data: Partial<ServiceCategory>
  ): Promise<BaseResponse<ServiceCategory>> {
    const response = await this.client.post<BaseResponse<ServiceCategory>>(
      "/service-category",
      data
    );
    return response.data;
  }

  /**
   * Update service category
   * PUT /api/service-category/{id}
   */
  async updateServiceCategory(
    id: string,
    data: Partial<ServiceCategory>
  ): Promise<BaseResponse<ServiceCategory>> {
    const response = await this.client.put<BaseResponse<ServiceCategory>>(
      `/service-category/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete service category
   * DELETE /api/service-category/{id}
   */
  async deleteServiceCategory(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `/service-category/${id}`
    );
    return response.data;
  }
}
