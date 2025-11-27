import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  MedicalRecord,
  MedicalRecordDetailResponse,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecordListQuery,
} from "../types";

/**
 * Medical Record API
 *
 * Backend Endpoints:
 * - GET    /api/medicalrecord
 * - POST   /api/medicalrecord
 * - GET    /api/medicalrecord/{id}
 * - PUT    /api/medicalrecord/{id}
 * - DELETE /api/medicalrecord/{id}
 */
export class MedicalRecordApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapQueryParams(params?: MedicalRecordListQuery) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      AppointmentId: params.AppointmentId,
      PatientId: params.PatientId,
      SearchTerm: params.SearchTerm,
      Page: params.Page,
      Size: params.Size,
      Sort: params.Sort,
      Order: params.Order,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

  /**
   * Get list of medical records
   * GET /api/medicalrecord
   */
  async getMedicalRecords(
    params?: MedicalRecordListQuery
  ): Promise<PaginatedResponse<MedicalRecord>> {
    const response = await this.client.get<PaginatedResponse<MedicalRecord>>(
      "/medicalrecord",
      { params: this.mapQueryParams(params) }
    );
    return response.data;
  }

  /**
   * Get medical record by ID
   * GET /api/medicalrecord/{id}
   */
  async getMedicalRecordById(
    id: string
  ): Promise<BaseResponse<MedicalRecordDetailResponse>> {
    const response =
      await this.client.get<BaseResponse<MedicalRecordDetailResponse>>(
        `/medicalrecord/${id}`
      );
    return response.data;
  }

  /**
   * Create new medical record
   * POST /api/medicalrecord
   * Note: API requires query parameters, not request body
   */
  async createMedicalRecord(
    data: CreateMedicalRecordRequest
  ): Promise<BaseResponse<MedicalRecord>> {
    // Map data to query parameters as required by the API
    const params: Record<string, unknown> = {
      AppointmentId: data.appointmentId,
      ChiefComplaint: data.chiefComplaint,
      History: data.history,
      PhysicalExamination: data.physicalExamination,
      Diagnosis: data.diagnosis,
      TreatmentPlan: data.treatmentPlan,
      FollowUpInstructions: data.followUpInstructions,
      VitalSigns: data.vitalSigns,
      LabResults: data.labResults,
      ImagingResults: data.imagingResults,
      Notes: data.notes,
    };

    // Remove undefined/null values
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null) {
        delete params[key];
      }
    });

    const response = await this.client.post<BaseResponse<MedicalRecord>>(
      "/medicalrecord",
      null, // No request body
      { params } // Send as query parameters
    );
    return response.data;
  }

  /**
   * Update medical record
   * PUT /api/medicalrecord/{id}
   */
  async updateMedicalRecord(
    id: string,
    data: UpdateMedicalRecordRequest
  ): Promise<BaseResponse<MedicalRecord>> {
    const response = await this.client.put<BaseResponse<MedicalRecord>>(
      `/medicalrecord/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete medical record
   * DELETE /api/medicalrecord/{id}
   */
  async deleteMedicalRecord(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(
      `/medicalrecord/${id}`
    );
    return response.data;
  }
}

