import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  ServiceRequest,
  ServiceRequestListQuery,
} from "../types";

const BASE_PATH = "/servicerequest";
const STATUS_PATH = `${BASE_PATH}/status`;

export class ServiceRequestApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of service requests
   * GET /api/servicerequest
   */
  async getServiceRequests(
    params?: ServiceRequestListQuery
  ): Promise<DynamicResponse<ServiceRequest>> {
    const { Status, ...rest } = params ?? {};

    if (Status !== undefined && Status !== null && Status !== "") {
      const response = await this.client.get<DynamicResponse<ServiceRequest>>(
        `${STATUS_PATH}/${encodeURIComponent(Status)}`,
        { params: rest }
      );
      return response.data;
    }

    const response = await this.client.get<DynamicResponse<ServiceRequest>>(
      BASE_PATH,
      { params }
    );
    return response.data;
  }

  /**
   * Get service request by ID
   * GET /api/servicerequest/{id}
   */
  async getServiceRequestById(
    id: string
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.get<BaseResponse<ServiceRequest>>(
      `${BASE_PATH}/${id}`
    );
    return response.data;
  }

  /**
   * Create new service request
   * POST /api/servicerequest
   */
  async createServiceRequest(
    data: Partial<ServiceRequest>
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.post<BaseResponse<ServiceRequest>>(
      BASE_PATH,
      data
    );
    return response.data;
  }

  /**
   * Update service request
   * PUT /api/servicerequest/{id}
   */
  async updateServiceRequest(
    id: string,
    data: Partial<ServiceRequest>
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.put<BaseResponse<ServiceRequest>>(
      `${BASE_PATH}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete service request
   * DELETE /api/servicerequest/{id}
   */
  async deleteServiceRequest(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `${BASE_PATH}/${id}`
    );
    return response.data;
  }
}
