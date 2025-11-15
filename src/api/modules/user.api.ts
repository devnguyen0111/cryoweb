import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  User,
  UserDetailResponse,
  UpdateUserRequest,
  GetUsersRequest,
} from "../types";

/**
 * User API
 * Matches Back-End API endpoints from /api/user/*
 */
export class UserApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get current user profile
   * GET /api/user/profile
   */
  async getCurrentUser(): Promise<BaseResponse<UserDetailResponse>> {
    const response =
      await this.client.get<BaseResponse<UserDetailResponse>>("/user/profile");
    return response.data;
  }

  /**
   * Get user by ID
   * GET /api/user/{userId}
   */
  async getUserById(userId: string): Promise<BaseResponse<UserDetailResponse>> {
    const response = await this.client.get<BaseResponse<UserDetailResponse>>(
      `/user/${userId}`
    );
    return response.data;
  }

  /**
   * Get list of users
   * GET /api/user
   */
  async getUsers(params?: GetUsersRequest): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<PaginatedResponse<User>>("/user", {
      params,
    });
    return response.data;
  }

  /**
   * Update user profile
   * PUT /api/user/profile
   */
  async updateProfile(data: UpdateUserRequest): Promise<BaseResponse<User>> {
    const response = await this.client.put<BaseResponse<User>>(
      "/user/profile",
      data
    );
    return response.data;
  }

  /**
   * Update user by ID
   * PUT /api/user/{userId}
   */
  async updateUser(
    userId: string,
    data: UpdateUserRequest
  ): Promise<BaseResponse<User>> {
    const response = await this.client.put<BaseResponse<User>>(
      `/user/${userId}`,
      data
    );
    return response.data;
  }

  /**
   * Check if email exists
   * GET /api/user/email-exists
   */
  async checkEmailExists(email: string): Promise<BaseResponse<boolean>> {
    const response = await this.client.get<BaseResponse<boolean>>(
      "/user/email-exists",
      { params: { email } }
    );
    return response.data;
  }
}
