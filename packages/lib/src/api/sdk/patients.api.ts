import { AxiosInstance } from 'axios'

/**
 * Patient API types
 */
export interface Patient {
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
    email: string
    phone: string
    gender: 'male' | 'female' | 'other'
    address: {
        street: string
        city: string
        state: string
        zipCode: string
        country: string
    }
    medicalHistory: string
    emergencyContact: {
        name: string
        relationship: string
        phone: string
    }
    status: 'active' | 'inactive' | 'archived'
    createdAt: string
    updatedAt: string
}

export interface CreatePatientRequest {
    firstName: string
    lastName: string
    dateOfBirth: string
    email: string
    phone: string
    gender: 'male' | 'female' | 'other'
    address: {
        street: string
        city: string
        state: string
        zipCode: string
        country: string
    }
    medicalHistory?: string
    emergencyContact: {
        name: string
        relationship: string
        phone: string
    }
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

export interface PatientListQuery {
    page?: number
    limit?: number
    search?: string
    status?: 'active' | 'inactive' | 'archived'
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PatientListResponse {
    data: Patient[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * Patient Management API
 * Handles all patient-related operations
 */
export class PatientsApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get list of patients with pagination and filtering
     * TODO: Implement actual API endpoint
     * @example
     * const response = await patientsApi.getPatients({ page: 1, limit: 10, status: 'active' })
     */
    async getPatients(query?: PatientListQuery): Promise<PatientListResponse> {
        // TODO: Replace with actual API call
        // const params = new URLSearchParams(query as any)
        // return this.client.get<PatientListResponse>(`/patients?${params}`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Get a single patient by ID
     * TODO: Implement actual API endpoint
     * @example
     * const patient = await patientsApi.getPatient('patient-id-123')
     */
    async getPatient(id: string): Promise<Patient> {
        // TODO: Replace with actual API call
        // return this.client.get<Patient>(`/patients/${id}`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Create a new patient record
     * TODO: Implement actual API endpoint
     * @example
     * const newPatient = await patientsApi.createPatient({
     *   firstName: 'Jane',
     *   lastName: 'Doe',
     *   ...
     * })
     */
    async createPatient(data: CreatePatientRequest): Promise<Patient> {
        // TODO: Replace with actual API call
        // return this.client.post<Patient>('/patients', data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Update an existing patient record
     * TODO: Implement actual API endpoint
     * @example
     * const updated = await patientsApi.updatePatient('patient-id-123', { phone: '+1234567890' })
     */
    async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient> {
        // TODO: Replace with actual API call
        // return this.client.patch<Patient>(`/patients/${id}`, data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Delete a patient record
     * TODO: Implement actual API endpoint
     * @example
     * await patientsApi.deletePatient('patient-id-123')
     */
    async deletePatient(id: string): Promise<void> {
        // TODO: Replace with actual API call
        // return this.client.delete(`/patients/${id}`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Archive a patient record
     * TODO: Implement actual API endpoint
     */
    async archivePatient(id: string): Promise<Patient> {
        // TODO: Replace with actual API call
        // return this.client.post<Patient>(`/patients/${id}/archive`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Restore an archived patient record
     * TODO: Implement actual API endpoint
     */
    async restorePatient(id: string): Promise<Patient> {
        // TODO: Replace with actual API call
        // return this.client.post<Patient>(`/patients/${id}/restore`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }
}
