import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  ServiceRequest,
  ServiceRequestListQuery,
} from "../types";

/**
 * Service Request API
 */
export class ServiceRequestApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of service requests
   * GET /api/service-request
   */
  async getServiceRequests(
    params?: ServiceRequestListQuery
  ): Promise<DynamicResponse<ServiceRequest>> {
    const response = await this.client.get<DynamicResponse<ServiceRequest>>(
      "/service-request",
      { params }
    );
    return response.data;
  }

  /**
   * Get service request by ID
   * GET /api/service-request/{id}
   */
  async getServiceRequestById(
    id: string
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.get<BaseResponse<ServiceRequest>>(
      `/service-request/${id}`
    );
    return response.data;
  }

  /**
   * Create new service request
   * POST /api/service-request
   */
  async createServiceRequest(
    data: Partial<ServiceRequest>
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.post<BaseResponse<ServiceRequest>>(
      "/service-request",
      data
    );
    return response.data;
  }

  /**
   * Update service request
   * PUT /api/service-request/{id}
   */
  async updateServiceRequest(
    id: string,
    data: Partial<ServiceRequest>
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.put<BaseResponse<ServiceRequest>>(
      `/service-request/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete service request
   * DELETE /api/service-request/{id}
   */
  async deleteServiceRequest(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `/service-request/${id}`
    );
    return response.data;
  }
}
