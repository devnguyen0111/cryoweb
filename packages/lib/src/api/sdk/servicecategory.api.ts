import { AxiosInstance } from 'axios'

/**
 * Service Category API types
 */
export interface ServiceCategory {
    id: string
    name: string
    description: string
    status: 'active' | 'inactive'
    createdAt: string
    updatedAt: string
}

export interface CreateServiceCategoryRequest {
    name: string
    description: string
    status?: 'active' | 'inactive'
}

export interface UpdateServiceCategoryRequest extends Partial<CreateServiceCategoryRequest> {}

/**
 * Service Category Management API
 * Handles all service category operations
 */
export class ServiceCategoryApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get list of service categories
     */
    async getServiceCategories(): Promise<ServiceCategory[]> {
        return this.client.get<ServiceCategory[]>('/servicecategory').then(res => res.data)
    }

    /**
     * Create a new service category
     */
    async createServiceCategory(data: CreateServiceCategoryRequest): Promise<ServiceCategory> {
        return this.client.post<ServiceCategory>('/servicecategory', data).then(res => res.data)
    }

    /**
     * Get a single service category by ID
     */
    async getServiceCategory(id: string): Promise<ServiceCategory> {
        return this.client.get<ServiceCategory>(`/servicecategory/${id}`).then(res => res.data)
    }

    /**
     * Update an existing service category
     */
    async updateServiceCategory(id: string, data: UpdateServiceCategoryRequest): Promise<ServiceCategory> {
        return this.client.put<ServiceCategory>(`/servicecategory/${id}`, data).then(res => res.data)
    }

    /**
     * Delete a service category
     */
    async deleteServiceCategory(id: string): Promise<void> {
        return this.client.delete(`/servicecategory/${id}`).then(res => res.data)
    }

    /**
     * Get active service categories only
     */
    async getActiveServiceCategories(): Promise<ServiceCategory[]> {
        return this.client.get<ServiceCategory[]>('/servicecategory/active').then(res => res.data)
    }
}
