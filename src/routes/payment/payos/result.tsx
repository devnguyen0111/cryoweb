import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/payment/payos/result")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
    id: typeof search.id === "string" ? search.id : "",
    cancel: typeof search.cancel === "string" ? search.cancel : "",
    status: typeof search.status === "string" ? search.status : "",
    orderCode: typeof search.orderCode === "string" ? search.orderCode : "",
  }),
  component: PayOSResultComponent,
});

function PayOSResultComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const { code, id, cancel, status, orderCode } = search;

  // Determine payment success based on PayOS response parameters
  // Success conditions:
  // - code === "00" (success response code)
  // - cancel === "false" (not cancelled)
  // - status === "PAID" (payment status is PAID)
  const isSuccess = code === "00" && cancel === "false" && status === "PAID";

  useEffect(() => {
    // Auto-redirect to transactions page after 5 seconds if successful
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate({ to: "/receptionist/transactions" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {isSuccess ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75" />
                    <CheckCircle className="relative h-20 w-20 text-green-500" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75" />
                    <XCircle className="relative h-20 w-20 text-red-500" />
                  </div>
                )}
              </div>
              <CardTitle
                className={cn(
                  "text-3xl font-bold",
                  isSuccess ? "text-green-600" : "text-red-600"
                )}
              >
                {isSuccess ? "Payment Successful" : "Payment Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p
                  className={cn(
                    "text-lg",
                    isSuccess ? "text-gray-700" : "text-gray-600"
                  )}
                >
                  {isSuccess
                    ? "Your transaction has been processed successfully."
                    : "Transaction could not be completed. Please try again."}
                </p>
              </div>

              {/* Payment Details */}
              <div className="border-t border-b py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Order Code:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {orderCode || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Transaction ID:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {id ? id.substring(0, 8) + "..." : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Response Code:
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      code === "00" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {code || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Status:
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      status === "PAID" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {status || "—"}
                  </span>
                </div>
                {cancel && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Cancelled:
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        cancel === "false" ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {cancel === "false" ? "No" : "Yes"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/receptionist/transactions" })}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Transactions
                </Button>
                {isSuccess && (
                  <Button
                    onClick={() => navigate({ to: "/receptionist/dashboard" })}
                  >
                    Go to Dashboard
                  </Button>
                )}
                {!isSuccess && (
                  <Button
                    variant="default"
                    onClick={() => {
                      // Navigate back to transactions to retry
                      navigate({ to: "/receptionist/transactions" });
                    }}
                  >
                    Try Again
                  </Button>
                )}
              </div>

              {isSuccess && (
                <p className="text-xs text-center text-gray-500">
                  You will be redirected automatically in 5 seconds...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
