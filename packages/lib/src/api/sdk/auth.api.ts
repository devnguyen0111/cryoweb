import { AxiosInstance } from 'axios'

/**
 * Authentication API types
 */
export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    fullName: string
    email: string
    phone: string
    password: string
}

export interface AuthResponse {
    isBanned: boolean
    requiresVerification: boolean
    bannedAccountId: number
    code: number
    systemCode: string | null
    message: string
    data: {
        token: string | null
        refreshToken: string | null
        user: {
            id: number
            userName: string | null
            age: number | null
            email: string
            phone: string | null
            location: string | null
            country: string | null
            image: string | null
            status: boolean
            emailVerified: boolean
            roleId: number
            roleName: string
            createdAt: string
            updatedAt: string
        }
        emailVerified: boolean
    }
}

export interface AuthUser {
    id: number
    email: string
    fullName?: string
    phone?: string
    role?: string
    createdAt: string
    updatedAt: string
    isEmailVerified?: boolean
    status?: boolean
    // Additional fields from API
    userName?: string | null
    age?: number | null
    location?: string | null
    country?: string | null
    image?: string | null
    roleId?: number
    roleName?: string
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
     * @example
     * const response = await authApi.login({ email: 'user@example.com', password: 'password123' })
     */
    async login(data: LoginRequest): Promise<AuthResponse> {
        return this.client.post<AuthResponse>('/auth/login', data).then(res => res.data)
    }

    /**
     * Register a new user
     * @example
     * const response = await authApi.register({
     *   fullName: 'John Doe',
     *   email: 'john@example.com',
     *   phone: '+1234567890',
     *   password: 'SecurePass123'
     * })
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        return this.client.post<AuthResponse>('/auth/register', data).then(res => res.data)
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        return this.client.post('/auth/logout').then(res => res.data)
    }

    /**
     * Refresh authentication token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        return this.client.post<AuthResponse>('/auth/refresh-token', { refreshToken }).then(res => res.data)
    }

    /**
     * Get current user profile
     */
    async getCurrentUser(): Promise<AuthUser> {
        return this.client.get<AuthUser>('/user/profile').then(res => res.data)
    }

    /**
     * Update current user profile
     */
    async updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
        return this.client.put<AuthUser>('/user/profile', data).then(res => res.data)
    }

    /**
     * Request password reset
     */
    async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
        return this.client.post('/auth/forgot-password', data).then(res => res.data)
    }

    /**
     * Reset password with token
     */
    async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
        return this.client.post('/auth/reset-password', data).then(res => res.data)
    }

    /**
     * Change password for authenticated user
     */
    async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
        return this.client.post('/auth/change-password', data).then(res => res.data)
    }

    /**
     * Verify email with code
     */
    async verifyEmail(email: string, verificationCode: string): Promise<{ message: string }> {
        return this.client
            .post('/auth/verify-email', {
                email,
                verificationCode,
            })
            .then(res => res.data)
    }

    /**
     * Resend email verification
     */
    async resendVerification(email: string): Promise<{ message: string }> {
        return this.client.post('/auth/send-verification-email', { email }).then(res => res.data)
    }

    // ==================== Admin Auth Endpoints ====================

    /**
     * Create account (Admin only)
     */
    async createAccount(data: CreateAccountRequest): Promise<{ message: string }> {
        return this.client.post('/auth/admin/create-account', data).then(res => res.data)
    }

    /**
     * Send account to user (Admin only)
     */
    async sendAccountToUser(userId: number): Promise<{ message: string }> {
        return this.client.post(`/auth/admin/send-account/${userId}`).then(res => res.data)
    }

    /**
     * Set email verified (Admin only)
     */
    async setEmailVerified(userId: number, verified: boolean): Promise<{ message: string }> {
        return this.client.post('/auth/admin/set-email-verified', { userId, verified }).then(res => res.data)
    }
}

export interface CreateAccountRequest {
    fullName: string
    email: string
    phone: string
    role: string
    sendEmail?: boolean
}
