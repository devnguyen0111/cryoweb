import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  Medicine,
  CreateMedicineRequest,
  UpdateMedicineRequest,
} from "../types";

/**
 * Medicine API
 *
 * Backend Endpoints:
 * - GET    /api/medicine
 * - POST   /api/medicine
 * - GET    /api/medicine/{id}
 * - PUT    /api/medicine/{id}
 * - DELETE /api/medicine/{id}
 */
export class MedicineApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of medicines
   * GET /api/medicine
   * Query params: Page, Size, Sort, Order
   */
  async getMedicines(params?: {
    pageNumber?: number;
    pageSize?: number;
    sort?: string;
    order?: string;
  }): Promise<PaginatedResponse<Medicine>> {
    const apiParams: Record<string, unknown> = {
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

    const response = await this.client.get<PaginatedResponse<Medicine>>(
      "/medicine",
      { params: apiParams }
    );
    return response.data;
  }

  /**
   * Get medicine by ID
   * GET /api/medicine/{id}
   */
  async getMedicineById(id: string): Promise<BaseResponse<Medicine>> {
    const response = await this.client.get<BaseResponse<Medicine>>(
      `/medicine/${id}`
    );
    return response.data;
  }

  /**
   * Create new medicine
   * POST /api/medicine
   */
  async createMedicine(
    data: CreateMedicineRequest
  ): Promise<BaseResponse<Medicine>> {
    const response = await this.client.post<BaseResponse<Medicine>>(
      "/medicine",
      data
    );
    return response.data;
  }

  /**
   * Update medicine
   * PUT /api/medicine/{id}
   */
  async updateMedicine(
    id: string,
    data: UpdateMedicineRequest
  ): Promise<BaseResponse<Medicine>> {
    const response = await this.client.put<BaseResponse<Medicine>>(
      `/medicine/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete medicine
   * DELETE /api/medicine/{id}
   */
  async deleteMedicine(id: string): Promise<BaseResponse<string>> {
    const response = await this.client.delete<BaseResponse<string>>(
      `/medicine/${id}`
    );
    return response.data;
  }
}
