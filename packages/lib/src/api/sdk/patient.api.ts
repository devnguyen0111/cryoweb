import { AxiosInstance } from 'axios'

/**
 * Base response wrapper from API
 */
interface BaseResponse<T> {
    code: number
    systemCode: string | null
    message: string
    data: T
    timestamp: string
    success: boolean
}

/**
 * Patient API types
 */
export interface Patient {
    id: string
    patientCode: string
    code?: string // Legacy support
    fullName?: string // Legacy support
    nationalId: string
    emergencyContact: string // Changed from object to string
    emergencyPhone: string
    insurance?: string | null
    occupation?: string | null
    medicalHistory?: string | null
    allergies?: string | null
    bloodType?: string
    height?: number | null
    weight?: number | null
    bmi?: number | null
    isActive: boolean
    notes?: string | null
    accountId: string
    createdAt: string
    updatedAt?: string | null
    accountInfo?: {
        username: string
        email: string
        phone: string
        address?: string | null
        isVerified: boolean
        isActive: boolean
    }
    treatmentCount?: number
    labSampleCount?: number
    relationshipCount?: number
    // Legacy fields
    dateOfBirth?: string
    gender?: 'male' | 'female' | 'other'
    nationality?: string
    email?: string
    phone?: string
    address?: string
    maritalStatus?: string
    status?: 'active' | 'inactive' | 'archived'
    // Extended fields for details endpoint
    relationships?: Relationship[]
    treatments?: Treatment[]
    labSamples?: LabSample[]
}

export interface Relationship {
    id: string
    relatedPatientId: string
    relationshipType: string
    notes?: string | null
    createdAt: string
    updatedAt?: string | null
}

export interface Treatment {
    id: string
    treatmentCode?: string | null
    startDate?: string | null
    endDate?: string | null
    status?: string | null
    notes?: string | null
}

export interface LabSample {
    id: string
    sampleCode?: string | null
    sampleType?: string | null
    collectionDate?: string | null
    status?: string | null
}

export interface CreatePatientRequest {
    fullName: string
    dateOfBirth: string
    gender: 'male' | 'female' | 'other'
    nationality: string
    nationalId?: string
    email?: string
    phone: string
    address: string
    bloodType?: string
    maritalStatus?: string
    occupation?: string
    emergencyContact?: {
        name: string
        relationship: string
        phone: string
    }
    medicalHistory?: string
    notes?: string
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {
    status?: 'active' | 'inactive' | 'archived'
}

export interface PatientListQuery {
    page?: number
    limit?: number
    search?: string
    status?: 'active' | 'inactive' | 'archived'
    gender?: 'male' | 'female' | 'other'
    bloodType?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PatientListResponse {
    data: Patient[]
    metaData: {
        page: number
        size: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrevious: boolean
        currentPageSize: number
    }
    // Legacy support for flat structure
    total?: number
    page?: number
    limit?: number
    totalPages?: number
}

export interface PatientStatistics {
    totalPatients: number
    byStatus: Record<string, number>
    byGender: Record<string, number>
    byBloodType: Record<string, number>
}

/**
 * Patient Management API
 * Handles all patient-related operations
 */
export class PatientApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Create a new patient record
     */
    async createPatient(data: CreatePatientRequest): Promise<Patient> {
        return this.client.post<BaseResponse<Patient>>('/patient', data).then(res => res.data.data)
    }

