import { AxiosInstance } from 'axios'

/**
 * User API types
 */
export interface User {
    id: string
    email: string
    fullName: string
    role: string
    phone: string
    createdAt: string
    updatedAt: string
    isEmailVerified?: boolean
    status?: string
}

export interface CreateUserRequest {
    fullName: string
    email: string
    phone: string
    password: string
    role?: string
}

export interface UpdateUserRequest {
    fullName?: string
    email?: string
    phone?: string
    role?: string
    status?: string
}

export interface UserSearchParams {
    query?: string
    role?: string
    status?: string
    page?: number
    limit?: number
}

export interface UserListResponse {
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface EmailExistsResponse {
    exists: boolean
}

/**
 * User Management API
 * Handles all user-related operations
 */
export class UserApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<User> {
        return this.client.get<User>(`/user/${userId}`).then(res => res.data)
    }

    /**
     * Update user by ID
     */
    async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
        return this.client.put<User>(`/user/${userId}`, data).then(res => res.data)
    }

    /**
     * Delete user by ID
     */
    async deleteUser(userId: string): Promise<{ message: string }> {
        return this.client.delete(`/user/${userId}`).then(res => res.data)
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User> {
        return this.client.get<User>('/user/by-email', { params: { email } }).then(res => res.data)
    }

    /**
     * Get user details by ID
     */
    async getUserDetails(userId: string): Promise<User> {
        return this.client.get<User>(`/user/${userId}/details`).then(res => res.data)
    }

    /**
     * Get all users with pagination and filters
     */
    async getUsers(params?: UserSearchParams): Promise<UserListResponse> {
        return this.client.get<UserListResponse>('/user', { params }).then(res => res.data)
    }

    /**
     * Create a new user
     */
    async createUser(data: CreateUserRequest): Promise<User> {
        return this.client.post<User>('/user', data).then(res => res.data)
    }

    /**
     * Search users
     */
    async searchUsers(params: UserSearchParams): Promise<UserListResponse> {
        return this.client.get<UserListResponse>('/user/search', { params }).then(res => res.data)
    }

    /**
     * Check if email exists
     */
    async checkEmailExists(email: string): Promise<EmailExistsResponse> {
        return this.client.get<EmailExistsResponse>('/user/email-exists', { params: { email } }).then(res => res.data)
    }

    /**
     * Verify user email by ID
     */
    async verifyUserEmail(userId: string): Promise<{ message: string }> {
        return this.client.post(`/user/${userId}/verify-email`).then(res => res.data)
    }

    /**
     * Update user status by ID
     */
    async updateUserStatus(userId: string, status: string): Promise<{ message: string }> {
        return this.client.put(`/user/${userId}/status`, { status }).then(res => res.data)
    }

    /**
     * Get current user profile
     */
    async getProfile(): Promise<User> {
        return this.client.get<User>('/user/profile').then(res => res.data)
    }

    /**
     * Update current user profile
     */
    async updateProfile(data: UpdateUserRequest): Promise<User> {
        return this.client.put<User>('/user/profile', data).then(res => res.data)
    }
}
