// src/api/modules/cryolocation.api.ts
import { AxiosInstance } from "axios";
import type { BaseResponse, DynamicResponse } from "../types";

export type CryoLocationType = "Tank" | "Canister" | "Slot";
export type CryoSampleType = "Oocyte" | "Sperm" | "Embryo";

export interface CryoLocation {
  id: string;
  name: string;
  code: string;
  type: CryoLocationType;

  parentId?: string | null;

  sampleType?: CryoSampleType;
  capacity?: number;
  sampleCount?: number;
  availableCapacity?: number;

  isActive?: boolean;
  temperature?: number;
  notes?: string;
}

export interface UpdateCryoLocationRequest {
  isActive: boolean;
  temperature: number;
  notes: string;
}

export class CryoLocationApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Initialize default Cryo Bank
   * POST /api/cryolocation/initialize-default-bank
   */
  async initializeDefaultBank(): Promise<DynamicResponse<CryoLocation>> {
    const response = await this.client.post<DynamicResponse<CryoLocation>>(
      "/cryolocation/initialize-default-bank"
    );
    return response.data;
  }

  /**
   * Get initial tree
   * GET /api/cryolocation/initial-tree?sampleType=
   */
  async getInitialTree(
    sampleType?: CryoSampleType
  ): Promise<DynamicResponse<CryoLocation>> {
    const response = await this.client.get<DynamicResponse<CryoLocation>>(
      "/cryolocation/initial-tree",
      { params: { sampleType } }
    );
    return response.data;
  }

  /**
   * Get cryolocation by id
   * GET /api/cryolocation/{id}
   */
  async getById(id: string): Promise<BaseResponse<CryoLocation>> {
    const response = await this.client.get<BaseResponse<CryoLocation>>(
      `/cryolocation/${id}`
    );
    return response.data;
  }

  /**
   * Update cryolocation
   * PUT /api/cryolocation/{id}
   */
  async update(
    id: string,
    payload: UpdateCryoLocationRequest
  ): Promise<BaseResponse<CryoLocation>> {
    const response = await this.client.put<BaseResponse<CryoLocation>>(
      `/cryolocation/${id}`,
      payload
    );
    return response.data;
  }

  /**
   * Delete cryolocation
   * DELETE /api/cryolocation/{id}
   */
  async delete(id: string): Promise<BaseResponse<any>> {
    const response = await this.client.delete<BaseResponse<any>>(
      `/cryolocation/${id}`
    );
    return response.data;
  }

  /**
   * Get children by parentId
   * GET /api/cryolocation/{parentId}/children?isActive=
   */
  async getChildren(
    parentId: string,
    isActive?: boolean
  ): Promise<DynamicResponse<CryoLocation>> {
    const response = await this.client.get<DynamicResponse<CryoLocation>>(
      `/cryolocation/${parentId}/children`,
      { params: { isActive } }
    );
    return response.data;
  }

  /**
   * Get full tree by tankId
   * GET /api/cryolocation/{tankId}/full-tree
   */
  async getFullTreeByTank(
    tankId: string
  ): Promise<BaseResponse<CryoLocation[]>> {
    const response = await this.client.get<BaseResponse<CryoLocation[]>>(
      `/cryolocation/${tankId}/full-tree`
    );
    return response.data;
  }
}