    /**
     * Get list of patients with pagination and filtering
     */
    async getPatients(query?: PatientListQuery): Promise<PatientListResponse> {
        const params = new URLSearchParams()
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value))
                }
            })
        }
        const response = await this.client.get<{
            code: number
            message: string
            metaData?: {
                page: number
                size: number
                total: number
                totalPages: number
                hasNext: boolean
                hasPrevious: boolean
                currentPageSize: number
            }
            data: Patient[]
            timestamp: string
            success: boolean
        }>(`/patient?${params}`)
        const result = response.data
        const dataLength = result.data?.length || 0
        const total = result.metaData?.total || dataLength
        const page = result.metaData?.page || 1
        const limit = result.metaData?.size || 10
        const totalPages = result.metaData?.totalPages || 1

        return {
            data: result.data || [],
            metaData: result.metaData || {
                page,
                size: limit,
                total,
                totalPages,
                hasNext: false,
                hasPrevious: false,
                currentPageSize: dataLength,
            },
            total,
            page,
            limit,
            totalPages,
        }
    }

    /**
     * Get a single patient by ID
     */
    async getPatient(id: string): Promise<Patient> {
        return this.client.get<BaseResponse<Patient>>(`/patient/${id}`).then(res => res.data.data)
    }

    /**
     * Update an existing patient record
     */
    async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient> {
        return this.client.put<BaseResponse<Patient>>(`/patient/${id}`, data).then(res => res.data.data)
    }

    /**
     * Delete a patient record
     */
    async deletePatient(id: string): Promise<void> {
        return this.client.delete(`/patient/${id}`).then(res => res.data)
    }

    /**
     * Get patient details by ID (includes relationships, treatments, labSamples)
     */
    async getPatientDetails(id: string): Promise<Patient> {
        return this.client.get<BaseResponse<Patient>>(`/patient/${id}/details`).then(res => res.data.data)
    }

    /**
     * Get patient by code
     */
    async getPatientByCode(code: string): Promise<Patient> {
        return this.client.get<Patient>(`/patient/by-code/${code}`).then(res => res.data)
    }

    /**
     * Get patient by national ID
     */
    async getPatientByNationalId(nationalId: string): Promise<Patient> {
        return this.client.get<Patient>(`/patient/by-national-id/${nationalId}`).then(res => res.data)
    }

    /**
     * Get patient by account ID
     */
    async getPatientByAccount(accountId: string): Promise<Patient> {
        return this.client.get<Patient>(`/patient/by-account/${accountId}`).then(res => res.data)
    }

    /**
     * Update patient status
     */
    async updatePatientStatus(id: string, status: 'active' | 'inactive' | 'archived'): Promise<Patient> {
        return this.client.patch<Patient>(`/patient/${id}/status`, { status }).then(res => res.data)
    }

    /**
     * Search patients
     */
    async searchPatients(query: { search?: string; limit?: number }): Promise<PatientListResponse> {
        const params = new URLSearchParams()
        if (query.search) params.append('search', query.search)
        if (query.limit) params.append('limit', String(query.limit))
        return this.client.get<PatientListResponse>(`/patient/search?${params}`).then(res => res.data)
    }

    /**
     * Get patient statistics
     */
    async getPatientStatistics(): Promise<PatientStatistics> {
        return this.client.get<PatientStatistics>('/patient/statistics').then(res => res.data)
    }

    /**
     * Validate patient code
     */
    async validatePatientCode(code: string): Promise<{ valid: boolean }> {
        return this.client.get<{ valid: boolean }>(`/patient/validate-patient-code?code=${code}`).then(res => res.data)
    }

    /**
     * Validate national ID
     */
    async validateNationalId(nationalId: string): Promise<{ valid: boolean }> {
        return this.client
            .get<{ valid: boolean }>(`/patient/validate-national-id?id=${nationalId}`)
            .then(res => res.data)
    }

    /**
     * Get available blood types
     */
    async getBloodTypes(): Promise<string[]> {
        return this.client.get<string[]>('/patient/blood-types').then(res => res.data)
    }

    /**
     * Get related patients for a patient
     */
    async getRelatedPatients(patientId: string): Promise<Patient[]> {
        return this.client.get<Patient[]>(`/patient/${patientId}/related`).then(res => res.data)
    }

    /**
     * Update bulk patient status
     */
    async bulkUpdateStatus(ids: string[], status: 'active' | 'inactive' | 'archived'): Promise<{ updated: number }> {
        return this.client.patch<{ updated: number }>('/patient/bulk/status', { ids, status }).then(res => res.data)
    }

    /**
     * Delete bulk patients
     */
    async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
        return this.client.post<{ deleted: number }>('/patient/bulk', { ids }).then(res => res.data)
    }
}
