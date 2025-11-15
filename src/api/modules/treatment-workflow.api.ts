/**
 * Treatment Workflow API
 * API methods for managing IUI and IVF workflow data
 *
 * Note: This is a placeholder API module. In production, the backend should
 * have dedicated endpoints for storing and retrieving detailed workflow data.
 * Currently, workflow data is temporarily stored in the treatment cycle notes field.
 */

import { AxiosInstance } from "axios";
import type { BaseResponse, PaginatedResponse } from "../types";
import type {
  IUIWorkflowData,
  IVFWorkflowData,
  TreatmentWorkflowData,
} from "@/types/treatment-workflow";

/**
 * Treatment Workflow API
 *
 * Future Backend Endpoints (to be implemented):
 * - POST /api/treatment-cycles/{cycleId}/workflow/iui
 * - PUT /api/treatment-cycles/{cycleId}/workflow/iui
 * - GET /api/treatment-cycles/{cycleId}/workflow/iui
 * - POST /api/treatment-cycles/{cycleId}/workflow/ivf
 * - PUT /api/treatment-cycles/{cycleId}/workflow/ivf
 * - GET /api/treatment-cycles/{cycleId}/workflow/ivf
 * - GET /api/treatment-cycles/{cycleId}/workflow/history
 */
export class TreatmentWorkflowApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Save IUI workflow data
   * POST /api/treatment-cycles/{cycleId}/workflow/iui
   *
   * @future This endpoint needs to be implemented in the backend
   */
  async saveIUIWorkflow(
    cycleId: string,
    data: IUIWorkflowData
  ): Promise<BaseResponse<IUIWorkflowData>> {
    // TODO: Implement when backend endpoint is available
    // const response = await this.client.post<BaseResponse<IUIWorkflowData>>(
    //   `/treatment-cycles/${cycleId}/workflow/iui`,
    //   data
    // );
    // return response.data;

    // Temporary: Store in cycle notes
    const workflowJson = JSON.stringify(data, null, 2);
    const notes = `IUI Workflow Data:\n${workflowJson}`;

    await this.client.put(`/treatment-cycles/${cycleId}`, {
      notes,
      status: data.currentStatus,
    });

    return {
      code: 200,
      message: "IUI workflow saved (temporary storage)",
      data,
    };
  }

  /**
   * Get IUI workflow data
   * GET /api/treatment-cycles/{cycleId}/workflow/iui
   *
   * @future This endpoint needs to be implemented in the backend
   */
  async getIUIWorkflow(
    cycleId: string
  ): Promise<BaseResponse<IUIWorkflowData>> {
    // TODO: Implement when backend endpoint is available
    // const response = await this.client.get<BaseResponse<IUIWorkflowData>>(
    //   `/treatment-cycles/${cycleId}/workflow/iui`
    // );
    // return response.data;

    // Temporary: Parse from cycle notes
    const cycleResponse = await this.client.get(`/treatment-cycles/${cycleId}`);
    const notes = cycleResponse.data?.data?.notes || "";

    try {
      const jsonMatch = notes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const workflowData = JSON.parse(jsonMatch[0]) as IUIWorkflowData;
        return {
          code: 200,
          message: "IUI workflow retrieved",
          data: workflowData,
        };
      }
    } catch (error) {
      console.error("Error parsing IUI workflow:", error);
    }

    throw new Error("IUI workflow data not found");
  }

  /**
   * Save IVF workflow data
   * POST /api/treatment-cycles/{cycleId}/workflow/ivf
   *
   * @future This endpoint needs to be implemented in the backend
   */
  async saveIVFWorkflow(
    cycleId: string,
    data: IVFWorkflowData
  ): Promise<BaseResponse<IVFWorkflowData>> {
    // TODO: Implement when backend endpoint is available
    // const response = await this.client.post<BaseResponse<IVFWorkflowData>>(
    //   `/treatment-cycles/${cycleId}/workflow/ivf`,
    //   data
    // );
    // return response.data;

    // Temporary: Store in cycle notes
    const workflowJson = JSON.stringify(data, null, 2);
    const notes = `IVF Workflow Data:\n${workflowJson}`;

    await this.client.put(`/treatment-cycles/${cycleId}`, {
      notes,
      status: data.currentStatus,
    });

    return {
      code: 200,
      message: "IVF workflow saved (temporary storage)",
      data,
    };
  }

  /**
   * Get IVF workflow data
   * GET /api/treatment-cycles/{cycleId}/workflow/ivf
   *
   * @future This endpoint needs to be implemented in the backend
   */
  async getIVFWorkflow(
    cycleId: string
  ): Promise<BaseResponse<IVFWorkflowData>> {
    // TODO: Implement when backend endpoint is available
    // const response = await this.client.get<BaseResponse<IVFWorkflowData>>(
    //   `/treatment-cycles/${cycleId}/workflow/ivf`
    // );
    // return response.data;

    // Temporary: Parse from cycle notes
    const cycleResponse = await this.client.get(`/treatment-cycles/${cycleId}`);
    const notes = cycleResponse.data?.data?.notes || "";

    try {
      const jsonMatch = notes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const workflowData = JSON.parse(jsonMatch[0]) as IVFWorkflowData;
        return {
          code: 200,
          message: "IVF workflow retrieved",
          data: workflowData,
        };
      }
    } catch (error) {
      console.error("Error parsing IVF workflow:", error);
    }

    throw new Error("IVF workflow data not found");
  }

  /**
   * Get workflow history for a cycle
   * GET /api/treatment-cycles/{cycleId}/workflow/history
   *
   * @future This endpoint needs to be implemented in the backend
   */
  async getWorkflowHistory(
    cycleId: string
  ): Promise<PaginatedResponse<TreatmentWorkflowData>> {
    // TODO: Implement when backend endpoint is available
    throw new Error("Workflow history endpoint not yet implemented");
  }

  /**
   * Delete workflow data
   * DELETE /api/treatment-cycles/{cycleId}/workflow
   *
   * @future This endpoint needs to be implemented in the backend
   */
  async deleteWorkflow(cycleId: string): Promise<BaseResponse<void>> {
    // TODO: Implement when backend endpoint is available
    throw new Error("Delete workflow endpoint not yet implemented");
  }
}

