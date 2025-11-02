/**
 * Shared API types
 */

/**
 * Base response wrapper from API
 */
export interface BaseResponse<T> {
    code: number
    systemCode: string | null
    message: string
    data: T
    timestamp: string
    success: boolean
}

/**
 * Dynamic response wrapper with pagination metadata
 */
export interface DynamicResponse<T> {
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
