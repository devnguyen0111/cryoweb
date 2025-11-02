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

interface DynamicResponse<T> {
    code: number
    systemCode: string | null
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
    data: T
    timestamp: string
    success: boolean
}

/**
 * Slot API types
 */
export interface TimeSlot {
    id: string
    doctorScheduleId?: string
    scheduleId?: string
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
    date?: string
}

export interface CreateSlotRequest {
    scheduleId: string
    date: string
    startTime: string
    endTime: string
    notes?: string
}

export interface UpdateSlotRequest {
    startTime?: string
    endTime?: string
    notes?: string
    isBooked?: boolean
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

export interface GenerateSlotsRequest {
    scheduleId: string
    startDate: string
    endDate: string
}

/**
 * Slot Management API
 * Handles all slot-related operations
 * Based on Swagger: https://cryofert.runasp.net/swagger/v1/swagger.json
 */
export class SlotsApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get list of slots with pagination and filtering
     * GET /api/slots
     */
    async getSlots(query?: SlotListQuery): Promise<SlotListResponse> {
        const params = new URLSearchParams()
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value))
                }
            })
        }
        const response = await this.client.get<DynamicResponse<TimeSlot[]>>(`/slots?${params}`)
        const result = response.data
        return {
            data: result.data || [],
            metaData: result.metaData,
            total: result.metaData?.total || result.data?.length || 0,
            page: result.metaData?.page || 1,
            limit: result.metaData?.size || 10,
            totalPages: result.metaData?.totalPages || 1,
        }
    }

    /**
     * Get a single slot by ID
     * GET /api/slots/{id}
     */
    async getSlot(id: string): Promise<TimeSlot> {
        return this.client.get<BaseResponse<TimeSlot>>(`/slots/${id}`).then(res => res.data.data)
    }

    /**
     * Get slot details by ID
     * GET /api/slots/{id}/details
     */
    async getSlotDetails(id: string): Promise<TimeSlot> {
        return this.client.get<BaseResponse<TimeSlot>>(`/slots/${id}/details`).then(res => res.data.data)
    }

    /**
     * Get slots by schedule ID
     * GET /api/slots/schedule/{scheduleId}
     */
    async getSlotsBySchedule(scheduleId: string): Promise<TimeSlot[]> {
        return this.client
            .get<BaseResponse<TimeSlot[]>>(`/slots/schedule/${scheduleId}`)
            .then(res => res.data.data || [])
    }

    /**
     * Get available slots for a doctor
     * GET /api/slots/available/doctor/{doctorId}
     */
    async getAvailableSlotsByDoctor(doctorId: string, startDate?: string, endDate?: string): Promise<TimeSlot[]> {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return this.client
            .get<BaseResponse<TimeSlot[]>>(`/slots/available/doctor/${doctorId}?${params}`)
            .then(res => res.data.data || [])
    }

    /**
     * Create a new slot
     * POST /api/slots
     */
    async createSlot(data: CreateSlotRequest): Promise<TimeSlot> {
        return this.client.post<BaseResponse<TimeSlot>>('/slots', data).then(res => res.data.data)
    }

    /**
     * Generate slots for a schedule
     * POST /api/slots/schedule/{scheduleId}/generate
     */
    async generateSlots(scheduleId: string, startDate: string, endDate: string): Promise<TimeSlot[]> {
        return this.client
            .post<BaseResponse<TimeSlot[]>>(`/slots/schedule/${scheduleId}/generate`, {
                startDate,
                endDate,
            })
            .then(res => res.data.data || [])
    }

    /**
     * Update an existing slot
     * PUT /api/slots/{id}
     */
    async updateSlot(id: string, data: UpdateSlotRequest): Promise<TimeSlot> {
        return this.client.put<BaseResponse<TimeSlot>>(`/slots/${id}`, data).then(res => res.data.data)
    }

    /**
     * Update slot booking status
     * PATCH /api/slots/{id}/booking-status
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
     * DELETE /api/slots/{id}
     */
    async deleteSlot(id: string): Promise<void> {
        return this.client.delete(`/slots/${id}`).then(() => undefined)
    }
}
