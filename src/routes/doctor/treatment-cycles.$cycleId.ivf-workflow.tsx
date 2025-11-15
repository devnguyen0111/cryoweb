/**
 * IVF Workflow Route
 * Complete IVF treatment cycle workflow with all steps
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { IVFWorkflowForm } from "@/features/doctor/treatment-cycles/IVFWorkflowForm";
import type { IVFWorkflowData } from "@/types/treatment-workflow";
import type { TreatmentCycle } from "@/api/types";

export const Route = createFileRoute(
  "/doctor/treatment-cycles/$cycleId/ivf-workflow"
)({
  component: IVFWorkflowPage,
});

function IVFWorkflowPage() {
  const { cycleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch cycle data
  const { data: cycleData, isLoading } = useQuery({
    queryKey: ["treatment-cycle", cycleId],
    queryFn: async () => {
      const response = await api.treatmentCycle.getTreatmentCycleById(cycleId);
      return response.data;
    },
  });

  // Parse stored workflow data from notes if available
  // In production, this would be stored in a dedicated field or separate table
  const parseWorkflowData = (): Partial<IVFWorkflowData> | undefined => {
    try {
      if (cycleData?.notes) {
        const jsonMatch = cycleData.notes.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error("Error parsing workflow data:", error);
    }
    return undefined;
  };

  const handleSave = async (data: IVFWorkflowData) => {
    try {
      // Store workflow data in notes field (temporary solution)
      // In production, this should be stored in a dedicated table/field
      const workflowJson = JSON.stringify(data, null, 2);
      const notes = `IVF Workflow Data:\n${workflowJson}`;

      await api.treatmentCycle.updateTreatmentCycle(cycleId, {
        notes,
      });

      queryClient.invalidateQueries({ queryKey: ["treatment-cycle", cycleId] });
      toast.success("IVF workflow saved successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save workflow");
      throw error;
    }
  };

  const handleComplete = async (data: IVFWorkflowData) => {
    try {
      // Store final workflow data
      const workflowJson = JSON.stringify(data, null, 2);
      const notes = `IVF Workflow Data (Completed):\n${workflowJson}`;

      await api.treatmentCycle.completeTreatmentCycle(cycleId, {
        endDate: new Date().toISOString(),
        result: data.pregnancyTest?.outcome || "Unknown",
        notes,
      });

      queryClient.invalidateQueries({ queryKey: ["treatment-cycle", cycleId] });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });

      toast.success("IVF cycle completed successfully!");

      // Navigate back to cycle details
      navigate({
        to: "/doctor/treatment-cycles/$cycleId",
        params: { cycleId },
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to complete IVF cycle"
      );
      throw error;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading IVF workflow...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!cycleData) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">Treatment cycle not found</p>
              <Button
                className="mt-4"
                onClick={() => navigate({ to: "/doctor/treatment-cycles" })}
              >
                Back to Cycles
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const cycle = cycleData as TreatmentCycle;

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">IVF Treatment Workflow</h1>
                <p className="text-gray-600">
                  Cycle ID: <span className="font-semibold">{cycleId}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Patient: {cycle.patientId || "Not linked"} | Status:{" "}
                  {cycle.status || "COS"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/doctor/treatment-cycles/$cycleId",
                    params: { cycleId },
                  })
                }
              >
                Back to Cycle Details
              </Button>
            </div>
          </section>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>IVF Workflow Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                This comprehensive workflow guides you through all stages of the
                IVF treatment cycle:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>
                  <strong>Kích thích buồng trứng (COS):</strong> Protocol,
                  medications, USG monitoring, E2 levels
                </li>
                <li>
                  <strong>Chọc hút trứng (OPU):</strong> Total oocytes,
                  MII/MI/GV classification, morphology
                </li>
                <li>
                  <strong>Chuẩn bị tinh trùng:</strong> Fresh/frozen analysis,
                  processing method
                </li>
                <li>
                  <strong>Thụ tinh:</strong> IVF/ICSI method, fertilization rate
                </li>
                <li>
                  <strong>Nuôi phôi:</strong> Daily embryo development tracking,
                  grading
                </li>
                <li>
                  <strong>Chuyển phôi (ET/FET):</strong> Transfer details,
                  embryo quality, freezing
                </li>
                <li>
                  <strong>Hỗ trợ hoàng thể:</strong> Luteal support medications
                </li>
                <li>
                  <strong>Test thai:</strong> β-hCG, ultrasound, final outcome
                </li>
              </ul>
              <p className="pt-2 font-medium text-primary">
                Cycle Status Progression: Planned → COS → OPU → Fert → Culture →
                ET/FET → Preg(+/–) → Closed
              </p>
              <p className="pt-2 text-xs text-gray-500">
                All data is auto-saved. You can return to this workflow at any
                time to update information.
              </p>
            </CardContent>
          </Card>

          {/* Workflow Form */}
          <IVFWorkflowForm
            cycleId={cycleId}
            patientId={cycle.patientId || ""}
            treatmentId={cycle.treatmentId || ""}
            initialData={parseWorkflowData()}
            onSave={handleSave}
            onComplete={handleComplete}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
