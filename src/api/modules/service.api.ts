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

  /**
   * Get list of services
   * GET /api/service
   */
  async getServices(
    params?: ServiceListQuery
  ): Promise<DynamicResponse<Service>> {
    const response = await this.client.get<DynamicResponse<Service>>(
      "/service",
      { params }
    );
    return response.data;
  }

  /**
   * Get service by ID
   * GET /api/service/{id}
   */
  async getServiceById(id: string): Promise<BaseResponse<Service>> {
    const response = await this.client.get<BaseResponse<Service>>(
      `/service/${id}`
    );
    return response.data;
  }

  /**
   * Create new service
   * POST /api/service
   */
  async createService(data: Partial<Service>): Promise<BaseResponse<Service>> {
    const response = await this.client.post<BaseResponse<Service>>(
      "/service",
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
      `/service/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete service
   * DELETE /api/service/{id}
   */
  async deleteService(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/service/${id}`);
    return response.data;
  }
}
