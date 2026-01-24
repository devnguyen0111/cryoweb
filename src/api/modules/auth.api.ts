import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  BaseResponseForLogin,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ChangePasswordRequest,
  EmailVerificationModel,
  EmailRequest,
  TokenModel,
  
} from "../types";

/**
 * Authentication API
 * Matches Back-End API endpoints from /api/auth/*
 */
export interface AdminCreateAccountRequest {
  username: string;
  email: string;
  location?: string;
  phone?: string;
  roleId: string;
  status: boolean;
}
export class AuthApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Login with email and password
   * POST /api/auth/login
   *
   * @param data - Login credentials including email, password, and optional mobile flag
   * @returns BaseResponseForLogin<LoginResponse> with token, user data, and isBanned flag
   */
  async login(
    data: LoginRequest
  ): Promise<BaseResponseForLogin<LoginResponse>> {
    const response = await this.client.post<
      BaseResponseForLogin<LoginResponse>
    >("/auth/login", data);
    return response.data;
  }

  /**
   * Register new account
   * POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<BaseResponse<TokenModel>> {
    const response = await this.client.post<BaseResponse<TokenModel>>(
      "/auth/register",
      data
    );
    return response.data;
  }

  /**
   * Refresh token
   * POST /api/auth/refresh-token
   */
  async refreshToken(refreshToken: string): Promise<BaseResponse<TokenModel>> {
    const response = await this.client.post<BaseResponse<TokenModel>>(
      "/auth/refresh-token",
      { refreshToken }
    );
    return response.data;
  }

  /**
   * Forgot password
   * POST /api/auth/forgot-password
   */
  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<BaseResponse<void>> {
    const response = await this.client.post<BaseResponse<void>>(
      "/auth/forgot-password",
      data
    );
    return response.data;
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(
    data: ChangePasswordRequest
  ): Promise<BaseResponse<void>> {
    const response = await this.client.post<BaseResponse<void>>(
      "/auth/change-password",
      data
    );
    return response.data;
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(): Promise<BaseResponse<void>> {
    const response = await this.client.post<BaseResponse<void>>("/auth/logout");
    return response.data;
  }

  /**
   * Send verification email
   * POST /api/auth/send-verification-email
   */
  async sendVerificationEmail(data: EmailRequest): Promise<BaseResponse<void>> {
    const response = await this.client.post<BaseResponse<void>>(
      "/auth/send-verification-email",
      data
    );
    return response.data;
  }

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  async verifyEmail(data: EmailVerificationModel): Promise<BaseResponse<void>> {
    const response = await this.client.post<BaseResponse<void>>(
      "/auth/verify-email",
      data
    );
    return response.data;
  }

    /**
   * Admin create user account
   * POST /api/auth/admin/create-account
   */
  async createAdminAccount(
    data: AdminCreateAccountRequest
  ): Promise<BaseResponse<void>> {
    const response = await this.client.post<BaseResponse<void>>(
      "/auth/admin/create-account",
      data
    );
    return response.data;
  }
}
