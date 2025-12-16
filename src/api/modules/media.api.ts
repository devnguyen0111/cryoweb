import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  Media,
  UploadMediaRequest,
  UpdateMediaRequest,
  GetMediasRequest,
} from "../types";

/**
 * Media API
 * Handles file/image uploads and management
 */
export class MediaApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Upload media file
   * POST /api/media
   */
  async uploadMedia(data: UploadMediaRequest): Promise<BaseResponse<Media>> {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.entityType) {
      formData.append("entityType", data.entityType);
    }
    if (data.entityId) {
      formData.append("entityId", data.entityId);
    }
    if (data.description) {
      formData.append("description", data.description);
    }

    const response = await this.client.post<BaseResponse<Media>>(
      "/media",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  /**
   * Get media by ID
   * GET /api/media/{id}
   */
  async getMediaById(id: string): Promise<BaseResponse<Media>> {
    const response = await this.client.get<BaseResponse<Media>>(`/media/${id}`);
    return response.data;
  }

  /**
   * Update media
   * PUT /api/media/{id}
   */
  async updateMedia(
    id: string,
    data: UpdateMediaRequest
  ): Promise<BaseResponse<Media>> {
    const response = await this.client.put<BaseResponse<Media>>(
      `/media/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete media
   * DELETE /api/media/{id}
   */
  async deleteMedia(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `/media/${id}`
    );
    return response.data;
  }

  /**
   * Get list of media
   * GET /api/media
   */
  async getMedias(params?: GetMediasRequest): Promise<DynamicResponse<Media>> {
    const response = await this.client.get<DynamicResponse<Media>>("/media", {
      params,
    });
    return response.data;
  }

  /**
   * Get media by entity
   * GET /api/media/entity/{entityType}/{entityId}
   */
  async getMediaByEntity(
    entityType: string,
    entityId: string
  ): Promise<BaseResponse<Media[]>> {
    const response = await this.client.get<BaseResponse<Media[]>>(
      `/media/entity/${entityType}/${entityId}`
    );
    return response.data;
  }
}
