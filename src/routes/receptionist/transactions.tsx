import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { AppointmentDetailForm } from "@/features/receptionist/appointments/AppointmentDetailForm";
import { api } from "@/api/client";
import type { TransactionStatus, TransactionType } from "@/api/types";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/receptionist/transactions")({
  component: ReceptionistTransactionsComponent,
});

function ReceptionistTransactionsComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransactionDetailId, setSelectedTransactionDetailId] =
    useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState({
    patientId: "", // Used only for UI filtering, not sent to API
    relatedEntityType: "ServiceRequest" as "ServiceRequest" | "Appointment" | "CryoStorageContract",
    relatedEntityId: "",
  });

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      transactionType: typeFilter || undefined,
      // New API format
      fromDate: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      toDate: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : undefined,
      // Legacy format for backward compatibility
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [statusFilter, typeFilter, dateFrom, dateTo]
  );

  const { data, isFetching } = useQuery({
    queryKey: [
      "receptionist",
      "transactions",
      {
        page,
        pageSize,
        ...filters,
      },
    ],
    queryFn: () =>
      api.transaction.getTransactions({
        page: page,
        size: pageSize,
        pageNumber: page, // Backward compatibility
        pageSize: pageSize, // Backward compatibility
        ...filters,
      }),
  });

  const transactions = data?.data ?? [];
  const total = data?.metaData?.totalCount ?? 0;
  const totalPages = data?.metaData?.totalPages ?? 1;

  const getStatusBadgeClass = (status?: TransactionStatus) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "Completed":
        return "bg-emerald-100 text-emerald-700";
      case "Failed":
        return "bg-rose-100 text-rose-700";
      case "Cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getTypeBadgeClass = (type?: TransactionType) => {
    switch (type) {
      case "Payment":
        return "bg-blue-100 text-blue-700";
      case "Refund":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const resetFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const getQRCodeMutation = useMutation({
    mutationFn: (transactionId: string) =>
      api.transaction.getTransactionQR(transactionId),
    onSuccess: (response) => {
      setQrCodeData(response.data?.qrCodeData || null);
      setQrCodeUrl(response.data?.qrCodeUrl || null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to generate QR code. Please try again."
      );
    },
  });

  // Query patients for create transaction form
  const { data: patientsData } = useQuery({
    queryKey: ["receptionist", "patients", "for-transaction"],
    queryFn: () =>
      api.patient.getPatients({
        Page: 1,
        Size: 100,
        pageNumber: 1,
        pageSize: 100,
      } as any),
    enabled: showCreateModal,
  });

  // Query service requests for selected patient
  const { data: serviceRequestsData } = useQuery({
    queryKey: [
      "receptionist",
      "service-requests",
      { patientId: createFormData.patientId },
    ],
    queryFn: () =>
      api.serviceRequest.getServiceRequests({
        patientId: createFormData.patientId,
        pageNumber: 1,
        pageSize: 50,
      }),
    enabled: Boolean(
      showCreateModal &&
        createFormData.patientId &&
        createFormData.relatedEntityType === "ServiceRequest"
    ),
  });

  // Query appointments for selected patient
  const { data: appointmentsData } = useQuery({
    queryKey: [
      "receptionist",
      "appointments",
      { patientId: createFormData.patientId },
    ],
    queryFn: () =>
      api.appointment.getAppointments({
        patientId: createFormData.patientId,
        pageNumber: 1,
        pageSize: 50,
      }),
    enabled: Boolean(
      showCreateModal &&
        createFormData.patientId &&
        createFormData.relatedEntityType === "Appointment"
    ),
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: () =>
      api.transaction.createPaymentQR({
        relatedEntityType: createFormData.relatedEntityType,
        relatedEntityId: createFormData.relatedEntityId,
      }),
    onSuccess: (response) => {
      if (response.data) {
        setQrCodeUrl(response.data.paymentUrl || null);
        setCreatedTransactionId(response.data.id);
        setShowCreateModal(false);
        setShowQRCode(true);
        toast.success("Transaction created successfully");
        queryClient.invalidateQueries({
          queryKey: ["receptionist", "transactions"],
        });
        // Reset form
        setCreateFormData({
          patientId: "",
          relatedEntityType: "ServiceRequest",
          relatedEntityId: "",
        });
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create transaction. Please try again."
      );
    },
  });

  const [createdTransactionId, setCreatedTransactionId] = useState<
    string | null
  >(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const handleViewQRCode = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    getQRCodeMutation.mutate(transactionId);
  };

  const handleViewDetails = (transactionId: string) => {
    setSelectedTransactionDetailId(transactionId);
  };

  // Query transaction detail
  const { data: transactionDetail } = useQuery({
    queryKey: ["receptionist", "transaction", selectedTransactionDetailId],
    queryFn: () =>
      api.transaction.getTransactionById(selectedTransactionDetailId!),
    enabled: Boolean(selectedTransactionDetailId),
  });

  const statusOptions: { value: TransactionStatus | ""; label: string }[] = [
    { value: "", label: "All statuses" },
    { value: "Pending", label: "Pending" },
    { value: "Completed", label: "Completed" },
    { value: "Failed", label: "Failed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const typeOptions: { value: TransactionType | ""; label: string }[] = [
    { value: "", label: "All types" },
    { value: "Payment", label: "Payment" },
    { value: "Refund", label: "Refund" },
  ];

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Transactions</h1>
              <p className="text-gray-600 mt-1">
                View and manage payment transactions
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setShowCreateModal(true)}
              >
                Create Transaction
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Dashboard
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Results: {total} transactions · Page {page}/{totalPages}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(
                        event.target.value as TransactionStatus | ""
                      );
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(event) => {
                      setTypeFilter(event.target.value as TransactionType | "");
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    From date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    To date
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isFetching ? (
                <div className="py-12 text-center text-gray-500">
                  Loading transactions...
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left text-gray-600">
                            <th className="px-4 py-3 font-medium">
                              Transaction Code
                            </th>
                            <th className="px-4 py-3 font-medium">Amount</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {transactions.map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {transaction.transactionCode ||
                                    transaction.id.slice(0, 8)}
                                </div>
                                {transaction.description && (
                                  <div className="text-xs text-gray-500">
                                    {transaction.description}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-900">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                    getTypeBadgeClass(
                                      transaction.transactionType
                                    )
                                  )}
                                >
                                  {transaction.transactionType || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                    getStatusBadgeClass(transaction.status)
                                  )}
                                >
                                  {transaction.status || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {formatDate(
                                  transaction.transactionDate ||
                                    transaction.createdAt
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewDetails(transaction.id)}
                                  >
                                    View Details
                                  </Button>
                                  {transaction.transactionType === "Payment" &&
                                    (transaction.paymentUrl ||
                                      transaction.vnPayUrl) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleViewQRCode(transaction.id)
                                        }
                                        disabled={getQRCodeMutation.isPending}
                                      >
                                        View QR Code
                                      </Button>
                                    )}
                                  {transaction.relatedEntityType ===
                                    "ServiceRequest" &&
                                    transaction.relatedEntityId && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          navigate({
                                            to: "/receptionist/service-requests/$serviceRequestId",
                                            params: {
                                              serviceRequestId:
                                                transaction.relatedEntityId!,
                                            },
                                          })
                                        }
                                      >
                                        View Request
                                      </Button>
                                    )}
                                  {transaction.relatedEntityType ===
                                    "Appointment" &&
                                    transaction.relatedEntityId && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setSelectedAppointmentId(
                                            transaction.relatedEntityId!
                                          )
                                        }
                                      >
                                        View Appointment
                                      </Button>
                                    )}
                                  {/* Backward compatibility */}
                                  {transaction.serviceRequestId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        navigate({
                                          to: "/receptionist/service-requests/$serviceRequestId",
                                          params: {
                                            serviceRequestId:
                                              transaction.serviceRequestId!,
                                          },
                                        })
                                      }
                                    >
                                      View Request
                                    </Button>
                                  )}
                                  {transaction.appointmentId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setSelectedAppointmentId(
                                          transaction.appointmentId!
                                        )
                                      }
                                    >
                                      View Appointment
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      No transactions match the current filters.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="flex items-center justify-between px-6 pb-6">
              <div className="text-sm text-gray-500">
                Showing {transactions.length} / {total} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* QR Code Modal */}
        <Modal
          isOpen={Boolean(selectedTransactionId)}
          onClose={() => {
            setSelectedTransactionId(null);
            setQrCodeData(null);
            setQrCodeUrl(null);
          }}
          title="Payment QR Code"
          description="Scan this QR code to complete payment"
          size="md"
        >
          <div className="space-y-4">
            {getQRCodeMutation.isPending ? (
              <div className="py-12 text-center text-gray-500">
                Generating QR code...
              </div>
            ) : qrCodeUrl || qrCodeData ? (
              <div className="space-y-4">
                {qrCodeUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR Code"
                      className="max-w-full h-auto border border-gray-200 rounded-lg"
                    />
                  </div>
                ) : qrCodeData ? (
                  <div className="flex justify-center">
                    <div
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: qrCodeData }}
                    />
                  </div>
                ) : null}
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Scan this QR code with your payment app to complete the
                    transaction.
                  </p>
                  {selectedTransactionId && (
                    <p className="mt-2 text-xs">
                      Transaction ID: {selectedTransactionId.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Unable to generate QR code. Please try again.
              </div>
            )}
          </div>
        </Modal>

        {/* Appointment Detail Modal */}
        <Modal
          isOpen={Boolean(selectedAppointmentId)}
          onClose={() => {
            setSelectedAppointmentId(null);
          }}
          title="Appointment Details"
          description="View and manage appointment details"
          size="xl"
        >
          {selectedAppointmentId ? (
            <AppointmentDetailForm
              appointmentId={selectedAppointmentId}
              layout="modal"
              onClose={() => {
                setSelectedAppointmentId(null);
              }}
              onOpenPatientProfile={(patientId) => {
                navigate({
                  to: "/receptionist/patients/$patientId",
                  params: { patientId },
                });
              }}
            />
          ) : null}
        </Modal>

        {/* Transaction Detail Modal */}
        <Modal
          isOpen={Boolean(selectedTransactionDetailId)}
          onClose={() => {
            setSelectedTransactionDetailId(null);
          }}
          title="Transaction Details"
          description="View complete transaction information"
          size="lg"
        >
          {transactionDetail?.data ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Transaction Code
                      </label>
                      <p className="text-sm font-mono text-gray-900">
                        {transactionDetail.data.transactionCode ||
                          transactionDetail.data.id}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Transaction ID
                      </label>
                      <p className="text-sm font-mono text-gray-900">
                        {transactionDetail.data.id}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Type
                      </label>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          getTypeBadgeClass(transactionDetail.data.transactionType)
                        )}
                      >
                        {transactionDetail.data.transactionType || "—"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </label>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          getStatusBadgeClass(transactionDetail.data.status)
                        )}
                      >
                        {transactionDetail.data.status || "—"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Amount
                      </label>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(transactionDetail.data.amount)}
                        {transactionDetail.data.currency && (
                          <span className="ml-1 text-xs text-gray-500">
                            {transactionDetail.data.currency}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Transaction Date
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatDate(
                          transactionDetail.data.transactionDate ||
                            transactionDetail.data.createdAt
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {transactionDetail.data.paymentMethod && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Payment Method
                        </label>
                        <p className="text-sm text-gray-900">
                          {transactionDetail.data.paymentMethod}
                        </p>
                      </div>
                    )}
                    {transactionDetail.data.paymentGateway && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Payment Gateway
                        </label>
                        <p className="text-sm text-gray-900">
                          {transactionDetail.data.paymentGateway}
                        </p>
                      </div>
                    )}
                    {transactionDetail.data.referenceNumber && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Reference Number
                        </label>
                        <p className="text-sm font-mono text-gray-900">
                          {transactionDetail.data.referenceNumber}
                        </p>
                      </div>
                    )}
                    {transactionDetail.data.processedDate && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Processed Date
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatDate(transactionDetail.data.processedDate)}
                        </p>
                      </div>
                    )}
                    {transactionDetail.data.processedBy && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Processed By
                        </label>
                        <p className="text-sm text-gray-900">
                          {transactionDetail.data.processedBy}
                        </p>
                      </div>
                    )}
                  </div>
                  {transactionDetail.data.paymentUrl && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTransactionDetailId(null);
                          handleViewQRCode(transactionDetail.data!.id);
                        }}
                      >
                        View Payment QR Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Patient Information */}
              {(transactionDetail.data.patientId ||
                transactionDetail.data.patientName) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {transactionDetail.data.patientName && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Patient Name
                          </label>
                          <p className="text-sm text-gray-900">
                            {transactionDetail.data.patientName}
                          </p>
                        </div>
                      )}
                      {transactionDetail.data.patientId && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Patient ID
                          </label>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-gray-900">
                              {transactionDetail.data.patientId}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTransactionDetailId(null);
                                navigate({
                                  to: "/receptionist/patients/$patientId",
                                  params: {
                                    patientId: transactionDetail.data!.patientId!,
                                  },
                                });
                              }}
                            >
                              View Patient
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Entity Information */}
              {(transactionDetail.data.relatedEntityType ||
                transactionDetail.data.relatedEntityId) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Entity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {transactionDetail.data.relatedEntityType && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Entity Type
                          </label>
                          <p className="text-sm text-gray-900">
                            {transactionDetail.data.relatedEntityType}
                          </p>
                        </div>
                      )}
                      {transactionDetail.data.relatedEntityId && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Entity ID
                          </label>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-gray-900">
                              {transactionDetail.data.relatedEntityId}
                            </p>
                            {transactionDetail.data.relatedEntityType ===
                              "ServiceRequest" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTransactionDetailId(null);
                                  navigate({
                                    to: "/receptionist/service-requests/$serviceRequestId",
                                    params: {
                                      serviceRequestId:
                                        transactionDetail.data!.relatedEntityId!,
                                    },
                                  });
                                }}
                              >
                                View Request
                              </Button>
                            )}
                            {transactionDetail.data.relatedEntityType ===
                              "Appointment" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTransactionDetailId(null);
                                  setSelectedAppointmentId(
                                    transactionDetail.data!.relatedEntityId!
                                  );
                                }}
                              >
                                View Appointment
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              {(transactionDetail.data.description ||
                transactionDetail.data.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {transactionDetail.data.description && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Description
                        </label>
                        <p className="text-sm text-gray-900">
                          {transactionDetail.data.description}
                        </p>
                      </div>
                    )}
                    {transactionDetail.data.notes && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Notes
                        </label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {transactionDetail.data.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timestamps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {transactionDetail.data.createdAt && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Created At
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatDate(transactionDetail.data.createdAt)}
                        </p>
                      </div>
                    )}
                    {transactionDetail.data.updatedAt && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Updated At
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatDate(transactionDetail.data.updatedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedTransactionDetailId(null)}
                >
                  Close
                </Button>
                {transactionDetail.data.paymentUrl && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelectedTransactionDetailId(null);
                      handleViewQRCode(transactionDetail.data!.id);
                    }}
                  >
                    View QR Code
                  </Button>
                )}
              </div>
            </div>
          ) : selectedTransactionDetailId ? (
            <div className="py-12 text-center text-gray-500">
              Loading transaction details...
            </div>
          ) : null}
        </Modal>

        {/* Create Transaction Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateFormData({
              patientId: "",
              relatedEntityType: "ServiceRequest",
              relatedEntityId: "",
            });
          }}
          title="Create Payment Transaction"
          description="Create a new payment transaction for a patient"
          size="md"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Patient <span className="text-red-500">*</span>
              </label>
              <select
                value={createFormData.patientId}
                onChange={(e) => {
                  setCreateFormData((prev) => ({
                    ...prev,
                    patientId: e.target.value,
                    relatedEntityId: "", // Reset when patient changes
                  }));
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a patient</option>
                {patientsData?.data?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName || patient.patientCode || patient.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Entity Type <span className="text-red-500">*</span>
              </label>
              <select
                value={createFormData.relatedEntityType}
                onChange={(e) => {
                  setCreateFormData((prev) => ({
                    ...prev,
                    relatedEntityType: e.target.value as
                      | "ServiceRequest"
                      | "Appointment"
                      | "CryoStorageContract",
                    relatedEntityId: "", // Reset when type changes
                  }));
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ServiceRequest">Service Request</option>
                <option value="Appointment">Appointment</option>
                <option value="CryoStorageContract">
                  Cryo Storage Contract
                </option>
              </select>
            </div>

            {createFormData.relatedEntityType === "ServiceRequest" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Service Request <span className="text-red-500">*</span>
                </label>
                <select
                  value={createFormData.relatedEntityId}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      relatedEntityId: e.target.value,
                    }))
                  }
                  disabled={!createFormData.patientId}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!createFormData.patientId
                      ? "Please select a patient first"
                      : serviceRequestsData?.data?.length
                        ? "Select a service request"
                        : "No service requests found"}
                  </option>
                  {serviceRequestsData?.data?.map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.requestCode || request.id.slice(0, 8)} -{" "}
                      {request.status || "Pending"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {createFormData.relatedEntityType === "Appointment" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Appointment <span className="text-red-500">*</span>
                </label>
                <select
                  value={createFormData.relatedEntityId}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      relatedEntityId: e.target.value,
                    }))
                  }
                  disabled={!createFormData.patientId}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!createFormData.patientId
                      ? "Please select a patient first"
                      : appointmentsData?.data?.length
                        ? "Select an appointment"
                        : "No appointments found"}
                  </option>
                  {appointmentsData?.data?.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.appointmentDate
                        ? new Date(appointment.appointmentDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "No date"}{" "}
                      - {appointment.status || "Pending"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {createFormData.relatedEntityType === "CryoStorageContract" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Cryo Storage Contract <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={createFormData.relatedEntityId}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      relatedEntityId: e.target.value,
                    }))
                  }
                  placeholder="Enter contract ID (UUID)"
                  disabled={!createFormData.patientId}
                  className="disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">
                  Note: CryoStorageContract API integration pending. Please
                  enter the contract ID manually.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => createTransactionMutation.mutate()}
                disabled={
                  !createFormData.patientId ||
                  !createFormData.relatedEntityId ||
                  createTransactionMutation.isPending
                }
                className="flex-1"
              >
                {createTransactionMutation.isPending
                  ? "Creating..."
                  : "Create Transaction"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({
                    patientId: "",
                    relatedEntityType: "ServiceRequest",
                    relatedEntityId: "",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* QR Code Modal for Created Transaction */}
        <Modal
          isOpen={showQRCode && Boolean(createdTransactionId)}
          onClose={() => {
            setShowQRCode(false);
            setQrCodeUrl(null);
            setCreatedTransactionId(null);
          }}
          title="Payment QR Code"
          description="Scan this QR code to complete payment"
          size="md"
        >
          <div className="space-y-4">
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    className="max-w-full h-auto border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Scan this QR code with your payment app to complete the
                    transaction.
                  </p>
                  {createdTransactionId && (
                    <p className="mt-2 text-xs">
                      Transaction ID: {createdTransactionId.slice(0, 8)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate({ to: "/receptionist/transactions" })}
                  >
                    View All Transactions
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowQRCode(false);
                      setQrCodeUrl(null);
                      setCreatedTransactionId(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Unable to generate QR code. Please try again.
              </div>
            )}
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
