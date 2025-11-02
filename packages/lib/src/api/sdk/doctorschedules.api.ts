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
 * Doctor Schedule API types
 */
export interface DoctorSchedule {
    id: string
    doctorId: string
    workDate: string
    startTime: string
    endTime: string
    location?: string
    notes?: string
    isAvailable: boolean
    createdAt: string
    updatedAt?: string
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
    workDate: string
    startTime: string
    endTime: string
    location?: string
    notes?: string
    isAvailable: boolean
}

export interface UpdateDoctorScheduleRequest extends Partial<CreateDoctorScheduleRequest> {
    isAvailable?: boolean
}

export interface DoctorScheduleListQuery {
    page?: number
    limit?: number
    doctorId?: string
    startDate?: string
    endDate?: string
    isAvailable?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface DoctorScheduleListResponse {
    data: DoctorSchedule[]
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

/**
 * Doctor Schedule Management API
 * Handles all doctor schedule-related operations
 * Based on Swagger: https://cryofert.runasp.net/swagger/v1/swagger.json
 */
export class DoctorSchedulesApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get list of doctor schedules with pagination and filtering
     * GET /api/doctor-schedules
     */
    async getDoctorSchedules(query?: DoctorScheduleListQuery): Promise<DoctorScheduleListResponse> {
        const params = new URLSearchParams()
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value))
                }
            })
        }
        const response = await this.client.get<DynamicResponse<DoctorSchedule[]>>(`/doctor-schedules?${params}`)
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
     * Get a single doctor schedule by ID
     * GET /api/doctor-schedules/{id}
     */
    async getDoctorSchedule(id: string): Promise<DoctorSchedule> {
        return this.client.get<BaseResponse<DoctorSchedule>>(`/doctor-schedules/${id}`).then(res => res.data.data)
    }

    /**
     * Get doctor schedule details by ID
     * GET /api/doctor-schedules/{id}/details
     */
    async getDoctorScheduleDetails(id: string): Promise<DoctorSchedule> {
        return this.client
            .get<BaseResponse<DoctorSchedule>>(`/doctor-schedules/${id}/details`)
            .then(res => res.data.data)
    }

    /**
     * Get schedules by doctor ID
     * GET /api/doctor-schedules/doctor/{doctorId}
     */
    async getDoctorSchedulesByDoctor(doctorId: string): Promise<DoctorSchedule[]> {
        return this.client
            .get<BaseResponse<DoctorSchedule[]>>(`/doctor-schedules/doctor/${doctorId}`)
            .then(res => res.data.data || [])
    }

    /**
     * Create a new doctor schedule
     * POST /api/doctor-schedules
     */
    async createDoctorSchedule(data: CreateDoctorScheduleRequest): Promise<DoctorSchedule> {
        return this.client.post<BaseResponse<DoctorSchedule>>('/doctor-schedules', data).then(res => res.data.data)
    }

    /**
     * Update an existing doctor schedule
     * PUT /api/doctor-schedules/{id}
     */
    async updateDoctorSchedule(id: string, data: UpdateDoctorScheduleRequest): Promise<DoctorSchedule> {
        return this.client.put<BaseResponse<DoctorSchedule>>(`/doctor-schedules/${id}`, data).then(res => res.data.data)
    }

    /**
     * Update doctor schedule availability
     * PATCH /api/doctor-schedules/{id}/availability
     */
    async updateDoctorScheduleAvailability(id: string, isAvailable: boolean): Promise<DoctorSchedule> {
        return this.client
            .patch<BaseResponse<DoctorSchedule>>(`/doctor-schedules/${id}/availability`, { isAvailable })
            .then(res => res.data.data)
    }

    /**
     * Delete a doctor schedule
     * DELETE /api/doctor-schedules/{id}
     */
    async deleteDoctorSchedule(id: string): Promise<void> {
        return this.client.delete(`/doctor-schedules/${id}`).then(() => undefined)
    }
}
