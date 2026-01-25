// src/api/modules/cryopackage.api.ts

import { AxiosInstance } from "axios";

/**
 * CryoPackage API
 *
 * Backend Endpoints:
 * - GET    /api/cryopackage
 * - POST   /api/cryopackage
 * - GET    /api/cryopackage/{id}
 * - PUT    /api/cryopackage/{id}
 * - DELETE /api/cryopackage/{id}
 *
 * Lưu ý,
 * MedicineApi dùng "/medicine" vì baseURL đã là "/api",
 * CryoPackageApi cũng dùng "/cryopackage" tương tự.
 */

/* =========================
   TYPES, keep inside 1 file
========================= */

export type SampleType = "Oocyte" | "Sperm" | "Embryo";

export interface CryoPackage {
  id: string;
  packageName: string;
  description?: string;
  price: number;
  durationMonths: number;
  maxSamples: number;
  sampleType: SampleType;
  includesInsurance: boolean;
  insuranceAmount: number;
  isActive: boolean;
  benefits?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BaseResponse<T> {
  code: number;
  systemCode: string;
  message: string;
  data: T;
  timestamp: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pageNumber?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
}

export interface CreateCryoPackageRequest {
  packageName: string;
  price?: number;
  durationMonths?: number;
  maxSamples?: number;
  sampleType?: SampleType;
  includesInsurance?: boolean;
  insuranceAmount?: number;
  isActive?: boolean;
  benefits?: string;
  notes?: string;
  description?: string;
}

export interface UpdateCryoPackageRequest {
  packageName: string;
  price: number;
  durationMonths: number;
  maxSamples: number;
  sampleType: SampleType;
  includesInsurance: boolean;
  insuranceAmount: number;
  isActive: boolean;
  benefits?: string;
  notes?: string;
  description?: string;
}

/* =========================
   API CLASS, same style as MedicineApi
========================= */

export class CryoPackageApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of cryo packages
   * GET /api/cryopackage
   * Query params: SearchTerm, SampleType, IsActive, Page, Size, Sort, Order
   */
  async getCryoPackages(params?: {
    searchTerm?: string;
    sampleType?: SampleType;
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
    sort?: string;
    order?: string;
  }): Promise<PaginatedResponse<CryoPackage>> {
    const apiParams: Record<string, unknown> = {
      SearchTerm: params?.searchTerm,
      SampleType: params?.sampleType,
      IsActive: params?.isActive,
      Page: params?.pageNumber,
      Size: params?.pageSize,
      Sort: params?.sort,
      Order: params?.order,
    };

    Object.keys(apiParams).forEach((key) => {
      if (apiParams[key] === undefined || apiParams[key] === null) {
        delete apiParams[key];
      }
    });

    const response = await this.client.get<PaginatedResponse<CryoPackage>>(
      "/cryopackage",
      { params: apiParams }
    );

    return response.data;
  }

  /**
   * Get cryo package by ID
   * GET /api/cryopackage/{id}
   */
  async getCryoPackageById(id: string): Promise<BaseResponse<CryoPackage>> {
    const response = await this.client.get<BaseResponse<CryoPackage>>(
      `/cryopackage/${id}`
    );
    return response.data;
  }

  /**
   * Create new cryo package
   * POST /api/cryopackage
   *
   * Swagger của bạn là query params,
   * nên axios sẽ post null body, và truyền params trong config.
   */
  async createCryoPackage(
    data: CreateCryoPackageRequest
  ): Promise<BaseResponse<CryoPackage>> {
    const apiParams: Record<string, unknown> = {
      PackageName: data.packageName,
      Price: data.price,
      DurationMonths: data.durationMonths,
      MaxSamples: data.maxSamples,
      SampleType: data.sampleType,
      IncludesInsurance: data.includesInsurance,
      InsuranceAmount: data.insuranceAmount,
      IsActive: data.isActive,
      Benefits: data.benefits,
      Notes: data.notes,
      Description: data.description,
    };

    Object.keys(apiParams).forEach((key) => {
      if (apiParams[key] === undefined || apiParams[key] === null) {
        delete apiParams[key];
      }
    });

    const response = await this.client.post<BaseResponse<CryoPackage>>(
      "/cryopackage",
      null,
      { params: apiParams }
    );

    return response.data;
  }

  /**
   * Update cryo package
   * PUT /api/cryopackage/{id}
   * Body JSON
   */
  async updateCryoPackage(
    id: string,
    data: UpdateCryoPackageRequest
  ): Promise<BaseResponse<CryoPackage>> {
    const response = await this.client.put<BaseResponse<CryoPackage>>(
      `/cryopackage/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete cryo package
   * DELETE /api/cryopackage/{id}
   */
  async deleteCryoPackage(id: string): Promise<BaseResponse<string>> {
    const response = await this.client.delete<BaseResponse<string>>(
      `/cryopackage/${id}`
    );
    return response.data;
  }
}
