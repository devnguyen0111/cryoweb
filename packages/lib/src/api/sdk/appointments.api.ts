import { AxiosInstance } from 'axios'

/**
 * Appointment API types
 */
export interface Appointment {
    id: string
    patientId: string
    type: 'consultation' | 'procedure' | 'follow-up' | 'testing' | 'other'
    title: string
    description: string
    date: string
    startTime: string
    endTime: string
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
    provider: {
        id: string
        name: string
        specialty: string
    }
    location: string
    notes: string
    reminderSent: boolean
    createdAt: string
    updatedAt: string
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
    total: number
    page: number
    limit: number
    totalPages: number
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
 */
export class AppointmentsApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get list of appointments with pagination and filtering
     * @example
     * const response = await appointmentsApi.getAppointments({ page: 1, limit: 10, status: 'scheduled' })
     */
    async getAppointments(query?: AppointmentListQuery): Promise<AppointmentListResponse> {
        const params = new URLSearchParams()
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value))
                }
            })
        }
        return this.client.get<AppointmentListResponse>(`/appointments?${params}`).then(res => res.data)
    }

    /**
     * Get a single appointment by ID
     * TODO: Implement actual API endpoint
     * @example
     * const appointment = await appointmentsApi.getAppointment('appointment-id-123')
     */
    async getAppointment(id: string): Promise<Appointment> {
        // TODO: Replace with actual API call
        // return this.client.get<Appointment>(`/appointments/${id}`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Create a new appointment
     * TODO: Implement actual API endpoint
     * @example
     * const newAppointment = await appointmentsApi.createAppointment({
     *   patientId: 'patient-123',
     *   type: 'consultation',
     *   ...
     * })
     */
    async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
        // TODO: Replace with actual API call
        // return this.client.post<Appointment>('/appointments', data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Update an existing appointment
     * TODO: Implement actual API endpoint
     * @example
     * const updated = await appointmentsApi.updateAppointment('appointment-id-123', { status: 'confirmed' })
     */
    async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<Appointment> {
        // TODO: Replace with actual API call
        // return this.client.patch<Appointment>(`/appointments/${id}`, data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Cancel an appointment
     * TODO: Implement actual API endpoint
     * @example
     * await appointmentsApi.cancelAppointment('appointment-id-123', 'Patient requested cancellation')
     */
    async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
        // TODO: Replace with actual API call
        // return this.client.post<Appointment>(`/appointments/${id}/cancel`, { reason }).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Delete an appointment
     * TODO: Implement actual API endpoint
     */
    async deleteAppointment(id: string): Promise<void> {
        // TODO: Replace with actual API call
        // return this.client.delete(`/appointments/${id}`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Get available time slots for a provider
     * TODO: Implement actual API endpoint
     */
    async getAvailableSlots(providerId: string, startDate: string, endDate: string): Promise<TimeSlot[]> {
        // TODO: Replace with actual API call
        // return this.client.get<TimeSlot[]>(`/appointments/available-slots`, {
        //     params: { providerId, startDate, endDate }
        // }).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Get appointments by patient ID
     * TODO: Implement actual API endpoint
     */
    async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
        // TODO: Replace with actual API call
        // return this.client.get<Appointment[]>(`/patients/${patientId}/appointments`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Send appointment reminder
     * TODO: Implement actual API endpoint
     */
    async sendReminder(id: string): Promise<{ success: boolean; message: string }> {
        // TODO: Replace with actual API call
        // return this.client.post(`/appointments/${id}/send-reminder`).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Get upcoming appointments
     * TODO: Implement actual API endpoint
     */
    async getUpcomingAppointments(limit?: number): Promise<Appointment[]> {
        // TODO: Replace with actual API call
        // return this.client.get<Appointment[]>('/appointments/upcoming', { params: { limit } }).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }
}
