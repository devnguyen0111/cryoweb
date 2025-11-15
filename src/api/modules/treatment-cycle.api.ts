import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  TreatmentCycle,
  TreatmentCycleDetailResponseModel,
  CreateTreatmentCycleRequest,
  UpdateTreatmentCycleRequest,
  StartTreatmentCycleRequest,
  CompleteTreatmentCycleRequest,
  CancelTreatmentCycleRequest,
  GetTreatmentCyclesRequest,
  LabSample,
  AppointmentSummary,
  TreatmentCycleBillingResponse,
} from "../types";

/**
 * Treatment Cycle API
 * Matches Back-End API endpoints from /api/treatment-cycles/*
 */
export class TreatmentCycleApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of treatment cycles
   * GET /api/treatment-cycles
   */
  async getTreatmentCycles(
    params?: GetTreatmentCyclesRequest
  ): Promise<PaginatedResponse<TreatmentCycle>> {
    const response = await this.client.get<PaginatedResponse<TreatmentCycle>>(
      "/treatment-cycles",
      { params }
    );
    return response.data;
  }

  /**
   * Get treatment cycle by ID
   * GET /api/treatment-cycles/{id}
   */
  async getTreatmentCycleById(
    id: string
  ): Promise<BaseResponse<TreatmentCycleDetailResponseModel>> {
    const response = await this.client.get<
      BaseResponse<TreatmentCycleDetailResponseModel>
    >(`/treatment-cycles/${id}`);
    return response.data;
  }

  /**
   * Create new treatment cycle
   * POST /api/treatment-cycles
   */
  async createTreatmentCycle(
    data: CreateTreatmentCycleRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.post<BaseResponse<TreatmentCycle>>(
      "/treatment-cycles",
      data
    );
    return response.data;
  }

  /**
   * Update treatment cycle
   * PUT /api/treatment-cycles/{id}
   */
  async updateTreatmentCycle(
    id: string,
    data: UpdateTreatmentCycleRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.put<BaseResponse<TreatmentCycle>>(
      `/treatment-cycles/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Start treatment cycle
   * POST /api/treatment-cycles/{id}/start
   */
  async startTreatmentCycle(
    id: string,
    data: StartTreatmentCycleRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.post<BaseResponse<TreatmentCycle>>(
      `/treatment-cycles/${id}/start`,
      data
    );
    return response.data;
  }

  /**
   * Complete treatment cycle
   * POST /api/treatment-cycles/{id}/complete
   */
  async completeTreatmentCycle(
    id: string,
    data: CompleteTreatmentCycleRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.post<BaseResponse<TreatmentCycle>>(
      `/treatment-cycles/${id}/complete`,
      data
    );
    return response.data;
  }

  /**
   * Cancel treatment cycle
   * POST /api/treatment-cycles/{id}/cancel
   */
  async cancelTreatmentCycle(
    id: string,
    data: CancelTreatmentCycleRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.post<BaseResponse<TreatmentCycle>>(
      `/treatment-cycles/${id}/cancel`,
      data
    );
    return response.data;
  }

  /**
   * Get cycle samples
   * GET /api/treatment-cycles/{id}/samples
   */
  async getCycleSamples(id: string): Promise<PaginatedResponse<LabSample>> {
    const response = await this.client.get<PaginatedResponse<LabSample>>(
      `/treatment-cycles/${id}/samples`
    );
    return response.data;
  }

  /**
   * Get cycle appointments
   * GET /api/treatment-cycles/{id}/appointments
   */
  async getCycleAppointments(
    id: string
  ): Promise<PaginatedResponse<AppointmentSummary>> {
    const response = await this.client.get<
      PaginatedResponse<AppointmentSummary>
    >(`/treatment-cycles/${id}/appointments`);
    return response.data;
  }

  /**
   * Get cycle billing
   * GET /api/treatment-cycles/{id}/billing
   */
  async getCycleBilling(
    id: string
  ): Promise<BaseResponse<TreatmentCycleBillingResponse>> {
    const response = await this.client.get<
      BaseResponse<TreatmentCycleBillingResponse>
    >(`/treatment-cycles/${id}/billing`);
    return response.data;
  }
}
