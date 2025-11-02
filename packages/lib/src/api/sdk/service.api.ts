import { AxiosInstance } from 'axios'

/**
 * Service API types
 */
export interface Service {
    id: string
    name: string
    categoryId: string
    categoryName: string
    description: string
    price: number
    duration: number // in minutes
    status: 'active' | 'inactive'
    createdAt: string
    updatedAt: string
}

export interface CreateServiceRequest {
    name: string
    categoryId: string
    description: string
    price: number
    duration: number
    status?: 'active' | 'inactive'
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {}

export interface ServiceListQuery {
    page?: number
    limit?: number
    categoryId?: string
    search?: string
    status?: 'active' | 'inactive'
}

export interface ServiceListResponse {
    data: Service[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * Service Management API
 * Handles all service-related operations
 */
export class ServiceApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get list of services with pagination and filtering
     */
    async getServices(query?: ServiceListQuery): Promise<ServiceListResponse> {
        const params = new URLSearchParams()
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value))
                }
            })
        }
        return this.client.get<ServiceListResponse>(`/service?${params}`).then(res => res.data)
    }

    /**
     * Create a new service
     */
    async createService(data: CreateServiceRequest): Promise<Service> {
        return this.client.post<Service>('/service', data).then(res => res.data)
    }

    /**
     * Get a single service by ID
     */
    async getService(id: string): Promise<Service> {
        return this.client.get<Service>(`/service/${id}`).then(res => res.data)
    }

    /**
     * Update an existing service
     */
    async updateService(id: string, data: UpdateServiceRequest): Promise<Service> {
        return this.client.put<Service>(`/service/${id}`, data).then(res => res.data)
    }

    /**
     * Delete a service
     */
    async deleteService(id: string): Promise<void> {
        return this.client.delete(`/service/${id}`).then(res => res.data)
    }

    /**
     * Get active services only
     */
    async getActiveServices(limit?: number): Promise<Service[]> {
        const params = limit ? `?limit=${limit}` : ''
        return this.client.get<Service[]>(`/service/active${params}`).then(res => res.data)
    }

    /**
     * Get services by category
     */
    async getServicesByCategory(categoryId: string): Promise<Service[]> {
        return this.client.get<Service[]>(`/service/category/${categoryId}`).then(res => res.data)
    }

    /**
     * Search services
     */
    async searchServices(query: { search: string; limit?: number }): Promise<ServiceListResponse> {
        const params = new URLSearchParams({ search: query.search })
        if (query.limit) params.append('limit', String(query.limit))
        return this.client.get<ServiceListResponse>(`/service/search?${params}`).then(res => res.data)
    }
}
