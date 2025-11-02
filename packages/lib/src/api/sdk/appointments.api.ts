import { AxiosInstance } from 'axios'
import { BaseResponse, DynamicResponse } from './types'

/**
 * Appointment API types
 */
export interface Appointment {
    id: string
    patientId: string
    doctorId?: string
    type: 'consultation' | 'procedure' | 'follow-up' | 'testing' | 'other'
    title: string
    description?: string
    date: string
    startTime: string
    endTime: string
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
    provider?: {
        id: string
        name: string
        specialty: string
    }
    doctor?: {
        id: string
        name: string
        specialization?: string
    }
    location?: string
    notes?: string
    reminderSent?: boolean
    createdAt: string
    updatedAt?: string
}

export interface CreateAppointmentRequest {
    patientId: string
    type: 'consultation' | 'procedure' | 'follow-up' | 'testing' | 'other'
    title: string
    description?: string
    date: string
    startTime: string
    endTime: string
    providerId: string
    location: string
    notes?: string
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {
    status?: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
}

export interface AppointmentListQuery {
    page?: number
    limit?: number
    patientId?: string
    providerId?: string
    type?: string
    status?: string
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface AppointmentListResponse {
    data: Appointment[]
    metaData?: {
        page: number
        size: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrevious: boolean
        currentPageSize: number
    }
    // Legacy support
    total?: number
    page?: number
    limit?: number
    totalPages?: number
}

export interface TimeSlot {
    date: string
    startTime: string
    endTime: string
    available: boolean
}

/**
 * Appointment Management API
 * Handles all appointment scheduling and management operations
 *
 * NOTE: According to Swagger JSON at https://cryofert.runasp.net/swagger/v1/swagger.json,
 * the `/api/appointment` endpoint does not exist. This API class is prepared for when
 * the backend endpoint is implemented.
 *
 * TODO: Update endpoint paths once the backend appointment API is available
 */
export class AppointmentsApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get list of appointments with pagination and filtering
     *
     * WARNING: This endpoint may not exist in the backend yet.
     * Returns empty data if endpoint returns 404.
     *
     * @example
     * const response = await appointmentsApi.getAppointments({ page: 1, limit: 10, status: 'scheduled' })
     */
    async getAppointments(query?: AppointmentListQuery): Promise<AppointmentListResponse> {
        try {
            const params = new URLSearchParams()
            if (query) {
                Object.entries(query).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        params.append(key, String(value))
                    }
                })
            }
            const response = await this.client.get<DynamicResponse<Appointment[]>>(`/appointment?${params}`)
            const result = response.data
            return {
                data: result.data || [],
                metaData: result.metaData,
                total: result.metaData?.total || result.data?.length || 0,
                page: result.metaData?.page || 1,
                limit: result.metaData?.size || 10,
                totalPages: result.metaData?.totalPages || 1,
            }
        } catch (error: any) {
            // Return empty data if endpoint doesn't exist (404)
            if (error.response?.status === 404) {
                console.warn('Appointment endpoint not found. Returning empty data.')
                return {
                    data: [],
                    total: 0,
                    page: 1,
                    limit: query?.limit || 10,
                    totalPages: 0,
                }
            }
            throw error
        }
    }

    /**
     * Get a single appointment by ID
     *
     * WARNING: This endpoint may not exist in the backend yet.
     *
     * @example
     * const appointment = await appointmentsApi.getAppointment('appointment-id-123')
     */
    async getAppointment(id: string): Promise<Appointment> {
        try {
            return this.client.get<BaseResponse<Appointment>>(`/appointment/${id}`).then(res => res.data.data)
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Appointment endpoint not found. Please check if the backend API is implemented.')
            }
            throw error
        }
    }

    /**
     * Create a new appointment
     *
     * WARNING: This endpoint may not exist in the backend yet.
     *
     * @example
     * const newAppointment = await appointmentsApi.createAppointment({
     *   patientId: 'patient-123',
     *   type: 'consultation',
     *   ...
     * })
     */
    async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
        try {
            return this.client.post<BaseResponse<Appointment>>('/appointment', data).then(res => res.data.data)
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Appointment endpoint not found. Please check if the backend API is implemented.')
            }
            throw error
        }
    }

    /**
     * Update an existing appointment
     *
     * WARNING: This endpoint may not exist in the backend yet.
     *
     * @example
     * const updated = await appointmentsApi.updateAppointment('appointment-id-123', { status: 'confirmed' })
     */
    async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<Appointment> {
        try {
            return this.client.put<BaseResponse<Appointment>>(`/appointment/${id}`, data).then(res => res.data.data)
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Appointment endpoint not found. Please check if the backend API is implemented.')
            }
            throw error
        }
    }

    /**
     * Cancel an appointment
     *
     * WARNING: This endpoint may not exist in the backend yet.
     *
     * @example
     * await appointmentsApi.cancelAppointment('appointment-id-123', 'Patient requested cancellation')
     */
    async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
        try {
            return this.client
                .post<BaseResponse<Appointment>>(`/appointment/${id}/cancel`, { reason })
                .then(res => res.data.data)
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Appointment endpoint not found. Please check if the backend API is implemented.')
            }
            throw error
        }
    }

    /**
     * Delete an appointment
     *
     * WARNING: This endpoint may not exist in the backend yet.
     */
    async deleteAppointment(id: string): Promise<void> {
        try {
            return this.client.delete(`/appointment/${id}`).then(() => undefined)
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Appointment endpoint not found. Please check if the backend API is implemented.')
            }
            throw error
        }
    }

    /**
     * Get available time slots for a provider
     *
     * WARNING: This endpoint may not exist in the backend yet.
     */
    async getAvailableSlots(providerId: string, startDate: string, endDate: string): Promise<TimeSlot[]> {
        try {
            const params = new URLSearchParams()
            params.append('providerId', providerId)
            params.append('startDate', startDate)
            params.append('endDate', endDate)
            return this.client
                .get<BaseResponse<TimeSlot[]>>(`/appointment/available-slots?${params}`)
                .then(res => res.data.data || [])
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.warn('Appointment available-slots endpoint not found. Returning empty array.')
                return []
            }
            throw error
        }
    }

    /**
     * Get appointments by patient ID
     *
     * WARNING: This endpoint may not exist in the backend yet.
     */
    async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
        try {
            return this.client
                .get<BaseResponse<Appointment[]>>(`/appointment/patient/${patientId}`)
                .then(res => res.data.data || [])
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.warn('Appointment patient endpoint not found. Returning empty array.')
                return []
            }
            throw error
        }
    }

    /**
     * Send appointment reminder
     *
     * WARNING: This endpoint may not exist in the backend yet.
     */
    async sendReminder(id: string): Promise<{ success: boolean; message: string }> {
        try {
            return this.client
                .post<BaseResponse<{ success: boolean; message: string }>>(`/appointment/${id}/reminder`)
                .then(res => res.data.data)
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error(
                    'Appointment reminder endpoint not found. Please check if the backend API is implemented.',
                )
            }
            throw error
        }
    }

    /**
     * Get upcoming appointments
     *
     * WARNING: This endpoint may not exist in the backend yet.
     */
    async getUpcomingAppointments(limit?: number): Promise<Appointment[]> {
        try {
            const params = new URLSearchParams()
            if (limit) params.append('limit', String(limit))
            return this.client
                .get<BaseResponse<Appointment[]>>(`/appointment/upcoming?${params}`)
                .then(res => res.data.data || [])
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.warn('Appointment upcoming endpoint not found. Returning empty array.')
                return []
            }
            throw error
        }
    }
}
