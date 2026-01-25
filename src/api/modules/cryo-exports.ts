import type { DynamicResponse } from "@/api/types";

/* =====================
   TYPES
===================== */

export type SampleType = "Oocyte" | "Sperm" | "Embryo";
export type CryoLocationType = "Tank" | "Canister" | "Golbet" | "Slot";

export interface CryoExport {
  id: string;
  labSampleId: string;
  cryoLocationId: string;

  exportDate: string;
  exportedBy: string;
  witnessedBy: string;

  reason: string;
  destination: string;
  notes: string;

  isThawed: boolean;
  thawingDate: string;
  thawingResult: string;

  labSample: {
    id: string;
    patientId: string;
    sampleCode: string;
    sampleType: SampleType;
    status: string;
    collectionDate: string;
    isAvailable: boolean;
    isStoraged: boolean;
    storageDate: string;
    expiryDate: string;
    quality: string;
    notes: string;
    canFrozen: boolean;
    canFertilize: boolean;
  };

  cryoLocation: {
    id: string;
    name: string;
    code: string;
    type: CryoLocationType;
    sampleType: SampleType;
    parentId: string;
    capacity: number;
    sampleCount: number;
    availableCapacity: number;
    isActive: boolean;
    temperature: number;
    notes: string;
  };

  createdAt: string;
  updatedAt: string;
}

/* =====================
   API CLASS
===================== */

export class CryoExportApi {
  constructor(private client: any) {}

  async getAll(): Promise<DynamicResponse<CryoExport>> {
    const res = await this.client.get("/cryoexport");
    return res.data;
  }

  async getById(id: string): Promise<DynamicResponse<CryoExport>> {
    const res = await this.client.get(`/cryoexport/${id}`);
    return res.data;
  }

  async create(payload: {
    labSampleId: string;
    cryoLocationId: string;
    exportedBy: string;
    witnessedBy: string;
    reason: string;
    destination: string;
    notes?: string;
    isThawed: boolean;
    thawingDate?: string;
    thawingResult?: string;
  }): Promise<DynamicResponse<CryoExport>> {
    const res = await this.client.post("/cryoexport", payload);
    return res.data;
  }

  async update(
    id: string,
    payload: Partial<{
      reason: string;
      destination: string;
      notes: string;
      isThawed: boolean;
      thawingDate: string;
      thawingResult: string;
    }>
  ): Promise<DynamicResponse<CryoExport>> {
    const res = await this.client.put(`/cryoexport/${id}`, payload);
    return res.data;
  }
}
