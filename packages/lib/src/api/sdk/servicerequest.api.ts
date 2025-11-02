import { AxiosInstance } from 'axios'

/**
 * Service Request API types
 */
export interface ServiceRequest {
    id: string
    appointmentId: string
    serviceId: string
    serviceName: string
    patientId: string
    patientName: string
    requestedBy: string
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
    notes?: string
    requestedDate: string
    approvedDate?: string
    completedDate?: string
    cancelledDate?: string
    createdAt: string
    updatedAt: string
}

export interface CreateServiceRequestRequest {
    appointmentId: string
    serviceId: string
    notes?: string
}

export interface UpdateServiceRequestRequest extends Partial<CreateServiceRequestRequest> {}

export interface ServiceRequestListQuery {
    page?: number
    limit?: number
    appointmentId?: string
    status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
    patientId?: string
}

export interface ServiceRequestListResponse {
    data: ServiceRequest[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * Service Request Management API
 * Handles all service request operations
 */
export class ServiceRequestApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get list of service requests with pagination and filtering
     */
    async getServiceRequests(query?: ServiceRequestListQuery): Promise<ServiceRequestListResponse> {
        const params = new URLSearchParams()
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value))
                }
            })
        }
        return this.client.get<ServiceRequestListResponse>(`/servicerequest?${params}`).then(res => res.data)
    }

    /**
     * Create a new service request
     */
    async createServiceRequest(data: CreateServiceRequestRequest): Promise<ServiceRequest> {
        return this.client.post<ServiceRequest>('/servicerequest', data).then(res => res.data)
    }

    /**
     * Get a single service request by ID
     */
    async getServiceRequest(id: string): Promise<ServiceRequest> {
        return this.client.get<ServiceRequest>(`/servicerequest/${id}`).then(res => res.data)
    }

    /**
     * Update an existing service request
     */
    async updateServiceRequest(id: string, data: UpdateServiceRequestRequest): Promise<ServiceRequest> {
        return this.client.put<ServiceRequest>(`/servicerequest/${id}`, data).then(res => res.data)
    }

    /**
     * Delete a service request
     */
    async deleteServiceRequest(id: string): Promise<void> {
        return this.client.delete(`/servicerequest/${id}`).then(res => res.data)
    }

    /**
     * Get service requests by status
     */
    async getServiceRequestsByStatus(
        status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled',
    ): Promise<ServiceRequest[]> {
        return this.client.get<ServiceRequest[]>(`/servicerequest/status/${status}`).then(res => res.data)
    }

    /**
     * Get service requests by appointment ID
     */
    async getServiceRequestsByAppointment(appointmentId: string): Promise<ServiceRequest[]> {
        return this.client.get<ServiceRequest[]>(`/servicerequest/appointment/${appointmentId}`).then(res => res.data)
    }

    /**
     * Approve a service request
     */
    async approveServiceRequest(id: string): Promise<ServiceRequest> {
        return this.client.post<ServiceRequest>(`/servicerequest/${id}/approve`).then(res => res.data)
    }

    /**
     * Reject a service request
     */
    async rejectServiceRequest(id: string): Promise<ServiceRequest> {
        return this.client.post<ServiceRequest>(`/servicerequest/${id}/reject`).then(res => res.data)
    }

    /**
     * Complete a service request
     */
    async completeServiceRequest(id: string): Promise<ServiceRequest> {
        return this.client.post<ServiceRequest>(`/servicerequest/${id}/complete`).then(res => res.data)
    }

    /**
     * Cancel a service request
     */
    async cancelServiceRequest(id: string): Promise<ServiceRequest> {
        return this.client.post<ServiceRequest>(`/servicerequest/${id}/cancel`).then(res => res.data)
    }
}
