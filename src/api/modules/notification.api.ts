import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  GetNotificationsRequest,
} from "../types";

/**
 * Notification API
 * Matches Back-End API endpoints from /api/notification/*
 */
export class NotificationApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of notifications
   * GET /api/notification
   */
  async getNotifications(
    params?: GetNotificationsRequest
  ): Promise<PaginatedResponse<Notification>> {
    const queryParams: Record<string, unknown> = {};

    if (params) {
      if (params.SearchTerm) queryParams.SearchTerm = params.SearchTerm;
      if (params.PatientId) queryParams.PatientId = params.PatientId;
      if (params.UserId) queryParams.UserId = params.UserId;
      if (params.Type) queryParams.Type = params.Type;
      if (params.Status) queryParams.Status = params.Status;
      if (params.IsImportant !== undefined)
        queryParams.IsImportant = params.IsImportant;
      if (params.FromDate) queryParams.FromDate = params.FromDate;
      if (params.ToDate) queryParams.ToDate = params.ToDate;
      if (params.Page !== undefined) queryParams.Page = params.Page;
      if (params.Size !== undefined) queryParams.Size = params.Size;
      if (params.Sort) queryParams.Sort = params.Sort;
      if (params.Order) queryParams.Order = params.Order;
    }

    const response = await this.client.get<PaginatedResponse<Notification>>(
      "/notification",
      { params: Object.keys(queryParams).length > 0 ? queryParams : undefined }
    );
    return response.data;
  }

  /**
   * Get notification by ID
   * GET /api/notification/{id}
   */
  async getNotificationById(id: string): Promise<BaseResponse<Notification>> {
    const response = await this.client.get<BaseResponse<Notification>>(
      `/notification/${id}`
    );
    return response.data;
  }

  /**
   * Create new notification
   * POST /api/notification
   */
  async createNotification(
    data: CreateNotificationRequest
  ): Promise<BaseResponse<Notification>> {
    const response = await this.client.post<BaseResponse<Notification>>(
      "/notification",
      data
    );
    return response.data;
  }

  /**
   * Update notification
   * PUT /api/notification/{id}
   */
  async updateNotification(
    id: string,
    data: UpdateNotificationRequest
  ): Promise<BaseResponse<Notification>> {
    const response = await this.client.put<BaseResponse<Notification>>(
      `/notification/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete notification
   * DELETE /api/notification/{id}
   */
  async deleteNotification(id: string): Promise<BaseResponse<string>> {
    const response = await this.client.delete<BaseResponse<string>>(
      `/notification/${id}`
    );
    return response.data;
  }
}
