import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  TreatmentCycle,
  TreatmentCycleDetailResponseModel,
  CreateTreatmentCycleRequest,
  UpdateTreatmentCycleRequest,
  UpdateTreatmentCycleStatusRequest,
  StartTreatmentCycleRequest,
  CompleteTreatmentCycleRequest,
  CancelTreatmentCycleRequest,
  GetTreatmentCyclesRequest,
  LabSample,
  AppointmentSummary,
  TreatmentCycleBillingResponse,
  AddCycleSampleRequest,
  AddCycleAppointmentRequest,
  AddCycleDocumentRequest,
  DocumentSummary,
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
    // Map frontend params to backend params
    const backendParams: Record<string, unknown> = {};

    if (params?.Page !== undefined) {
      backendParams.Page = params.Page;
    } else if (params?.pageNumber !== undefined) {
      backendParams.Page = params.pageNumber;
    }

    if (params?.Size !== undefined) {
      backendParams.Size = params.Size;
    } else if (params?.pageSize !== undefined) {
      backendParams.Size = params.pageSize;
    }

    if (params?.TreatmentId) {
      backendParams.TreatmentId = params.TreatmentId;
    } else if (params?.treatmentId) {
      backendParams.TreatmentId = params.treatmentId;
    }

    if (params?.PatientId) {
      backendParams.PatientId = params.PatientId;
    } else if (params?.patientId) {
      backendParams.PatientId = params.patientId;
    }

    if (params?.DoctorId) {
      backendParams.DoctorId = params.DoctorId;
    } else if (params?.doctorId) {
      backendParams.DoctorId = params.doctorId;
    }

    if (params?.Status) {
      backendParams.Status = params.Status;
    } else if (params?.status) {
      backendParams.Status = params.status;
    }

    if (params?.FromDate) {
      backendParams.FromDate = params.FromDate;
    } else if (params?.startDateFrom) {
      backendParams.FromDate = params.startDateFrom;
    }

    if (params?.ToDate) {
      backendParams.ToDate = params.ToDate;
    } else if (params?.startDateTo) {
      backendParams.ToDate = params.startDateTo;
    }

    if (params?.SearchTerm) {
      backendParams.SearchTerm = params.SearchTerm;
    } else if (params?.searchTerm) {
      backendParams.SearchTerm = params.searchTerm;
    }

    if (params?.Sort) {
      backendParams.Sort = params.Sort;
    }

    if (params?.Order) {
      backendParams.Order = params.Order;
    }

    const response = await this.client.get<PaginatedResponse<TreatmentCycle>>(
      "/treatment-cycles",
      { params: backendParams }
    );

    // Normalize response metaData to match our expected format
    const data = response.data;
    if (data.metaData) {
      // Handle both formats: { page, size, total } and { pageNumber, pageSize, totalCount }
      const meta = data.metaData as any;
      if (meta.page !== undefined && meta.pageNumber === undefined) {
        data.metaData = {
          pageNumber: meta.page,
          pageSize: meta.size || meta.currentPageSize || 50,
          totalCount: meta.total,
          totalPages:
            meta.totalPages || Math.ceil((meta.total || 0) / (meta.size || 50)),
          hasPrevious: meta.hasPrevious || false,
          hasNext: meta.hasNext || false,
        };
      }
    }

    return data;
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
   * Delete treatment cycle
   * DELETE /api/treatment-cycles/{id}
   */
  async deleteTreatmentCycle(id: string): Promise<BaseResponse<null>> {
    const response = await this.client.delete<BaseResponse<null>>(
      `/treatment-cycles/${id}`
    );
    return response.data;
  }

  /**
   * Update treatment cycle status
   * PUT /api/treatment-cycles/status
   */
  async updateTreatmentCycleStatus(
    params: UpdateTreatmentCycleStatusRequest
  ): Promise<BaseResponse<TreatmentCycle>> {
    const response = await this.client.put<BaseResponse<TreatmentCycle>>(
      "/treatment-cycles/status",
      null,
      {
        params: {
          TreatmentId: params.TreatmentId,
          CycleNumber: params.CycleNumber,
          Status: params.Status,
          ...(params.Notes && { Notes: params.Notes }),
        },
      }
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
   * Add sample to cycle
   * POST /api/treatment-cycles/{id}/samples
   */
  async addCycleSample(
    id: string,
    data: AddCycleSampleRequest
  ): Promise<BaseResponse<LabSample>> {
    const response = await this.client.post<BaseResponse<LabSample>>(
      `/treatment-cycles/${id}/samples`,
      data
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
   * Add appointment to cycle
   * POST /api/treatment-cycles/{id}/appointments
   */
  async addCycleAppointment(
    id: string,
    data: AddCycleAppointmentRequest
  ): Promise<BaseResponse<AppointmentSummary>> {
    const response = await this.client.post<BaseResponse<AppointmentSummary>>(
      `/treatment-cycles/${id}/appointments`,
      data
    );
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

  /**
   * Get cycle documents
   * GET /api/treatment-cycles/{id}/documents
   */
  async getCycleDocuments(
    id: string
  ): Promise<BaseResponse<DocumentSummary[]>> {
    const response = await this.client.get<BaseResponse<DocumentSummary[]>>(
      `/treatment-cycles/${id}/documents`
    );
    return response.data;
  }

  /**
   * Add document to cycle
   * POST /api/treatment-cycles/{id}/documents
   */
  async addCycleDocument(
    id: string,
    data: AddCycleDocumentRequest
  ): Promise<BaseResponse<DocumentSummary>> {
    const response = await this.client.post<BaseResponse<DocumentSummary>>(
      `/treatment-cycles/${id}/documents`,
      data
    );
    return response.data;
  }
}
