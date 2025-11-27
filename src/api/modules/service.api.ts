import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  Service,
  ServiceListQuery,
} from "../types";

/**
 * Service API
 */
export class ServiceApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapServiceListQuery(params?: ServiceListQuery) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      page: (params as any).page ?? (params as any).Page ?? params.pageNumber,
      size: (params as any).size ?? (params as any).Size ?? params.pageSize,
      sort: (params as any).sort ?? (params as any).Sort,
      order: (params as any).order ?? (params as any).Order,
      searchTerm: params.searchTerm ?? (params as any).SearchTerm,
      ServiceCategoryId: params.categoryId ?? (params as any).ServiceCategoryId,
      categoryId: params.categoryId ?? (params as any).ServiceCategoryId,
      isActive: params.isActive ?? (params as any).IsActive ?? (params as any).Status,
      minPrice: (params as any).minPrice ?? (params as any).MinPrice,
      maxPrice: (params as any).maxPrice ?? (params as any).MaxPrice,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

  /**
   * Get list of services
   * GET /api/service
   */
  async getServices(
    params?: ServiceListQuery
  ): Promise<DynamicResponse<Service>> {
    const response = await this.client.get<DynamicResponse<Service>>(
      "/Service",
      { params: this.mapServiceListQuery(params) }
    );
    return response.data;
  }

  /**
   * Get service by ID
   * GET /api/service/{id}
   */
  async getServiceById(id: string): Promise<BaseResponse<Service>> {
    const response = await this.client.get<BaseResponse<Service>>(
      `/Service/${id}`
    );
    return response.data;
  }

  /**
   * Create new service
   * POST /api/service
   */
  async createService(data: Partial<Service>): Promise<BaseResponse<Service>> {
    const response = await this.client.post<BaseResponse<Service>>(
      "/Service",
      data
    );
    return response.data;
  }

  /**
   * Update service
   * PUT /api/service/{id}
   */
  async updateService(
    id: string,
    data: Partial<Service>
  ): Promise<BaseResponse<Service>> {
    const response = await this.client.put<BaseResponse<Service>>(
      `/Service/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete service
   * DELETE /api/service/{id}
   */
  async deleteService(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(`/Service/${id}`);
    return response.data;
  }

  /**
   * Get active services
   * GET /api/Service/active
   */
  async getActiveServices(): Promise<BaseResponse<Service[]>> {
    const response = await this.client.get<BaseResponse<Service[]>>(
      "/Service/active"
    );
    return response.data;
  }

  /**
   * Get services by category
   * GET /api/service/category/{categoryId}
   */
  async getServicesByCategory(
    categoryId: string,
    params?: ServiceListQuery
  ): Promise<DynamicResponse<Service>> {
    const response = await this.client.get<DynamicResponse<Service>>(
      `/Service/category/${categoryId}`,
      { params: this.mapServiceListQuery(params) }
    );
    return response.data;
  }

  /**
   * Search services
   * GET /api/service/search
   */
  async searchServices(
    params?: ServiceListQuery
  ): Promise<DynamicResponse<Service>> {
    const response = await this.client.get<DynamicResponse<Service>>(
      "/Service/search",
      { params: this.mapServiceListQuery(params) }
    );
    return response.data;
  }
}
