import { AxiosInstance } from "axios";
import type { BaseResponse, DynamicResponse } from "../types";

/**
 * Service Request Details Types
 */
export interface ServiceRequestDetails {
  id: string;
  serviceRequestId?: string;
  serviceId?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequestDetailsListQuery {
  Page?: number;
  Size?: number;
  ServiceRequestId?: string;
  ServiceId?: string;
  SearchTerm?: string;
}

/**
 * Service Request Details API
 */
export class ServiceRequestDetailsApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of service request details
   * GET /api/servicerequestdetails
   */
  async getServiceRequestDetails(
    params?: ServiceRequestDetailsListQuery
  ): Promise<DynamicResponse<ServiceRequestDetails>> {
    const response = await this.client.get<
      DynamicResponse<ServiceRequestDetails>
    >("/servicerequestdetails", { params });
    return response.data;
  }

  /**
   * Get service request details by ID
   * GET /api/servicerequestdetails/{id}
   */
  async getServiceRequestDetailsById(
    id: string
  ): Promise<BaseResponse<ServiceRequestDetails>> {
    const response = await this.client.get<BaseResponse<ServiceRequestDetails>>(
      `/servicerequestdetails/${id}`
    );
    return response.data;
  }

  /**
   * Create new service request details
   * POST /api/servicerequestdetails
   */
  async createServiceRequestDetails(
    data: Partial<ServiceRequestDetails>
  ): Promise<BaseResponse<ServiceRequestDetails>> {
    const response = await this.client.post<
      BaseResponse<ServiceRequestDetails>
    >("/servicerequestdetails", data);
    return response.data;
  }

  /**
   * Update service request details
   * PUT /api/servicerequestdetails/{id}
   */
  async updateServiceRequestDetails(
    id: string,
    data: Partial<ServiceRequestDetails>
  ): Promise<BaseResponse<ServiceRequestDetails>> {
    const response = await this.client.put<BaseResponse<ServiceRequestDetails>>(
      `/servicerequestdetails/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete service request details
   * DELETE /api/servicerequestdetails/{id}
   */
  async deleteServiceRequestDetails(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `/servicerequestdetails/${id}`
    );
    return response.data;
  }
}
