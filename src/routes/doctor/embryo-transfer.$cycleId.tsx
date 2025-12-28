import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EmbryoTransferForm } from "@/features/doctor/embryo-transfer/EmbryoTransferForm";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/doctor/embryo-transfer/$cycleId")({
  component: EmbryoTransferDetailPage,
});

function EmbryoTransferDetailPage() {
  const params = Route.useParams() as { cycleId: string };
  const cycleId = params.cycleId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["embryo-transfer-cycles"] });
    queryClient.invalidateQueries({ queryKey: ["embryo-transfer-embryos"] });
    queryClient.invalidateQueries({ queryKey: ["treatment-cycle", cycleId] });
    navigate({ to: "/doctor/embryo-transfer" });
  };

  const handleCancel = () => {
    navigate({ to: "/doctor/embryo-transfer" });
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Xác nhận chuyển phôi</h1>
              <p className="text-gray-600 mt-2">
                Điền thông tin để xác nhận quy trình chuyển phôi
              </p>
            </div>
          </div>

          <EmbryoTransferForm
            cycleId={cycleId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
