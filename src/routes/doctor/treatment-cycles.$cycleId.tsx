import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/doctor/treatment-cycles/$cycleId")({
  component: DoctorTreatmentCycleDetail,
});

const ALLOWED_STATUSES = [
  "Planned",
  "COS",
  "OPU",
  "Fertilization",
  "ET",
  "Completed",
  "Cancelled",
];

function DoctorTreatmentCycleDetail() {
  const { cycleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("Planned");

  const { data, isFetching } = useQuery({
    queryKey: ["doctor", "treatment-cycle", cycleId],
    queryFn: async () => {
      const response = await api.treatmentCycle.getTreatmentCycleById(cycleId);
      return response.data;
      // Move 'onSuccess' logic to a separate useEffect to avoid useQuery prop error
    },
  });
  useEffect(() => {
    if (data?.status) {
      setSelectedStatus(data.status);
    }
  }, [data?.status]);

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      api.treatmentCycle.updateTreatmentCycle(cycleId, { status }),
    onSuccess: () => {
      toast.success("Treatment cycle status updated.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", cycleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Unable to update status.");
    },
  });

  const cycle = data;

  const infoItems = [
    { label: "Patient", value: cycle?.patientId || "Not linked" },
    { label: "Cycle type", value: cycle?.treatmentType || "-" },
    { label: "Start", value: cycle?.startDate || "-" },
    { label: "Expected end", value: cycle?.endDate || "-" },
  ];

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Cycle details</h1>
            <p className="text-gray-600">
              Cycle ID: <span className="font-semibold">{cycleId}</span>
            </p>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {cycle?.treatmentType || "Cycle"}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Current status: {cycle?.status || "Planned"}
                </p>
                <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                  {infoItems.map((item) => (
                    <div key={item.label}>
                      <p className="text-gray-500">{item.label}</p>
                      <p className="text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: "/doctor/treatment-cycles/$cycleId/workflow",
                      params: { cycleId },
                    })
                  }
                >
                  Open workflow
                </Button>
                <Button
                  onClick={() =>
                    navigate({ to: "/doctor/cryobank", search: { cycleId } })
                  }
                >
                  View cryobank
                </Button>
              </div>
            </CardHeader>
          </Card>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Cycle timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-600">
                <p>
                  Key milestones. Update the status to keep the lab and cryobank
                  in sync.
                </p>
                <div className="flex flex-wrap gap-3">
                  {ALLOWED_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs font-semibold transition",
                        selectedStatus === status
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate(selectedStatus)}
                >
                  Save status
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>{cycle?.notes || "No notes yet."}</p>
                <p>- Reminder: complete consent before the OPU phase.</p>
                <p>
                  - Coordinate with the cryobank to prepare frozen samples if
                  planning frozen embryo transfer.
                </p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Related tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>- Nursing: update ovarian stimulation progress daily.</p>
              <p>- Lab: prepare the IVF kit ahead of the planned OPU date.</p>
              <p>
                - Physician: sign luteal support prescriptions before day +5.
              </p>
            </CardContent>
          </Card>

          {isFetching && (
            <p className="text-sm text-gray-500">Refreshing data...</p>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