/**
 * Backend Implementation Notes:
 *
 * The backend should create new database tables to store detailed workflow data:
 *
 * 1. TreatmentWorkflow table:
 *    - Id (PK)
 *    - TreatmentCycleId (FK)
 *    - WorkflowType (IUI/IVF/Other)
 *    - CurrentStatus
 *    - StartDate
 *    - CompletionDate
 *    - FinalOutcome
 *    - CreatedAt
 *    - UpdatedAt
 *
 * 2. IUIWorkflowData table:
 *    - Id (PK)
 *    - WorkflowId (FK)
 *    - StimulationData (JSON or separate table)
 *    - SpermPreparationData (JSON or separate table)
 *    - InseminationData (JSON or separate table)
 *    - LutealSupportData (JSON or separate table)
 *    - PregnancyTestData (JSON or separate table)
 *
 * 3. IVFWorkflowData table:
 *    - Id (PK)
 *    - WorkflowId (FK)
 *    - StimulationData (JSON or separate table)
 *    - OocytePickupData (JSON or separate table)
 *    - SpermPreparationData (JSON or separate table)
 *    - FertilizationData (JSON or separate table)
 *    - EmbryoCultureData (JSON or separate table)
 *    - EmbryoTransferData (JSON or separate table)
 *    - LutealSupportData (JSON or separate table)
 *    - PregnancyTestData (JSON or separate table)
 *
 * Alternatively, use a single table with JSON columns for flexibility:
 *
 * TreatmentWorkflowData:
 *    - Id (PK)
 *    - TreatmentCycleId (FK)
 *    - WorkflowType
 *    - WorkflowDataJson (JSON - stores the complete IUI or IVF workflow data)
 *    - Version
 *    - CreatedAt
 *    - UpdatedAt
 */
