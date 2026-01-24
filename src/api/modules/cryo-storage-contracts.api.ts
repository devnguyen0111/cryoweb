import type { AxiosInstance } from "axios";

/* =========================
   RESPONSE WRAPPER
========================= */

export interface ApiResponse<T> {
  code: number;
  systemCode?: string;
  message: string;
  data: T;
  timestamp?: string;
  success?: boolean;
}

/* =========================
   MODELS
========================= */

export interface CryoStorageSample {
  id: string;
  labSampleId: string;
  sampleCode: string;
  sampleType: string;
  notes?: string;
}

export interface CryoStorageContract {
  id: string;
  contractNumber: string;

  startDate: string;
  endDate: string;
  status: string;

  totalAmount: number;
  paidAmount: number;

  signedDate: string;
  signedBy: string;
  notes?: string;

  patientId: string;
  patientName: string;

  cryoPackageId: string;
  cryoPackageName: string;

  createdAt: string;
  updatedAt: string;

  renewFromContractId?: string;

  samples: CryoStorageSample[];
}

/* =========================
   PARAMS / REQUEST
========================= */

export interface GetCryoStorageContractsParams {
  patientId?: string;
  cryoPackageId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  contractType?: "MainContract" | "RenewContract";
  searchTerm?: string;
  page?: number;
  size?: number;
  sort?: string;
  order?: string;
}

export interface CreateCryoStorageContractRequest {
  patientId: string;
  cryoPackageId: string;
  notes?: string;
  samples: {
    labSampleId: string;
    notes?: string;
  }[];
}

export interface RenewCryoStorageContractRequest {
  contractId: string;
  patientId: string;
  cryoPackageId: string;
  notes?: string;
}

export interface UpdateCryoStorageContractRequest {
  status: string;
  notes?: string;
}

/* =========================
   API CLASS
========================= */

export class CryoStorageContractsApi {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /* GET /api/cryostoragecontracts */
  async getAll(
    params?: GetCryoStorageContractsParams
  ): Promise<ApiResponse<CryoStorageContract[]>> {
    const res = await this.client.get(
      "/cryostoragecontracts",
      { params }
    );
    return res.data;
  }

  /* GET /api/cryostoragecontracts/{id} */
  async getById(
    id: string
  ): Promise<ApiResponse<CryoStorageContract>> {
    const res = await this.client.get(
      `/cryostoragecontracts/${id}`
    );
    return res.data;
  }

  /* POST /api/cryostoragecontracts */
  async create(
    body: CreateCryoStorageContractRequest
  ): Promise<ApiResponse<CryoStorageContract>> {
    const res = await this.client.post(
      "/cryostoragecontracts",
      body
    );
    return res.data;
  }

  /* GET /api/cryostoragecontracts/renew */
  async getRenewList(params: {
    mainContractId: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    searchTerm?: string;
    page?: number;
    size?: number;
    sort?: string;
    order?: string;
  }): Promise<ApiResponse<CryoStorageContract[]>> {
    const res = await this.client.get(
      "/cryostoragecontracts/renew",
      { params }
    );
    return res.data;
  }

  /* POST /api/cryostoragecontracts/renew */
  async renew(
    body: RenewCryoStorageContractRequest
  ): Promise<ApiResponse<CryoStorageContract>> {
    const res = await this.client.post(
      "/cryostoragecontracts/renew",
      body
    );
    return res.data;
  }

  /* PUT /api/cryostoragecontracts/{id} */
  async update(
    id: string,
    body: UpdateCryoStorageContractRequest
  ): Promise<ApiResponse<CryoStorageContract>> {
    const res = await this.client.put(
      `/cryostoragecontracts/${id}`,
      body
    );
    return res.data;
  }

  /* POST /api/cryostoragecontracts/cancel */
  async cancel(
    contractId: string
  ): Promise<ApiResponse<CryoStorageContract>> {
    const res = await this.client.post(
      "/cryostoragecontracts/cancel",
      { contractId }
    );
    return res.data;
  }

  /* POST /api/cryostoragecontracts/send-otp */
  async sendOtp(
    contractId: string
  ): Promise<ApiResponse<string>> {
    const res = await this.client.post(
      "/cryostoragecontracts/send-otp",
      null,
      { params: { contractId } }
    );
    return res.data;
  }

  /* POST /api/cryostoragecontracts/verify-otp */
  async verifyOtp(
    contractId: string,
    otp: string
  ): Promise<ApiResponse<string>> {
    const res = await this.client.post(
      "/cryostoragecontracts/verify-otp",
      null,
      { params: { contractId, otp } }
    );
    return res.data;
  }
}
