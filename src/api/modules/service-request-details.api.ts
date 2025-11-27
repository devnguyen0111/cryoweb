import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  ServiceRequestDetail,
} from "../types";

// Re-export for convenience
export type ServiceRequestDetails = ServiceRequestDetail;

export interface ServiceRequestDetailsListQuery {
  Page?: number;
  Size?: number;
  ServiceRequestId?: string;
  ServiceId?: string;
  SearchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
  serviceRequestId?: string;
  serviceId?: string;
  searchTerm?: string;
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
  async deleteServiceRequestDetails(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `/servicerequestdetails/${id}`
    );
    return response.data;
  }

  /**
   * Get service request details by service request ID
   * GET /api/servicerequestdetails/service-request/{serviceRequestId}
   */
  async getServiceRequestDetailsByServiceRequest(
    serviceRequestId: string
  ): Promise<BaseResponse<ServiceRequestDetails[]>> {
    const response = await this.client.get<
      BaseResponse<ServiceRequestDetails[]>
    >(`/servicerequestdetails/service-request/${serviceRequestId}`);
    return response.data;
  }

  /**
   * Create service request details for a service request
   * POST /api/servicerequestdetails/service-request/{serviceRequestId}
   */
  async createServiceRequestDetailsForServiceRequest(
    serviceRequestId: string,
    data: Partial<ServiceRequestDetails>
  ): Promise<BaseResponse<ServiceRequestDetails>> {
    const response = await this.client.post<
      BaseResponse<ServiceRequestDetails>
    >(`/servicerequestdetails/service-request/${serviceRequestId}`, data);
    return response.data;
  }

  /**
   * Get service request details by service ID
   * GET /api/servicerequestdetails/service/{serviceId}
   */
  async getServiceRequestDetailsByService(
    serviceId: string,
    params?: ServiceRequestDetailsListQuery
  ): Promise<DynamicResponse<ServiceRequestDetails>> {
    const response = await this.client.get<
      DynamicResponse<ServiceRequestDetails>
    >(`/servicerequestdetails/service/${serviceId}`, { params });
    return response.data;
  }
}
