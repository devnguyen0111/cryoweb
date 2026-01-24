import { AxiosInstance } from "axios";
import type { BaseResponse, DynamicResponse } from "../types";

/* =======================
   ENUM & TYPES
======================= */

export type SampleType = "Oocyte" | "Sperm" | "Embryo";
export type CryoLocationType = "Bank" | "Tank" | "Canister" | "Slot";
export type LabSampleStatus = "Stored" | "Used" | "Discarded";

/* =======================
   MODELS
======================= */

export interface LabSample {
  id: string;
  patientId: string;
  sampleCode: string;
  sampleType: SampleType;
  status: LabSampleStatus;
  collectionDate: string;
  isAvailable: boolean;
  isStoraged: boolean;
  storageDate: string;
  expiryDate: string;
  quality: string;
  notes: string;
  canFrozen: boolean;
  canFertilize: boolean;
}

export interface CryoLocation {
  id: string;
  name: string;
  code: string;
  type: CryoLocationType;
  sampleType: SampleType;
  parentId: string;
  capacity: number;
  sampleCount: number;
  availableCapacity: number;
  isActive: boolean;
  temperature: number;
  notes: string;
}

export interface CryoImport {
  id: string;
  labSampleId: string;
  cryoLocationId: string;
  importDate: string;
  importedBy: string;
  witnessedBy: string;
  temperature: number;
  reason: string;
  notes: string;

  labSample: LabSample;
  cryoLocation: CryoLocation;

  createdAt: string;
  updatedAt: string;
}

/* =======================
   REQUEST
======================= */

export interface CreateCryoImportRequest {
  labSampleId: string;
  cryoLocationId: string;
  importDate: string;
  importedBy: string;
  witnessedBy: string;
  temperature: number;
  reason: string;
  notes: string;
}

export interface UpdateCryoImportRequest {
  importDate: string;
  importedBy: string;
  witnessedBy: string;
  temperature: number;
  reason: string;
  notes: string;
}

/* =======================
   API CLASS
======================= */

export class CryoImportApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * GET /api/cryoimport
   * Danh sách các lần import (có phân trang)
   */
  async getAll(): Promise<DynamicResponse<CryoImport>> {
    const res = await this.client.get<DynamicResponse<CryoImport>>(
      "/cryoimport"
    );
    return res.data;
  }

  /**
   * GET /api/cryoimport/{id}
   * Lấy chi tiết 1 lần import
   */
  async getById(id: string): Promise<BaseResponse<CryoImport>> {
    const res = await this.client.get<BaseResponse<CryoImport>>(
      `/cryoimport/${id}`
    );
    return res.data;
  }

  /**
 * POST /api/cryoimport
 * Import mẫu vào CryoLocation (slot)
 * Swagger dùng query params, không phải JSON body
 */
async create(payload: CreateCryoImportRequest): Promise<BaseResponse<CryoImport>> {
  const res = await this.client.post<BaseResponse<CryoImport>>(
    "/cryoimport",
    null,
    { params: payload }
  );
  return res.data;
}

  /**
   * PUT /api/cryoimport/{id}
   * Cập nhật thông tin import
   */
  async update(
    id: string,
    payload: UpdateCryoImportRequest
  ): Promise<BaseResponse<CryoImport>> {
    const res = await this.client.put<BaseResponse<CryoImport>>(
      `/cryoimport/${id}`,
      payload
    );
    return res.data;
  }
}
