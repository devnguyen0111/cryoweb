import { AxiosInstance } from 'axios'

/**
 * Base response wrapper from API
 */
export interface BaseResponse<T> {
    code: number
    systemCode: string
    message: string
    data: T
    timestamp: string
    success: boolean
}

/**
 * Doctor API types
 */
export interface Doctor {
    id: string
    accountId: string
    fullName: string
    email: string
    phone: string
    specialty: string
    licenseNumber: string
    experience: number
    qualifications: string[]
    bio: string
    status: 'active' | 'inactive' | 'on-leave'
    image?: string
    rating?: number
    consultationFee?: number
    createdAt: string
    updatedAt: string
}

export interface DoctorDetails extends Doctor {
    schedules?: DoctorSchedule[]
    statistics?: DoctorStatistics
    appointments?: any[]
}

export interface CreateDoctorRequest {
    accountId: string
    fullName: string
    email: string
    phone: string
    specialty: string
    licenseNumber: string
    experience: number
    qualifications: string[]
    bio?: string
    consultationFee?: number
}

export interface UpdateDoctorRequest extends Partial<CreateDoctorRequest> {
    status?: 'active' | 'inactive' | 'on-leave'
    image?: string
}

export interface DoctorListQuery {
    page?: number
    limit?: number
    search?: string
    specialty?: string
    status?: 'active' | 'inactive' | 'on-leave'
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface DoctorListResponse {
    data: Doctor[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface DoctorStatistics {
    totalPatients: number
    totalAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    upcomingAppointments: number
    totalPrescriptions: number
    totalLabTests: number
    averageRating: number
    totalReviews: number
    monthlyStats: {
        month: string
        appointments: number
        patients: number
    }[]
}

export interface DoctorSchedule {
    id: string
    doctorId: string
    workDate: string // ISO date string (YYYY-MM-DD)
    startTime: string // HH:mm format
    endTime: string // HH:mm format
    location?: string
    notes?: string
    isAvailable: boolean
    createdAt: string
    updatedAt: string
    doctor?: {
        id: string
        badgeId: string
        specialty: string
        yearsOfExperience: number
        fullName: string
    }
    totalSlots?: number
    availableSlots?: number
    bookedSlots?: number
}

export interface CreateDoctorScheduleRequest {
    doctorId: string
    workDate: string // ISO date string (YYYY-MM-DD)
    startTime: string
    endTime: string
    location?: string
    notes?: string
    isAvailable: boolean
}

export interface UpdateDoctorScheduleRequest extends Partial<CreateDoctorScheduleRequest> {}

export interface DoctorScheduleListResponse {
    data: DoctorSchedule[]
    metaData: {
        page: number
        size: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrevious: boolean
        currentPageSize: number
    }
}

export interface TimeSlot {
    id: string
    doctorScheduleId: string
    scheduleId?: string // Legacy support
    startTime: string
    endTime: string
    notes?: string | null
    isBooked: boolean
    bookingStatus: 'available' | 'booked' | 'blocked' | 'cancelled'
    patientId?: string
    appointmentId?: string
    createdAt: string
    updatedAt?: string | null
    schedule?: {
        id: string
        workDate: string
        location?: string | null
        doctor?: {
            id: string
            badgeId: string
            specialty: string
            yearsOfExperience: number
            fullName: string
        }
    }
    date?: string // Computed from schedule.workDate
}

export interface CreateSlotRequest {
    scheduleId: string
    date: string
    startTime: string
    endTime: string
}

export interface UpdateSlotRequest extends Partial<CreateSlotRequest> {
    bookingStatus?: 'available' | 'booked' | 'blocked' | 'cancelled'
}

export interface SlotListQuery {
    page?: number
    limit?: number
    scheduleId?: string
    doctorId?: string
    date?: string
    startDate?: string
    endDate?: string
    bookingStatus?: 'available' | 'booked' | 'blocked' | 'cancelled'
}

export interface SlotListResponse {
    data: TimeSlot[]
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
}

export interface GenerateSlotsRequest {
    scheduleId: string
    startDate: string
    endDate: string
}

/**
 * Doctor Management API
 * Handles all doctor-related operations including schedules, slots, and statistics
 */
export class DoctorApi {
    constructor(private readonly client: AxiosInstance) {}

    // ==================== Doctor Management ====================

    /**
     * Get list of doctors with pagination and filtering
     * @example
     * const response = await doctorApi.getDoctors({ page: 1, limit: 10, specialty: 'Fertility' })
     */
    async getDoctors(query?: DoctorListQuery): Promise<DoctorListResponse> {
        const params = new URLSearchParams(query as any)
        return this.client.get<DoctorListResponse>(`/doctor?${params}`).then(res => res.data)
    }

    /**
     * Get a single doctor by ID
     * @example
     * const doctor = await doctorApi.getDoctor('doctor-id-123')
     */
    async getDoctor(id: string): Promise<Doctor> {
        return this.client.get<BaseResponse<Doctor>>(`/doctor/${id}`).then(res => res.data.data)
    }

    /**
     * Get doctor details by ID (includes schedules, statistics, appointments)
     * @example
     * const details = await doctorApi.getDoctorDetails('doctor-id-123')
     */
    async getDoctorDetails(id: string): Promise<DoctorDetails> {
        return this.client.get<BaseResponse<DoctorDetails>>(`/doctor/${id}/details`).then(res => res.data.data)
    }

    /**
     * Get doctor by account ID
     * @example
     * const doctor = await doctorApi.getDoctorByAccount('account-id-123')
     */
    async getDoctorByAccount(accountId: string): Promise<Doctor> {
        return this.client.get<BaseResponse<Doctor>>(`/doctor/account/${accountId}`).then(res => res.data.data)
    }

    /**
     * Create a new doctor record
     * @example
     * const newDoctor = await doctorApi.createDoctor({
     *   accountId: 'account-123',
     *   fullName: 'Dr. Jane Doe',
     *   specialty: 'Fertility',
     *   ...
     * })
     */
    async createDoctor(data: CreateDoctorRequest): Promise<Doctor> {
        return this.client.post<BaseResponse<Doctor>>('/doctor', data).then(res => res.data.data)
    }

    /**
     * Update an existing doctor record
     * @example
     * const updated = await doctorApi.updateDoctor('doctor-id-123', { phone: '+1234567890' })
     */
    async updateDoctor(id: string, data: UpdateDoctorRequest): Promise<Doctor> {
        return this.client.put<BaseResponse<Doctor>>(`/doctor/${id}`, data).then(res => res.data.data)
    }

    /**
     * Update doctor status
     * @example
     * await doctorApi.updateDoctorStatus('doctor-id-123', 'on-leave')
     */
    async updateDoctorStatus(id: string, status: 'active' | 'inactive' | 'on-leave'): Promise<Doctor> {
        return this.client.patch<BaseResponse<Doctor>>(`/doctor/${id}/status`, { status }).then(res => res.data.data)
    }

    /**
     * Delete a doctor record
     * @example
     * await doctorApi.deleteDoctor('doctor-id-123')
     */
    async deleteDoctor(id: string): Promise<void> {
        return this.client.delete(`/doctor/${id}`).then(res => res.data)
    }

    /**
     * Check if doctor exists
     * @example
     * const exists = await doctorApi.doctorExists('doctor-id-123')
     */
    async doctorExists(id: string): Promise<{ exists: boolean }> {
        return this.client.get<{ exists: boolean }>(`/doctor/${id}/exists`).then(res => res.data)
    }

    /**
     * Get doctor statistics
     * @example
     * const stats = await doctorApi.getDoctorStatistics('doctor-id-123')
     */
    async getDoctorStatistics(id?: string): Promise<DoctorStatistics> {
        const url = id ? `/doctor/${id}/statistics` : '/doctor/statistics'
        return this.client.get<BaseResponse<DoctorStatistics>>(url).then(res => res.data.data)
    }

    /**
     * Get list of specialties
     * @example
     * const specialties = await doctorApi.getSpecialties()
     */
    async getSpecialties(): Promise<string[]> {
        return this.client.get<string[]>('/doctor/specialties').then(res => res.data)
    }

    /**
     * Check if badge is unique
     * @example
     * const isUnique = await doctorApi.checkBadgeUnique('badge-123')
     */
    async checkBadgeUnique(badgeId: string): Promise<{ unique: boolean }> {
        return this.client.get<{ unique: boolean }>(`/doctor/badge/${badgeId}/unique`).then(res => res.data)
    }

    // ==================== Doctor Schedule Management ====================

    /**
     * Get list of doctor schedules
     * @example
     * const schedules = await doctorApi.getDoctorSchedules()
     */
    async getDoctorSchedules(query?: { doctorId?: string }): Promise<DoctorScheduleListResponse> {
        const params = query ? new URLSearchParams(query as any) : ''
        return this.client
            .get<BaseResponse<DoctorScheduleListResponse>>(`/doctor-schedules?${params}`)
            .then(res => res.data.data)
    }

    /**
     * Get schedule by ID
     * @example
     * const schedule = await doctorApi.getSchedule('schedule-id-123')
     */
    async getSchedule(id: string): Promise<DoctorSchedule> {
        return this.client.get<BaseResponse<DoctorSchedule>>(`/doctor-schedules/${id}`).then(res => res.data.data)
    }

    /**
     * Get schedule details by ID
     * @example
     * const details = await doctorApi.getScheduleDetails('schedule-id-123')
     */
    async getScheduleDetails(id: string): Promise<DoctorSchedule> {
        return this.client
            .get<BaseResponse<DoctorSchedule>>(`/doctor-schedules/${id}/details`)
            .then(res => res.data.data)
    }

    /**
     * Get schedules by doctor ID
     * @example
     * const schedules = await doctorApi.getSchedulesByDoctor('doctor-id-123')
     */
    async getSchedulesByDoctor(doctorId: string): Promise<DoctorSchedule[]> {
        return this.client.get<BaseResponse<any>>(`/doctor-schedules?DoctorId=${doctorId}`).then(res => res.data.data)
    }

    /**
     * Create a new doctor schedule
     * @example
     * const newSchedule = await doctorApi.createSchedule({
     *   doctorId: 'doctor-123',
     *   dayOfWeek: 1,
     *   startTime: '09:00',
     *   endTime: '17:00',
     *   ...
     * })
     */
    async createSchedule(data: CreateDoctorScheduleRequest): Promise<DoctorSchedule> {
        return this.client.post<BaseResponse<DoctorSchedule>>('/doctor-schedules', data).then(res => res.data.data)
    }

    /**
     * Update an existing schedule
     * @example
     * const updated = await doctorApi.updateSchedule('schedule-id-123', { isAvailable: false })
     */
    async updateSchedule(id: string, data: UpdateDoctorScheduleRequest): Promise<DoctorSchedule> {
        return this.client.put<BaseResponse<DoctorSchedule>>(`/doctor-schedules/${id}`, data).then(res => res.data.data)
    }

    /**
     * Update schedule availability
     * @example
     * await doctorApi.updateScheduleAvailability('schedule-id-123', false)
     */
    async updateScheduleAvailability(id: string, isAvailable: boolean): Promise<DoctorSchedule> {
        return this.client
            .patch<BaseResponse<DoctorSchedule>>(`/doctor-schedules/${id}/availability`, { isAvailable })
            .then(res => res.data.data)
    }

    /**
     * Delete a schedule
     * @example
     * await doctorApi.deleteSchedule('schedule-id-123')
     */
    async deleteSchedule(id: string): Promise<void> {
        return this.client.delete(`/doctor-schedules/${id}`).then(res => res.data)
    }

    // ==================== Slot Management ====================

    /**
     * Get list of slots with pagination and filtering
     * @example
     * const response = await doctorApi.getSlots({ doctorId: 'doctor-123', date: '2025-10-30' })
     */
    async getSlots(query?: SlotListQuery): Promise<SlotListResponse> {
        const params = new URLSearchParams(query as any)
        return this.client.get<SlotListResponse>(`/slots?${params}`).then(res => res.data)
    }

    /**
     * Get a single slot by ID
     * @example
     * const slot = await doctorApi.getSlot('slot-id-123')
     */
    async getSlot(id: string): Promise<TimeSlot> {
        return this.client.get<BaseResponse<TimeSlot>>(`/slots/${id}`).then(res => res.data.data)
    }

    /**
     * Get slot details by ID
     * @example
     * const details = await doctorApi.getSlotDetails('slot-id-123')
     */
    async getSlotDetails(id: string): Promise<TimeSlot> {
        return this.client.get<BaseResponse<TimeSlot>>(`/slots/${id}/details`).then(res => res.data.data)
    }

    /**
     * Get slots by schedule ID
     * @example
     * const slots = await doctorApi.getSlotsBySchedule('schedule-id-123')
     */
    async getSlotsBySchedule(scheduleId: string): Promise<TimeSlot[]> {
        return this.client.get<BaseResponse<TimeSlot[]>>(`/slots/schedule/${scheduleId}`).then(res => res.data.data)
    }

    /**
     * Get available slots for a doctor
     * @example
     * const slots = await doctorApi.getAvailableSlotsByDoctor('doctor-id-123')
     */
    async getAvailableSlotsByDoctor(doctorId: string, startDate?: string, endDate?: string): Promise<TimeSlot[]> {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return this.client
            .get<BaseResponse<TimeSlot[]>>(`/slots/available/doctor/${doctorId}?${params}`)
            .then(res => res.data.data)
    }

    /**
     * Create a new slot
     * @example
     * const newSlot = await doctorApi.createSlot({
     *   scheduleId: 'schedule-123',
     *   date: '2025-10-30',
     *   startTime: '09:00',
     *   endTime: '09:30'
     * })
     */
    async createSlot(data: CreateSlotRequest): Promise<TimeSlot> {
        return this.client.post<BaseResponse<TimeSlot>>('/slots', data).then(res => res.data.data)
    }

    /**
     * Generate slots for a schedule
     * @example
     * const slots = await doctorApi.generateSlots({
     *   scheduleId: 'schedule-123',
     *   startDate: '2025-10-30',
     *   endDate: '2025-11-30'
     * })
     */
    async generateSlots(data: GenerateSlotsRequest): Promise<TimeSlot[]> {
        return this.client
            .post<BaseResponse<TimeSlot[]>>(`/slots/schedule/${data.scheduleId}/generate`, {
                startDate: data.startDate,
                endDate: data.endDate,
            })
            .then(res => res.data.data)
    }

    /**
     * Update an existing slot
     * @example
     * const updated = await doctorApi.updateSlot('slot-id-123', { bookingStatus: 'blocked' })
     */
    async updateSlot(id: string, data: UpdateSlotRequest): Promise<TimeSlot> {
        return this.client.put<BaseResponse<TimeSlot>>(`/slots/${id}`, data).then(res => res.data.data)
    }

    /**
     * Update slot booking status
     * @example
     * await doctorApi.updateSlotBookingStatus('slot-id-123', 'booked')
     */
    async updateSlotBookingStatus(
        id: string,
        bookingStatus: 'available' | 'booked' | 'blocked' | 'cancelled',
    ): Promise<TimeSlot> {
        return this.client
            .patch<BaseResponse<TimeSlot>>(`/slots/${id}/booking-status`, { bookingStatus })
            .then(res => res.data.data)
    }

    /**
     * Delete a slot
     * @example
     * await doctorApi.deleteSlot('slot-id-123')
     */
    async deleteSlot(id: string): Promise<void> {
        return this.client.delete(`/slots/${id}`).then(res => res.data)
    }
}
