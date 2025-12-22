import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  DynamicResponse,
  LabSample,
  SampleListQuery,
  LabSampleDetailResponse,
  GetAllDetailSamplesQuery,
  CreateLabSampleSpermRequest,
  CreateLabSampleOocyteRequest,
  CreateLabSampleEmbryoRequest,
  UpdateLabSampleSpermRequest,
  UpdateLabSampleOocyteRequest,
  UpdateLabSampleEmbryoRequest,
} from "../types";

/**
 * Lab Sample API
 */
export class SampleApi {
  constructor(private readonly client: AxiosInstance) {}

  private mapSampleListQuery(params?: SampleListQuery) {
    if (!params) {
      return undefined;
    }

    const mapped: Record<string, unknown> = {
      // New API format (priority)
      SampleType: params.SampleType ?? params.sampleType,
      Status: params.Status ?? params.status,
      CanFrozen: params.CanFrozen ?? params.canFrozen,
      SearchTerm: params.SearchTerm ?? params.searchTerm,
      PatientId: params.PatientId ?? params.patientId,
      Page: params.Page ?? params.pageNumber ?? (params as any).page,
      Size: params.Size ?? params.pageSize ?? (params as any).size,
      Sort: params.Sort ?? params.sort ?? (params as any).sortBy,
      Order: params.Order ?? params.order ?? (params as any).sortOrder,
    };

    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === undefined || mapped[key] === null) {
        delete mapped[key];
      }
    });

    return mapped;
  }

  /**
   * Get list of samples
   * GET /api/labsample
   */
  async getSamples(
    params?: SampleListQuery
  ): Promise<DynamicResponse<LabSample>> {
    const response = await this.client.get<DynamicResponse<LabSample>>(
      "/labsample",
      { params: this.mapSampleListQuery(params) }
    );
    return response.data;
  }

  /**
   * Get sample by ID
   * GET /api/labsample/{id}
   */
  async getSampleById(id: string): Promise<BaseResponse<LabSample>> {
    const response = await this.client.get<BaseResponse<LabSample>>(
      `/labsample/${id}`
    );
    return response.data;
  }

  /**
   * Create new sperm sample
   * POST /api/labsample/sperm
   */
  async createSpermSample(
    data: CreateLabSampleSpermRequest
  ): Promise<BaseResponse<LabSample>> {
    // Map to query params format
    const queryParams: Record<string, any> = {};
    
    // Map new API format
    if (data.PatientId) queryParams.PatientId = data.PatientId;
    if (data.Volume !== undefined) queryParams.Volume = data.Volume;
    if (data.Concentration !== undefined) queryParams.Concentration = data.Concentration;
    if (data.Motility !== undefined) queryParams.Motility = data.Motility;
    if (data.ProgressiveMotility !== undefined) queryParams.ProgressiveMotility = data.ProgressiveMotility;
    if (data.Morphology !== undefined) queryParams.Morphology = data.Morphology;
    if (data.PH !== undefined) queryParams.PH = data.PH;
    if (data.Viscosity) queryParams.Viscosity = data.Viscosity;
    if (data.Liquefaction) queryParams.Liquefaction = data.Liquefaction;
    if (data.Color) queryParams.Color = data.Color;
    if (data.TotalSpermCount !== undefined) queryParams.TotalSpermCount = data.TotalSpermCount;
    if (data.Notes) queryParams.Notes = data.Notes;
    if (data.Quality) queryParams.Quality = data.Quality;
    if (data.IsAvailable !== undefined) queryParams.IsAvailable = data.IsAvailable;
    if (data.IsQualityCheck !== undefined) queryParams.IsQualityCheck = data.IsQualityCheck;
    
    // Legacy support
    if (data.patientId && !data.PatientId) queryParams.PatientId = data.patientId;

    const response = await this.client.post<BaseResponse<LabSample>>(
      "/labsample/sperm",
      null,
      { params: queryParams }
    );
    return response.data;
  }

  /**
   * Create new oocyte sample
   * POST /api/labsample/oocyte
   */
  async createOocyteSample(
    data: CreateLabSampleOocyteRequest
  ): Promise<BaseResponse<LabSample>> {
    // Map to query params format
    const queryParams: Record<string, any> = {};
    
    // Map new API format
    if (data.PatientId) queryParams.PatientId = data.PatientId;
    if (data.MaturityStage) queryParams.MaturityStage = data.MaturityStage;
    if (data.IsMature !== undefined) queryParams.IsMature = data.IsMature;
    if (data.CumulusCells) queryParams.CumulusCells = data.CumulusCells;
    if (data.CytoplasmAppearance) queryParams.CytoplasmAppearance = data.CytoplasmAppearance;
    if (data.IsVitrified !== undefined) queryParams.IsVitrified = data.IsVitrified;
    if (data.Notes) queryParams.Notes = data.Notes;
    if (data.Quality) queryParams.Quality = data.Quality;
    if (data.IsAvailable !== undefined) queryParams.IsAvailable = data.IsAvailable;
    if (data.IsQualityCheck !== undefined) queryParams.IsQualityCheck = data.IsQualityCheck;
    
    // Legacy support
    if (data.patientId && !data.PatientId) queryParams.PatientId = data.patientId;

    const response = await this.client.post<BaseResponse<LabSample>>(
      "/labsample/oocyte",
      null,
      { params: queryParams }
    );
    return response.data;
  }

  /**
   * Create new embryo sample
   * POST /api/labsample/embryo
   */
  async createEmbryoSample(
    data: CreateLabSampleEmbryoRequest
  ): Promise<BaseResponse<LabSample>> {
    // Map to query params format
    const queryParams: Record<string, any> = {};
    
    // Map new API format
    if (data.PatientId) queryParams.PatientId = data.PatientId;
    if (data.LabSampleOocyteId) queryParams.LabSampleOocyteId = data.LabSampleOocyteId;
    if (data.LabSampleSpermId) queryParams.LabSampleSpermId = data.LabSampleSpermId;
    if (data.DayOfDevelopment !== undefined) queryParams.DayOfDevelopment = data.DayOfDevelopment;
    if (data.Grade) queryParams.Grade = data.Grade;
    if (data.CellCount !== undefined) queryParams.CellCount = data.CellCount;
    if (data.Morphology) queryParams.Morphology = data.Morphology;
    if (data.IsBiopsied !== undefined) queryParams.IsBiopsied = data.IsBiopsied;
    if (data.IsPGTTested !== undefined) queryParams.IsPGTTested = data.IsPGTTested;
    if (data.PGTResult) queryParams.PGTResult = data.PGTResult;
    if (data.FertilizationMethod) queryParams.FertilizationMethod = data.FertilizationMethod;
    if (data.Notes) queryParams.Notes = data.Notes;
    if (data.Quality) queryParams.Quality = data.Quality;
    if (data.IsAvailable !== undefined) queryParams.IsAvailable = data.IsAvailable;
    if (data.IsQualityCheck !== undefined) queryParams.IsQualityCheck = data.IsQualityCheck;
    
    // Legacy support
    if (data.patientId && !data.PatientId) queryParams.PatientId = data.patientId;

    const response = await this.client.post<BaseResponse<LabSample>>(
      "/labsample/embryo",
      null,
      { params: queryParams }
    );
    return response.data;
  }

  /**
   * Create new sample (legacy - maps to appropriate endpoint)
   * POST /api/labsample
   */
  async createSample(
    data: Partial<LabSample> | CreateLabSampleSpermRequest | CreateLabSampleOocyteRequest | CreateLabSampleEmbryoRequest
  ): Promise<BaseResponse<LabSample>> {
    // Determine sample type and route to appropriate endpoint
    const sampleType = (data as any).sampleType || (data as any).SampleType;
    
    if (sampleType === "Sperm") {
      return this.createSpermSample(data as CreateLabSampleSpermRequest);
    } else if (sampleType === "Oocyte") {
      return this.createOocyteSample(data as CreateLabSampleOocyteRequest);
    } else if (sampleType === "Embryo") {
      return this.createEmbryoSample(data as CreateLabSampleEmbryoRequest);
    }
    
    // Fallback to old endpoint if type not specified
    const response = await this.client.post<BaseResponse<LabSample>>(
      "/labsample",
      data
    );
    return response.data;
  }

  /**
   * Update sperm sample
   * PUT /api/labsample/sperm/{id}
   */
  async updateSpermSample(
    id: string,
    data: UpdateLabSampleSpermRequest
  ): Promise<BaseResponse<LabSample>> {
    const response = await this.client.put<BaseResponse<LabSample>>(
      `/labsample/sperm/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Update oocyte sample
   * PUT /api/labsample/oocyte/{id}
   */
  async updateOocyteSample(
    id: string,
    data: UpdateLabSampleOocyteRequest
  ): Promise<BaseResponse<LabSample>> {
    const response = await this.client.put<BaseResponse<LabSample>>(
      `/labsample/oocyte/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Update embryo sample
   * PUT /api/labsample/embryo/{id}
   */
  async updateEmbryoSample(
    id: string,
    data: UpdateLabSampleEmbryoRequest
  ): Promise<BaseResponse<LabSample>> {
    const response = await this.client.put<BaseResponse<LabSample>>(
      `/labsample/embryo/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Update frozen status
   * PUT /api/labsample/frozen/{id}
   */
  async updateFrozenStatus(
    id: string,
    canFrozen: boolean
  ): Promise<BaseResponse<LabSample>> {
    const response = await this.client.put<BaseResponse<LabSample>>(
      `/labsample/frozen/${id}`,
      { canFrozen }
    );
    return response.data;
  }

  /**
   * Update sample (legacy - maps to appropriate endpoint based on sample type)
   * PUT /api/labsample/{id}
   */
  async updateSample(
    id: string,
    data: Partial<LabSample> | UpdateLabSampleSpermRequest | UpdateLabSampleOocyteRequest | UpdateLabSampleEmbryoRequest
  ): Promise<BaseResponse<LabSample>> {
    // Try to determine sample type from data or fetch sample first
    const sampleType = (data as any).sampleType;
    
    // If sample type is in data, route to specific endpoint
    if (sampleType === "Sperm" || (data as UpdateLabSampleSpermRequest).volume !== undefined) {
      return this.updateSpermSample(id, data as UpdateLabSampleSpermRequest);
    } else if (sampleType === "Oocyte" || (data as UpdateLabSampleOocyteRequest).maturityStage !== undefined) {
      return this.updateOocyteSample(id, data as UpdateLabSampleOocyteRequest);
    } else if (sampleType === "Embryo" || (data as UpdateLabSampleEmbryoRequest).dayOfDevelopment !== undefined) {
      return this.updateEmbryoSample(id, data as UpdateLabSampleEmbryoRequest);
    }
    
    // Fallback: try to get sample first to determine type
    try {
      const sample = await this.getSampleById(id);
      if (sample.data) {
        if (sample.data.sampleType === "Sperm") {
          return this.updateSpermSample(id, data as UpdateLabSampleSpermRequest);
        } else if (sample.data.sampleType === "Oocyte") {
          return this.updateOocyteSample(id, data as UpdateLabSampleOocyteRequest);
        } else if (sample.data.sampleType === "Embryo") {
          return this.updateEmbryoSample(id, data as UpdateLabSampleEmbryoRequest);
        }
      }
    } catch {
      // If fetch fails, use generic endpoint
    }
    
    // Fallback to generic endpoint
    const response = await this.client.put<BaseResponse<LabSample>>(
      `/labsample/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete sample
   * DELETE /api/labsample/{id}
   */
  async deleteSample(id: string): Promise<BaseResponse<void>> {
    const response = await this.client.delete<BaseResponse<void>>(`/labsample/${id}`);
    return response.data;
  }

  /**
   * Get all detail samples with nested objects
   * GET /api/labsample/all-detail
   */
  async getAllDetailSamples(
    params: GetAllDetailSamplesQuery
  ): Promise<DynamicResponse<LabSampleDetailResponse>> {
    // Map parameters to API format
    const queryParams: Record<string, any> = {};
    
    // Required parameter
    queryParams.SampleType = params.SampleType || params.sampleType;
    
    // Optional parameters (new API format - priority)
    if (params.Status !== undefined) queryParams.Status = params.Status;
    if (params.CanFrozen !== undefined) queryParams.CanFrozen = params.CanFrozen;
    if (params.SearchTerm !== undefined) queryParams.SearchTerm = params.SearchTerm;
    if (params.PatientId !== undefined) queryParams.PatientId = params.PatientId;
    if (params.Page !== undefined) queryParams.Page = params.Page;
    if (params.Size !== undefined) queryParams.Size = params.Size;
    if (params.Sort !== undefined) queryParams.Sort = params.Sort;
    if (params.Order !== undefined) queryParams.Order = params.Order;
    
    // Legacy parameters (fallback if new ones not provided)
    if (params.status !== undefined && params.Status === undefined) {
      queryParams.Status = params.status;
    }
    if (params.canFrozen !== undefined && params.CanFrozen === undefined) {
      queryParams.CanFrozen = params.canFrozen;
    }
    if (params.searchTerm !== undefined && params.SearchTerm === undefined) {
      queryParams.SearchTerm = params.searchTerm;
    }
    if (params.patientId !== undefined && params.PatientId === undefined) {
      queryParams.PatientId = params.patientId;
    }
    if (params.pageNumber !== undefined && params.Page === undefined) {
      queryParams.Page = params.pageNumber;
    }
    if (params.pageSize !== undefined && params.Size === undefined) {
      queryParams.Size = params.pageSize;
    }
    if (params.sort !== undefined && params.Sort === undefined) {
      queryParams.Sort = params.sort;
    }
    if (params.order !== undefined && params.Order === undefined) {
      queryParams.Order = params.order;
    }

    const response = await this.client.get<DynamicResponse<LabSampleDetailResponse>>(
      "/labsample/all-detail",
      { params: queryParams }
    );
    return response.data;
  }
}
