import { AxiosInstance } from "axios";
import type { BaseResponse, DynamicResponse, Relationship } from "../types";

/**
 * Relationship API
 */
export class RelationshipApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get relationships by patient ID
   * GET /api/relationship/patient/{patientId}
   */
  async getRelationships(
    patientId: string
  ): Promise<DynamicResponse<Relationship>> {
    const response = await this.client.get<DynamicResponse<Relationship>>(
      `/relationship/patient/${patientId}`
    );
    return response.data;
  }

  /**
   * Get relationship by ID
   * GET /api/relationship/{id}
   */
  async getRelationshipById(id: string): Promise<BaseResponse<Relationship>> {
    const response = await this.client.get<BaseResponse<Relationship>>(
      `/relationship/${id}`
    );
    return response.data;
  }

  /**
   * Create new relationship
   * POST /api/relationship
   */
  async createRelationship(
    data: Partial<Relationship>
  ): Promise<BaseResponse<Relationship>> {
    const response = await this.client.post<BaseResponse<Relationship>>(
      "/relationship",
      data
    );
    return response.data;
  }

  /**
   * Update relationship
   * PUT /api/relationship/{id}
   */
  async updateRelationship(
    id: string,
    data: Partial<Relationship>
  ): Promise<BaseResponse<Relationship>> {
    const response = await this.client.put<BaseResponse<Relationship>>(
      `/relationship/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete relationship
   * DELETE /api/relationship/{id}
   */
  async deleteRelationship(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(
      `/relationship/${id}`
    );
    return response.data;
  }
}
