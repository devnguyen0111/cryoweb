import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  LoginRequest,
  AuthResponse,
  LoginResponse,
  User,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
} from "../types";

/**
 * Authentication API
 */
export class AuthApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Login with email and password
   * POST /api/auth/login
   *
   * @param data - Login credentials including email, password, and optional mobile flag
   * @returns LoginResponse with token, user data, and status flags (isBanned, requiresVerification)
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>("/auth/login", data);
    return response.data;
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(): Promise<BaseResponse> {
    const response = await this.client.post<BaseResponse>("/auth/logout");
    return response.data;
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<BaseResponse<User>>("/auth/me");
    if (!response.data.data) {
      throw new Error("User data not found");
    }
    return response.data.data;
  }

  /**
   * Refresh token
   * POST /api/auth/refresh-token
   */
  async refreshToken(
    refreshToken: string
  ): Promise<BaseResponse<AuthResponse>> {
    const response = await this.client.post<BaseResponse<AuthResponse>>(
      "/auth/refresh-token",
      {
        refreshToken,
      }
    );
    return response.data;
  }

  /**
   * Update profile
   * PUT /api/auth/profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.put<BaseResponse<User>>(
      "/auth/profile",
      data
    );
    if (!response.data.data) {
      throw new Error("User data not found");
    }
    return response.data.data;
  }

  /**
   * Register new account
   * POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<BaseResponse<AuthResponse>> {
    const response = await this.client.post<BaseResponse<AuthResponse>>(
      "/auth/register",
      data
    );
    return response.data;
  }

  /**
   * Forgot password
   * POST /api/auth/forgot-password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<BaseResponse> {
    const response = await this.client.post<BaseResponse>(
      "/auth/forgot-password",
      data
    );
    return response.data;
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<BaseResponse> {
    const response = await this.client.post<BaseResponse>(
      "/auth/reset-password",
      data
    );
    return response.data;
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(data: ChangePasswordRequest): Promise<BaseResponse> {
    const response = await this.client.post<BaseResponse>(
      "/auth/change-password",
      data
    );
    return response.data;
  }

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<BaseResponse> {
    const response = await this.client.post<BaseResponse>(
      "/auth/verify-email",
      data
    );
    return response.data;
  }

  /**
   * Send verification email
   * POST /api/auth/send-verification-email
   */
  async sendVerificationEmail(): Promise<BaseResponse> {
    const response = await this.client.post<BaseResponse>(
      "/auth/send-verification-email"
    );
    return response.data;
  }
}
