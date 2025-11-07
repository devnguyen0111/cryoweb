import { AxiosInstance } from "axios";
import type { BaseResponse, DynamicResponse, User } from "../types";

/**
 * User API
 */
export class UserApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of users
   * GET /api/user
   */
  async getUsers(params?: {
    Page?: number;
    Size?: number;
    SearchTerm?: string;
  }): Promise<DynamicResponse<User>> {
    const response = await this.client.get<DynamicResponse<User>>("/user", {
      params,
    });
    return response.data;
  }

  /**
   * Get user by ID
   * GET /api/user/{id}
   */
  async getUserById(id: string): Promise<BaseResponse<User>> {
    const response = await this.client.get<BaseResponse<User>>(`/user/${id}`);
    return response.data;
  }

  /**
   * Create new user
   * POST /api/user
   */
  async createUser(data: Partial<User>): Promise<BaseResponse<User>> {
    const response = await this.client.post<BaseResponse<User>>("/user", data);
    return response.data;
  }

  /**
   * Update user
   * PUT /api/user/{id}
   */
  async updateUser(
    id: string,
    data: Partial<User>
  ): Promise<BaseResponse<User>> {
    const response = await this.client.put<BaseResponse<User>>(
      `/user/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete user
   * DELETE /api/user/{id}
   */
  async deleteUser(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/user/${id}`);
    return response.data;
  }
}
