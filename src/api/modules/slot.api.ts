import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  TimeSlot,
  SlotListQuery,
} from "../types";

/**
 * Slot API
 */
export class SlotApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get list of slots
   * GET /api/slot
   */
  async getSlots(params?: SlotListQuery): Promise<DynamicResponse<TimeSlot>> {
    const response = await this.client.get<DynamicResponse<TimeSlot>>(
      "/slots",
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Get slot by ID
   * GET /api/slot/{id}
   */
  async getSlotById(id: string): Promise<BaseResponse<TimeSlot>> {
    const response = await this.client.get<BaseResponse<TimeSlot>>(
      `/slots/${id}`
    );
    return response.data;
  }

  /**
   * Create new slot
   * POST /api/slot
   */
  async createSlot(data: Partial<TimeSlot>): Promise<BaseResponse<TimeSlot>> {
    const response = await this.client.post<BaseResponse<TimeSlot>>(
      "/slots",
      data
    );
    return response.data;
  }

  /**
   * Update slot
   * PUT /api/slot/{id}
   */
  async updateSlot(
    id: string,
    data: Partial<TimeSlot>
  ): Promise<BaseResponse<TimeSlot>> {
    const response = await this.client.put<BaseResponse<TimeSlot>>(
      `/slots/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete slot
   * DELETE /api/slot/{id}
   */
  async deleteSlot(id: string): Promise<BaseResponse> {
    const response = await this.client.delete<BaseResponse>(`/slots/${id}`);
    return response.data;
  }

  /**
   * Generate multiple slots automatically
   * POST /api/slot/generate
   */
  async generateSlots(
    scheduleId: string,
    startDate: string,
    endDate: string,
    slotDuration = 30
  ): Promise<BaseResponse<TimeSlot[]>> {
    const response = await this.client.post<BaseResponse<TimeSlot[]>>(
      `/slots/schedule/${scheduleId}/generate`,
      { startDate, endDate },
      {
        params: {
          slotDuration,
        },
      }
    );
    return response.data;
  }
}
