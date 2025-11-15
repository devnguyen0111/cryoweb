import { AxiosInstance } from "axios";
import type { BaseResponse, DynamicResponse, ServiceCategory } from "../types";

/**
 * Service Category API
 */
export class ServiceCategoryApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapCategoryListQuery(params?: {
    page?: number;
    size?: number;
    searchTerm?: string;
    Page?: number;
    Size?: number;
    SearchTerm?: string;
  }) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      page: params.page ?? params.Page,
      size: params.size ?? params.Size,
      searchTerm: params.searchTerm ?? params.SearchTerm,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

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
      "/ServiceCategory",
      { params: this.mapCategoryListQuery(params) }
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
      `/ServiceCategory/${id}`
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
      "/ServiceCategory",
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
      `/ServiceCategory/${id}`,
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
      `/ServiceCategory/${id}`
    );
    return response.data;
  }
}
