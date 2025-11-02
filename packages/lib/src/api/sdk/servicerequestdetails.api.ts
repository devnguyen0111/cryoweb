import { AxiosInstance } from 'axios'

/**
 * Service Request Details API types
 */
export interface ServiceRequestDetails {
    id: string
    serviceRequestId: string
    serviceId: string
    quantity: number
    unitPrice: number
    totalPrice: number
    notes?: string
    createdAt: string
    updatedAt: string
}

export interface CreateServiceRequestDetailsRequest {
    serviceRequestId: string
    serviceId: string
    quantity: number
    unitPrice: number
    notes?: string
}

export interface UpdateServiceRequestDetailsRequest extends Partial<CreateServiceRequestDetailsRequest> {}

export interface ServiceRequestDetailsListQuery {
    page?: number
    limit?: number
    serviceRequestId?: string
    serviceId?: string
}

export interface ServiceRequestDetailsListResponse {
    data: ServiceRequestDetails[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * Service Request Details Management API
 * Handles all service request details operations
 */
export class ServiceRequestDetailsApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get a single service request details by ID
     */
    async getServiceRequestDetails(id: string): Promise<ServiceRequestDetails> {
        return this.client.get<ServiceRequestDetails>(`/servicerequestdetails/${id}`).then(res => res.data)
    }

    /**
     * Update an existing service request details
     */
    async updateServiceRequestDetails(
        id: string,
        data: UpdateServiceRequestDetailsRequest,
    ): Promise<ServiceRequestDetails> {
        return this.client.put<ServiceRequestDetails>(`/servicerequestdetails/${id}`, data).then(res => res.data)
    }

    /**
     * Delete service request details
     */
    async deleteServiceRequestDetails(id: string): Promise<void> {
        return this.client.delete(`/servicerequestdetails/${id}`).then(res => res.data)
    }

    /**
     * Get all details for a service request
     */
    async getServiceRequestDetailsByRequest(serviceRequestId: string): Promise<ServiceRequestDetails[]> {
        return this.client
            .get<ServiceRequestDetails[]>(`/servicerequestdetails/service-request/${serviceRequestId}`)
            .then(res => res.data)
    }

    /**
     * Create details for a service request
     */
    async createServiceRequestDetailsForRequest(
        serviceRequestId: string,
        data: CreateServiceRequestDetailsRequest,
    ): Promise<ServiceRequestDetails> {
        return this.client
            .post<ServiceRequestDetails>(`/servicerequestdetails/service-request/${serviceRequestId}`, data)
            .then(res => res.data)
    }

    /**
     * Get service request details by service ID
     */
    async getServiceRequestDetailsByService(serviceId: string): Promise<ServiceRequestDetails[]> {
        return this.client
            .get<ServiceRequestDetails[]>(`/servicerequestdetails/service/${serviceId}`)
            .then(res => res.data)
    }
}
