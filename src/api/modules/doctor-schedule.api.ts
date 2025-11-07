import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  DoctorSchedule,
  DoctorScheduleListQuery,
} from "../types";

const COLLECTION_ENDPOINTS = [
  "/doctor-schedules",
  "/doctor-schedule",
  "/DoctorSchedules",
  "/DoctorSchedule",
];

const BY_DOCTOR_ENDPOINT_TEMPLATES = [
  "/doctor-schedules/doctor/",
  "/doctor-schedule/doctor/",
  "/DoctorSchedules/doctor/",
  "/DoctorSchedule/doctor/",
];

export class DoctorScheduleApi {
  constructor(private readonly client: AxiosInstance) {}

  private async tryGetCollection(
    params?: DoctorScheduleListQuery
  ): Promise<DynamicResponse<DoctorSchedule>> {
    let lastError: unknown;
    for (const endpoint of COLLECTION_ENDPOINTS) {
      try {
        const response = await this.client.get<DynamicResponse<DoctorSchedule>>(
          endpoint,
          { params }
        );
        return response.data;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status === 404) {
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error("Doctor schedule endpoint not found.");
  }

  private async tryGetByDoctor(
    doctorId: string,
    params?: DoctorScheduleListQuery
  ): Promise<DynamicResponse<DoctorSchedule>> {
    let lastError: unknown;
    for (const template of BY_DOCTOR_ENDPOINT_TEMPLATES) {
      const endpoint = `${template}${doctorId}`;
      try {
        const response = await this.client.get<DynamicResponse<DoctorSchedule>>(
          endpoint,
          { params }
        );
        return response.data;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status === 404) {
          continue;
        }
        throw error;
      }
    }
    throw (
      lastError ?? new Error("Doctor schedule endpoint not found for doctorId.")
    );
  }

  private async tryPostCollection(
    payload: Partial<DoctorSchedule>
  ): Promise<BaseResponse<DoctorSchedule>> {
    let lastError: unknown;
    for (const endpoint of COLLECTION_ENDPOINTS) {
      try {
        const response = await this.client.post<BaseResponse<DoctorSchedule>>(
          endpoint,
          payload
        );
        return response.data;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status === 404) {
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error("Unable to create doctor schedule.");
  }

  private async tryPut(
    id: string,
    payload: Partial<DoctorSchedule>
  ): Promise<BaseResponse<DoctorSchedule>> {
    let lastError: unknown;
    for (const endpoint of COLLECTION_ENDPOINTS) {
      try {
        const response = await this.client.put<BaseResponse<DoctorSchedule>>(
          `${endpoint}/${id}`,
          payload
        );
        return response.data;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status === 404) {
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error("Unable to update doctor schedule.");
  }

  private async tryDelete(id: string): Promise<BaseResponse> {
    let lastError: unknown;
    for (const endpoint of COLLECTION_ENDPOINTS) {
      try {
        const response = await this.client.delete<BaseResponse>(
          `${endpoint}/${id}`
        );
        return response.data;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status === 404) {
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error("Unable to delete doctor schedule.");
  }

  async getDoctorSchedules(
    params?: DoctorScheduleListQuery
  ): Promise<DynamicResponse<DoctorSchedule>> {
    return this.tryGetCollection(params);
  }

  async getDoctorScheduleById(
    id: string
  ): Promise<BaseResponse<DoctorSchedule>> {
    let lastError: unknown;
    for (const endpoint of COLLECTION_ENDPOINTS) {
      try {
        const response = await this.client.get<BaseResponse<DoctorSchedule>>(
          `${endpoint}/${id}`
        );
        return response.data;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status === 404) {
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error("Doctor schedule not found by ID.");
  }

  async getSchedulesByDoctor(
    doctorId: string,
    params?: DoctorScheduleListQuery
  ): Promise<DynamicResponse<DoctorSchedule>> {
    return this.tryGetByDoctor(doctorId, params);
  }

  async createDoctorSchedule(
    data: Partial<DoctorSchedule>
  ): Promise<BaseResponse<DoctorSchedule>> {
    return this.tryPostCollection(data);
  }

  async updateDoctorSchedule(
    id: string,
    data: Partial<DoctorSchedule>
  ): Promise<BaseResponse<DoctorSchedule>> {
    return this.tryPut(id, data);
  }

  async deleteDoctorSchedule(id: string): Promise<BaseResponse> {
    return this.tryDelete(id);
  }
}
