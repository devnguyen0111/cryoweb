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
      page: params.page ?? params.Page,
      size: params.size ?? params.Size,
      sort: params.sort ?? params.Sort,
      order: params.order ?? params.Order,
      searchTerm: params.searchTerm ?? params.SearchTerm,
      serviceCategoryId:
        params.serviceCategoryId ?? params.ServiceCategoryId,
      isActive: params.isActive ?? params.Status,
      minPrice: params.minPrice ?? params.MinPrice,
      maxPrice: params.maxPrice ?? params.MaxPrice,
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
  async deleteService(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/Service/${id}`);
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
}
