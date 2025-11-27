import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  Slot,
  SlotDetailResponse,
  CreateSlotRequest,
  UpdateSlotRequest,
  GetSlotsRequest,
} from "../types";

/**
 * Slot API
 * Matches Back-End API endpoints from /api/slots/*
 */
export class SlotApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of slots
   * GET /api/slots
   */
  async getSlots(params?: GetSlotsRequest): Promise<PaginatedResponse<Slot>> {
    const response = await this.client.get<PaginatedResponse<Slot>>("/slots", {
      params,
    });
    return response.data;
  }

  /**
   * Get slot by ID
   * GET /api/slots/{id}
   */
  async getSlotById(id: string): Promise<BaseResponse<SlotDetailResponse>> {
    const response = await this.client.get<BaseResponse<SlotDetailResponse>>(
      `/slots/${id}`
    );
    return response.data;
  }

  /**
   * Get slots by schedule
   * GET /api/slots/schedule/{scheduleId}
   */
  async getSlotsBySchedule(
    scheduleId: string,
    params?: { pageNumber?: number; pageSize?: number; isBooked?: boolean }
  ): Promise<PaginatedResponse<Slot>> {
    const response = await this.client.get<PaginatedResponse<Slot>>(
      `/slots/schedule/${scheduleId}`,
      { params }
    );
    return response.data;
  }

  /**
   * Get available slots for a doctor
   * GET /api/slots/available/doctor/{doctorId}
   */
  async getAvailableSlots(
    doctorId: string,
    params: { dateFrom: string; dateTo: string }
  ): Promise<BaseResponse<Slot[]>> {
    const response = await this.client.get<BaseResponse<Slot[]>>(
      `/slots/available/doctor/${doctorId}`,
      { params }
    );
    return response.data;
  }

  /**
   * Create new slot
   * POST /api/slots
   */
  async createSlot(data: CreateSlotRequest): Promise<BaseResponse<Slot>> {
    const response = await this.client.post<BaseResponse<Slot>>("/slots", data);
    return response.data;
  }

  /**
   * Update slot
   * PUT /api/slots/{id}
   */
  async updateSlot(
    id: string,
    data: UpdateSlotRequest
  ): Promise<BaseResponse<Slot>> {
    const response = await this.client.put<BaseResponse<Slot>>(
      `/slots/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Generate slots for a schedule
   * POST /api/slots/schedule/{scheduleId}/generate
   */
  async generateSlots(
    scheduleId: string,
    slotDuration = 30
  ): Promise<BaseResponse<number>> {
    const response = await this.client.post<BaseResponse<number>>(
      `/slots/schedule/${scheduleId}/generate`,
      {},
      {
        params: {
          slotDuration,
        },
      }
    );
    return response.data;
  }

  /**
   * Update slot booking status
   * PATCH /api/slots/{id}/booking-status
   */
  async updateSlotBookingStatus(
    id: string,
    isBooked: boolean
  ): Promise<BaseResponse<Slot>> {
    const response = await this.client.patch<BaseResponse<Slot>>(
      `/slots/${id}/booking-status`,
      { isBooked }
    );
    return response.data;
  }

  /**
   * Delete slot
   * DELETE /api/slots/{id}
   */
  async deleteSlot(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `/slots/${id}`
    );
    return response.data;
  }

  /**
   * Get slot details
   * GET /api/slots/{id}/details
   */
  async getSlotDetails(id: string): Promise<BaseResponse<SlotDetailResponse>> {
    const response = await this.client.get<BaseResponse<SlotDetailResponse>>(
      `/slots/${id}/details`
    );
    return response.data;
  }
}
