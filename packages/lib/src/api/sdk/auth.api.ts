import { AxiosInstance } from 'axios'

/**
 * Authentication API types
 */
export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    clinicName: string
    fullName: string
    email: string
    phone: string
    password: string
}

export interface AuthResponse {
    token: string
    refreshToken: string
    user: {
        id: string
        email: string
        fullName: string
        clinicName: string
        role: string
    }
}

export interface User {
    id: string
    email: string
    fullName: string
    clinicName: string
    role: string
    phone: string
    createdAt: string
    updatedAt: string
}

export interface ForgotPasswordRequest {
    email: string
}

export interface ResetPasswordRequest {
    token: string
    newPassword: string
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

/**
 * Authentication API
 * Handles all authentication-related operations
 */
export class AuthApi {
    constructor(private readonly client: AxiosInstance) {}

    /**
     * Login with email and password
     * TODO: Implement actual API endpoint
     * @example
     * const response = await authApi.login({ email: 'user@example.com', password: 'password123' })
     */
    async login(data: LoginRequest): Promise<AuthResponse> {
        // TODO: Replace with actual API call
        // return this.client.post<AuthResponse>('/auth/login', data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Register a new user/clinic
     * TODO: Implement actual API endpoint
     * @example
     * const response = await authApi.register({
     *   clinicName: 'My Clinic',
     *   fullName: 'John Doe',
     *   email: 'john@example.com',
     *   phone: '+1234567890',
     *   password: 'SecurePass123'
     * })
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        // TODO: Replace with actual API call
        // return this.client.post<AuthResponse>('/auth/register', data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Logout current user
     * TODO: Implement actual API endpoint
     */
    async logout(): Promise<void> {
        // TODO: Replace with actual API call
        // return this.client.post('/auth/logout').then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Refresh authentication token
     * TODO: Implement actual API endpoint
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        // TODO: Replace with actual API call
        // return this.client.post<AuthResponse>('/auth/refresh', { refreshToken }).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Get current user profile
     * TODO: Implement actual API endpoint
     */
    async getCurrentUser(): Promise<User> {
        // TODO: Replace with actual API call
        // return this.client.get<User>('/auth/me').then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Update current user profile
     * TODO: Implement actual API endpoint
     */
    async updateProfile(data: Partial<User>): Promise<User> {
        // TODO: Replace with actual API call
        // return this.client.patch<User>('/auth/profile', data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Request password reset
     * TODO: Implement actual API endpoint
     */
    async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
        // TODO: Replace with actual API call
        // return this.client.post('/auth/forgot-password', data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Reset password with token
     * TODO: Implement actual API endpoint
     */
    async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
        // TODO: Replace with actual API call
        // return this.client.post('/auth/reset-password', data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Change password for authenticated user
     * TODO: Implement actual API endpoint
     */
    async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
        // TODO: Replace with actual API call
        // return this.client.post('/auth/change-password', data).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Verify email with token
     * TODO: Implement actual API endpoint
     */
    async verifyEmail(token: string): Promise<{ message: string }> {
        // TODO: Replace with actual API call
        // return this.client.post('/auth/verify-email', { token }).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }

    /**
     * Resend email verification
     * TODO: Implement actual API endpoint
     */
    async resendVerification(email: string): Promise<{ message: string }> {
        // TODO: Replace with actual API call
        // return this.client.post('/auth/resend-verification', { email }).then(res => res.data)

        throw new Error('API endpoint not implemented yet. Replace with actual API call.')
    }
}
