import { AxiosInstance } from 'axios'

/**
 * Relationship API types
 */
export interface Relationship {
    id: string
    patientId: string
    relatedPatientId: string
    relationshipType: 'spouse' | 'parent' | 'child' | 'sibling' | 'guardian' | 'other'
    notes?: string
    createdAt: string
    updatedAt: string
}

export interface CreateRelationshipRequest {
    patientId: string
    relatedPatientId: string
    relationshipType: 'spouse' | 'parent' | 'child' | 'sibling' | 'guardian' | 'other'
    notes?: string
}

export interface UpdateRelationshipRequest extends Partial<CreateRelationshipRequest> {}

export interface RelationshipListQuery {
    page?: number
    limit?: number
    patientId?: string
    relationshipType?: string
}

export interface RelationshipListResponse {
    data: Relationship[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * Relationship Management API
 * Handles all patient relationship operations
 */
export class RelationshipApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Create a new relationship
     */
    async createRelationship(data: CreateRelationshipRequest): Promise<Relationship> {
        return this.client.post<Relationship>('/relationship', data).then(res => res.data)
    }

    /**
     * Get list of relationships with pagination and filtering
     */
    async getRelationships(query?: RelationshipListQuery): Promise<RelationshipListResponse> {
        const params = new URLSearchParams()
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value))
                }
            })
        }
        return this.client.get<RelationshipListResponse>(`/relationship?${params}`).then(res => res.data)
    }

    /**
     * Get a single relationship by ID
     */
    async getRelationship(id: string): Promise<Relationship> {
        return this.client.get<Relationship>(`/relationship/${id}`).then(res => res.data)
    }

    /**
     * Update an existing relationship
     */
    async updateRelationship(id: string, data: UpdateRelationshipRequest): Promise<Relationship> {
        return this.client.put<Relationship>(`/relationship/${id}`, data).then(res => res.data)
    }

    /**
     * Delete a relationship
     */
    async deleteRelationship(id: string): Promise<void> {
        return this.client.delete(`/relationship/${id}`).then(res => res.data)
    }

    /**
     * Get relationships for a specific patient
     */
    async getPatientRelationships(patientId: string): Promise<Relationship[]> {
        return this.client.get<Relationship[]>(`/relationship/patient/${patientId}`).then(res => res.data)
    }

    /**
     * Get available relationship types
     */
    async getRelationshipTypes(): Promise<string[]> {
        return this.client.get<string[]>('/relationship/types').then(res => res.data)
    }

    /**
     * Check if relationship can be created
     */
    async canCreateRelationship(data: CreateRelationshipRequest): Promise<{ canCreate: boolean; reason?: string }> {
        return this.client
            .post<{ canCreate: boolean; reason?: string }>('/relationship/can-create', data)
            .then(res => res.data)
    }
}
