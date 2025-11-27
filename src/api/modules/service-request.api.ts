import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  ServiceRequest,
  ServiceRequestListQuery,
  ServiceRequestCreateRequestModel,
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
    const { status, ...rest } = params ?? {};
    const Status = (params as any)?.Status;

    const statusValue = Status ?? status;
    if (
      statusValue !== undefined &&
      statusValue !== null &&
      String(statusValue) !== ""
    ) {
      const response = await this.client.get<DynamicResponse<ServiceRequest>>(
        `${STATUS_PATH}/${encodeURIComponent(String(statusValue))}`,
        { params: rest }
      );
      return response.data;
    }

    // Map params to API format
    const apiParams: Record<string, unknown> = {
      Page: params?.pageNumber ?? (params as any)?.Page,
      Size: params?.pageSize ?? (params as any)?.Size,
      Status: statusValue,
      AppointmentId: params?.appointmentId ?? (params as any)?.AppointmentId,
      SearchTerm: (params as any)?.SearchTerm ?? (params as any)?.searchTerm,
    };

    // Remove undefined values
    Object.keys(apiParams).forEach((key) => {
      if (apiParams[key] === undefined || apiParams[key] === null) {
        delete apiParams[key];
      }
    });

    const response = await this.client.get<DynamicResponse<ServiceRequest>>(
      BASE_PATH,
      { params: apiParams }
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
    data: ServiceRequestCreateRequestModel | Partial<ServiceRequest>
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
  async deleteServiceRequest(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `${BASE_PATH}/${id}`
    );
    return response.data;
  }

  /**
   * Get service requests by status
   * GET /api/servicerequest/status/{status}
   */
  async getServiceRequestsByStatus(
    status: string,
    params?: ServiceRequestListQuery
  ): Promise<DynamicResponse<ServiceRequest>> {
    const response = await this.client.get<DynamicResponse<ServiceRequest>>(
      `${STATUS_PATH}/${encodeURIComponent(status)}`,
      { params }
    );
    return response.data;
  }

  /**
   * Get service requests by appointment
   * GET /api/servicerequest/appointment/{appointmentId}
   */
  async getServiceRequestsByAppointment(
    appointmentId: string
  ): Promise<BaseResponse<ServiceRequest[]>> {
    const response = await this.client.get<BaseResponse<ServiceRequest[]>>(
      `${BASE_PATH}/appointment/${appointmentId}`
    );
    return response.data;
  }

  /**
   * Approve service request
   * POST /api/servicerequest/{id}/approve
   * Only requires the service request ID in the path
   */
  async approveServiceRequest(
    id: string
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.post<BaseResponse<ServiceRequest>>(
      `${BASE_PATH}/${id}/approve`
    );
    return response.data;
  }

  /**
   * Reject service request
   * POST /api/servicerequest/{id}/reject
   * Only requires the service request ID in the path
   */
  async rejectServiceRequest(
    id: string
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.post<BaseResponse<ServiceRequest>>(
      `${BASE_PATH}/${id}/reject`
    );
    return response.data;
  }

  /**
   * Complete service request
   * POST /api/servicerequest/{id}/complete
   * Only requires the service request ID in the path
   */
  async completeServiceRequest(
    id: string
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.post<BaseResponse<ServiceRequest>>(
      `${BASE_PATH}/${id}/complete`
    );
    return response.data;
  }

  /**
   * Cancel service request
   * POST /api/servicerequest/{id}/cancel
   * Only requires the service request ID in the path
   */
  async cancelServiceRequest(
    id: string
  ): Promise<BaseResponse<ServiceRequest>> {
    const response = await this.client.post<BaseResponse<ServiceRequest>>(
      `${BASE_PATH}/${id}/cancel`
    );
    return response.data;
  }
}
