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
   * POST /api/media/upload
   */
  async uploadMedia(data: UploadMediaRequest): Promise<BaseResponse<Media>> {
    const formData = new FormData();
    formData.append("File", data.file);
    formData.append("FileName", data.file.name);
    if (data.entityType) {
      formData.append("RelatedEntityType", data.entityType);
    }
    if (data.entityId) {
      formData.append("RelatedEntityId", data.entityId);
    }
    if (data.description) {
      formData.append("Description", data.description);
    }
    if (data.title) {
      formData.append("Title", data.title);
    }
    if (data.category) {
      formData.append("Category", data.category);
    }
    if (data.tags) {
      formData.append("Tags", data.tags);
    }
    if (data.isPublic !== undefined) {
      formData.append("IsPublic", data.isPublic.toString());
    }
    if (data.notes) {
      formData.append("Notes", data.notes);
    }

    const response = await this.client.post<BaseResponse<Media>>(
      "/media/upload",
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
    // Map legacy parameters to new API parameters for backward compatibility
    const queryParams: Record<string, any> = {};

    if (params) {
      // New API parameters (priority)
      if (params.SearchTerm !== undefined)
        queryParams.SearchTerm = params.SearchTerm;
      if (params.RelatedEntityType !== undefined)
        queryParams.RelatedEntityType = params.RelatedEntityType;
      if (params.RelatedEntityId !== undefined)
        queryParams.RelatedEntityId = params.RelatedEntityId;
      if (params.PatientId !== undefined)
        queryParams.PatientId = params.PatientId;
      if (params.UpLoadByUserId !== undefined)
        queryParams.UpLoadByUserId = params.UpLoadByUserId;
      if (params.Page !== undefined) queryParams.Page = params.Page;
      if (params.Size !== undefined) queryParams.Size = params.Size;
      if (params.Sort !== undefined) queryParams.Sort = params.Sort;
      if (params.Order !== undefined) queryParams.Order = params.Order;

      // Legacy parameters (fallback if new ones not provided)
      if (params.pageNumber !== undefined && params.Page === undefined) {
        queryParams.Page = params.pageNumber;
      }
      if (params.pageSize !== undefined && params.Size === undefined) {
        queryParams.Size = params.pageSize;
      }
      if (
        params.entityType !== undefined &&
        params.RelatedEntityType === undefined
      ) {
        queryParams.RelatedEntityType = params.entityType;
      }
      if (
        params.entityId !== undefined &&
        params.RelatedEntityId === undefined
      ) {
        queryParams.RelatedEntityId = params.entityId;
      }
    }

    const response = await this.client.get<DynamicResponse<Media>>("/media", {
      params: queryParams,
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
