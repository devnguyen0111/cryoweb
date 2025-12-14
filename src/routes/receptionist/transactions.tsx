import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios, { isAxiosError } from "axios";
import { Printer, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { AppointmentDetailForm } from "@/features/receptionist/appointments/AppointmentDetailForm";
import { api } from "@/api/client";
import type {
  TransactionStatus,
  TransactionType,
  ServiceRequest,
  ServiceRequestDetail,
  Service,
  Patient,
} from "@/api/types";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";

export const Route = createFileRoute("/receptionist/transactions")({
  component: ReceptionistTransactionsComponent,
});

function ReceptionistTransactionsComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "transactions"],
      }),
    ]);
    setIsRefreshing(false);
  };

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
  const [showServiceRequestInTransaction, setShowServiceRequestInTransaction] =
    useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState({
    patientId: "", // Used only for UI filtering, not sent to API
    relatedEntityType: "ServiceRequest" as
      | "ServiceRequest"
      | "CryoStorageContract",
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
  const {
    data: serviceRequestsData,
    isLoading: isLoadingServiceRequests,
    error: serviceRequestsError,
  } = useQuery({
    queryKey: [
      "receptionist",
      "service-requests",
      "for-transaction",
      { patientId: createFormData.patientId },
    ],
    queryFn: async () => {
      if (!createFormData.patientId) {
        return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
      }
      try {
        console.log(
          "Fetching service requests for patient:",
          createFormData.patientId
        );
        const response = await api.serviceRequest.getServiceRequests({
          patientId: createFormData.patientId,
          pageNumber: 1,
          pageSize: 50,
        });
        console.log("Service requests response:", response);
        console.log("Service requests data:", response.data);
        console.log("First request:", response.data?.[0]);
        return response;
      } catch (error) {
        console.error("Error fetching service requests:", error);
        throw error;
      }
    },
    enabled: Boolean(showCreateModal && createFormData.patientId),
  });

  // Query cryo storage contracts for selected patient
  const { data: cryoContractsData } = useQuery({
    queryKey: [
      "receptionist",
      "cryo-storage-contracts",
      { patientId: createFormData.patientId },
    ],
    queryFn: async () => {
      // TODO: Replace with actual API call when CryoStorageContract API module is available
      // For now, using direct axios call as API integration is pending
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "https://cryofert.runasp.net/api";
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `${API_BASE_URL}/CryoStorageContract`,
          {
            params: {
              patientId: createFormData.patientId,
              pageNumber: 1,
              pageSize: 50,
            },
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
              "Content-Type": "application/json",
            },
          }
        );
        return {
          data: response.data?.data || [],
          metaData: response.data?.metaData || { totalCount: 0, totalPages: 0 },
        };
      } catch {
        return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
      }
    },
    enabled: Boolean(
      showCreateModal &&
        createFormData.patientId &&
        createFormData.relatedEntityType === "CryoStorageContract"
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
        setPaymentUrl(
          response.data.paymentUrl || response.data.vnPayUrl || null
        );
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

  const handlePrintInvoice = () => {
    if (!transactionDetail?.data) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print invoice");
      return;
    }

    const transaction = transactionDetail.data;
    const invoiceDate = formatDate(
      transaction.transactionDate || transaction.createdAt
    );

    // Generate invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${transaction.transactionCode}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              color: #000;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .info-section {
              flex: 1;
            }
            .info-section h3 {
              margin-top: 0;
              font-size: 14px;
              text-transform: uppercase;
              color: #666;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-section p {
              margin: 5px 0;
              font-size: 14px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            .items-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .items-table td {
              font-size: 14px;
            }
            .total-section {
              text-align: right;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              margin: 5px 0;
            }
            .total-label {
              width: 150px;
              font-weight: bold;
              text-align: right;
              padding-right: 10px;
            }
            .total-value {
              width: 150px;
              text-align: right;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-completed {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-failed {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .status-cancelled {
              background-color: #f3f4f6;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>FSCMS - Fertility Services Clinic Management System</p>
          </div>

          <div class="invoice-info">
            <div class="info-section">
              <h3>Transaction Information</h3>
              <p><strong>Transaction Code:</strong> ${transaction.transactionCode || transaction.id}</p>
              <p><strong>Transaction ID:</strong> ${getLast4Chars(transaction.id)}</p>
              <p><strong>Date:</strong> ${invoiceDate}</p>
              <p><strong>Type:</strong> ${transaction.transactionType || "Payment"}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${transaction.status?.toLowerCase() || "pending"}">${transaction.status || "Pending"}</span></p>
              ${transaction.referenceNumber ? `<p><strong>Reference:</strong> ${transaction.referenceNumber}</p>` : ""}
            </div>

            <div class="info-section">
              <h3>Patient Information</h3>
              ${transaction.patientName ? `<p><strong>Name:</strong> ${transaction.patientName}</p>` : ""}
              ${transaction.patientId ? `<p><strong>Patient ID:</strong> ${getLast4Chars(transaction.patientId)}</p>` : ""}
              ${transaction.relatedEntityType ? `<p><strong>Related To:</strong> ${transaction.relatedEntityType}</p>` : ""}
              ${transaction.relatedEntityId ? `<p><strong>Entity ID:</strong> ${getLast4Chars(transaction.relatedEntityId)}</p>` : ""}
            </div>
          </div>

          <div class="info-section">
            <h3>Payment Information</h3>
            ${transaction.paymentMethod ? `<p><strong>Payment Method:</strong> ${transaction.paymentMethod}</p>` : ""}
            ${transaction.paymentGateway ? `<p><strong>Payment Gateway:</strong> ${transaction.paymentGateway}</p>` : ""}
            ${transaction.processedDate ? `<p><strong>Processed Date:</strong> ${formatDate(transaction.processedDate)}</p>` : ""}
            ${transaction.processedBy ? `<p><strong>Processed By:</strong> ${transaction.processedBy}</p>` : ""}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  ${transaction.description || "Payment transaction"}
                  ${transaction.notes ? `<br/><small style="color: #666;">${transaction.notes}</small>` : ""}
                </td>
                <td style="text-align: right; font-weight: bold;">
                  ${formatCurrency(transaction.amount)}
                  ${transaction.currency ? ` ${transaction.currency}` : " VND"}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <div class="total-label">Total Amount:</div>
              <div class="total-value">
                ${formatCurrency(transaction.amount)}
                ${transaction.currency ? ` ${transaction.currency}` : " VND"}
              </div>
            </div>
          </div>

          ${
            transaction.description || transaction.notes
              ? `
          <div class="info-section" style="margin-top: 30px;">
            <h3>Notes</h3>
            <p>${transaction.description || ""}</p>
            ${transaction.notes ? `<p>${transaction.notes}</p>` : ""}
          </div>
          `
              : ""
          }

          <div class="footer">
            <p>This is a computer-generated invoice. No signature required.</p>
            <p>Generated on ${new Date().toLocaleString("vi-VN")}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Query transaction detail
  const { data: transactionDetail } = useQuery({
    queryKey: ["receptionist", "transaction", selectedTransactionDetailId],
    queryFn: () =>
      api.transaction.getTransactionById(selectedTransactionDetailId!),
    enabled: Boolean(selectedTransactionDetailId),
  });

  // Get service request ID from transaction
  const serviceRequestId = useMemo(() => {
    if (!transactionDetail?.data) return null;
    return transactionDetail.data.relatedEntityType === "ServiceRequest"
      ? transactionDetail.data.relatedEntityId
      : transactionDetail.data.serviceRequestId || null;
  }, [transactionDetail?.data]);

  // Query service request detail when showing in transaction modal
  const { data: serviceRequest, isLoading: serviceRequestLoading } =
    useQuery<ServiceRequest | null>({
      enabled: Boolean(showServiceRequestInTransaction && serviceRequestId),
      queryKey: ["receptionist", "service-request", "detail", serviceRequestId],
      retry: false,
      queryFn: async () => {
        if (!serviceRequestId) return null;
        try {
          const response =
            await api.serviceRequest.getServiceRequestById(serviceRequestId);
          return response.data ?? null;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      },
    });

  // Query service request details
  const { data: requestDetails, isLoading: detailsLoading } = useQuery<
    ServiceRequestDetail[]
  >({
    enabled: Boolean(
      showServiceRequestInTransaction &&
        serviceRequestId &&
        !serviceRequest?.serviceDetails
    ),
    queryKey: ["receptionist", "service-request-details", serviceRequestId],
    retry: false,
    queryFn: async () => {
      if (!serviceRequestId) return [];
      try {
        const response =
          await api.serviceRequestDetails.getServiceRequestDetailsByServiceRequest(
            serviceRequestId
          );
        return response.data ?? [];
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

  const serviceDetails = serviceRequest?.serviceDetails ?? requestDetails ?? [];
  const serviceIds = serviceDetails
    .map((detail) => detail.serviceId)
    .filter((id): id is string => Boolean(id));

  const { data: services } = useQuery<Record<string, Service>>({
    enabled: showServiceRequestInTransaction && serviceIds.length > 0,
    queryKey: ["services", "by-ids", serviceIds],
    queryFn: async () => {
      const results: Record<string, Service> = {};
      await Promise.all(
        serviceIds.map(async (id) => {
          try {
            const response = await api.service.getServiceById(id);
            if (response.data) {
              results[id] = response.data;
            }
          } catch (error) {
            // Ignore errors for individual services
          }
        })
      );
      return results;
    },
  });

  // Get patient from service request
  const serviceRequestPatientId = useMemo(() => {
    return serviceRequest?.patientId ?? null;
  }, [serviceRequest?.patientId]);

  const { data: serviceRequestPatient } = useQuery<Patient | null>({
    enabled:
      showServiceRequestInTransaction && Boolean(serviceRequestPatientId),
    queryKey: ["patient", serviceRequestPatientId],
    retry: false,
    queryFn: async () => {
      if (!serviceRequestPatientId) return null;
      try {
        const response = await api.patient.getPatientById(
          serviceRequestPatientId
        );
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const totalAmount =
    serviceRequest?.totalAmount ??
    serviceDetails.reduce(
      (sum, detail) =>
        sum +
        (detail.totalPrice ??
          (detail.unitPrice ?? detail.price ?? 0) * (detail.quantity ?? 0)),
      0
    );

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
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
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
                                    onClick={() =>
                                      handleViewDetails(transaction.id)
                                    }
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
                      Transaction ID: {getLast4Chars(selectedTransactionId)}
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
            setShowServiceRequestInTransaction(false);
          }}
          title={
            showServiceRequestInTransaction
              ? "Service Request Details"
              : "Transaction Details"
          }
          description={
            showServiceRequestInTransaction
              ? "View detailed information about the service request"
              : "View complete transaction information"
          }
          size="xl"
        >
          {showServiceRequestInTransaction && serviceRequestId ? (
            // Service Request Detail View
            serviceRequestLoading || detailsLoading ? (
              <div className="py-12 text-center text-gray-500">
                Loading service request details...
              </div>
            ) : !serviceRequest ? (
              <div className="space-y-4 py-6 text-center text-sm text-red-600">
                <p>Service request not found.</p>
                <Button
                  variant="outline"
                  onClick={() => setShowServiceRequestInTransaction(false)}
                >
                  Back to Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowServiceRequestInTransaction(false)}
                  >
                    ← Back to Transaction
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Request Information
                      </CardTitle>
                      <Badge
                        variant={
                          serviceRequest.status === "Approved"
                            ? "default"
                            : serviceRequest.status === "Rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {serviceRequest.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Request Code
                        </label>
                        <p className="text-sm text-gray-900">
                          {serviceRequest.requestCode}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status
                        </label>
                        <p className="text-sm text-gray-900">
                          {serviceRequest.status}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Requested Date
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatDate(
                            serviceRequest.requestDate ??
                              serviceRequest.requestedDate
                          )}
                        </p>
                      </div>
                      {serviceRequest.approvedDate && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Approved Date
                          </label>
                          <p className="text-sm text-gray-900">
                            {formatDate(serviceRequest.approvedDate)}
                          </p>
                        </div>
                      )}
                      {serviceRequest.approvedBy && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Approved By
                          </label>
                          <p className="text-sm text-gray-900">
                            {serviceRequest.approvedBy}
                          </p>
                        </div>
                      )}
                    </div>
                    {serviceRequest.notes && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Notes
                        </label>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {serviceRequest.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {serviceRequestPatient && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Patient Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Name
                          </label>
                          <p className="text-sm text-gray-900">
                            {serviceRequestPatient.fullName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Patient Code
                          </label>
                          <p className="text-sm text-gray-900">
                            {serviceRequestPatient.patientCode}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Phone
                          </label>
                          <p className="text-sm text-gray-900">
                            {serviceRequestPatient.phoneNumber}
                          </p>
                        </div>
                        {serviceRequestPatient.email && (
                          <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Email
                            </label>
                            <p className="text-sm text-gray-900">
                              {serviceRequestPatient.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Service Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {serviceDetails && serviceDetails.length > 0 ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                  Service
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                  Quantity
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                  Unit Price
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {serviceDetails.map((detail) => {
                                const service =
                                  services?.[detail.serviceId ?? ""];
                                const unitPrice =
                                  detail.unitPrice ?? detail.price ?? 0;
                                const total =
                                  detail.totalPrice ??
                                  unitPrice * (detail.quantity ?? 0);
                                return (
                                  <tr key={detail.id} className="border-b">
                                    <td className="px-4 py-2 text-sm">
                                      {detail.serviceName ??
                                        service?.name ??
                                        service?.serviceName ??
                                        "—"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {detail.quantity ?? 0}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {formatCurrency(unitPrice)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {formatCurrency(total)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end border-t pt-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-500">
                              Total Amount
                            </p>
                            <p className="mt-1 text-lg font-bold">
                              {formatCurrency(totalAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No service details found
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowServiceRequestInTransaction(false);
                    }}
                  >
                    Back to Transaction
                  </Button>
                </div>
              </div>
            )
          ) : transactionDetail?.data ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Transaction Information
                  </CardTitle>
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
                        {getLast4Chars(transactionDetail.data.id)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Type
                      </label>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          getTypeBadgeClass(
                            transactionDetail.data.transactionType
                          )
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
                    <CardTitle className="text-lg">
                      Patient Information
                    </CardTitle>
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
                              {getLast4Chars(transactionDetail.data.patientId)}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTransactionDetailId(null);
                                navigate({
                                  to: "/receptionist/patients/$patientId",
                                  params: {
                                    patientId:
                                      transactionDetail.data!.patientId!,
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
                              {getLast4Chars(
                                transactionDetail.data.relatedEntityId
                              )}
                            </p>
                            {transactionDetail.data.relatedEntityType ===
                              "ServiceRequest" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setShowServiceRequestInTransaction(true);
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
                    <CardTitle className="text-lg">
                      Additional Information
                    </CardTitle>
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

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedTransactionDetailId(null)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
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
                      | "CryoStorageContract",
                    relatedEntityId: "", // Reset when type changes
                  }));
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ServiceRequest">Service Request</option>
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
                      : isLoadingServiceRequests
                        ? "Loading service requests..."
                        : serviceRequestsError
                          ? "Error loading service requests"
                          : serviceRequestsData?.data?.length
                            ? "Select a service request"
                            : "No service requests found"}
                  </option>
                  {serviceRequestsData?.data &&
                    Array.isArray(serviceRequestsData.data) &&
                    serviceRequestsData.data.length > 0 && (
                      <>
                        {serviceRequestsData.data.map((request) => (
                          <option key={request.id} value={request.id}>
                            {request.requestCode || getLast4Chars(request.id)} -{" "}
                            {request.status || "Pending"}
                          </option>
                        ))}
                      </>
                    )}
                </select>
              </div>
            )}

            {createFormData.relatedEntityType === "CryoStorageContract" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Cryo Storage Contract <span className="text-red-500">*</span>
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
                      : cryoContractsData?.data?.length
                        ? "Select a cryo storage contract"
                        : "No cryo storage contracts found"}
                  </option>
                  {cryoContractsData?.data?.map((contract: any) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contractNumber || contract.id.slice(0, 8)} -{" "}
                      {contract.status || "Active"}
                    </option>
                  ))}
                </select>
                {cryoContractsData?.data?.length === 0 &&
                  createFormData.patientId && (
                    <p className="text-xs text-gray-500">
                      No cryo storage contracts found for this patient. You may
                      need to enter the contract ID manually.
                    </p>
                  )}
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

        {/* Payment URL Modal for Created Transaction */}
        <Modal
          isOpen={showQRCode && Boolean(createdTransactionId)}
          onClose={() => {
            setShowQRCode(false);
            setPaymentUrl(null);
            setCreatedTransactionId(null);
          }}
          title="Payment Transaction Created"
          description="Click the link below to complete payment"
          size="md"
        >
          <div className="space-y-4">
            {paymentUrl ? (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Click the button below to open the payment page and complete
                    the transaction.
                  </p>
                  {createdTransactionId && (
                    <p className="mt-2 text-xs text-gray-500">
                      Transaction ID: {getLast4Chars(createdTransactionId)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      window.open(paymentUrl, "_blank");
                    }}
                  >
                    Open Payment Page
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        navigate({ to: "/receptionist/transactions" })
                      }
                    >
                      View All Transactions
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowQRCode(false);
                        setPaymentUrl(null);
                        setCreatedTransactionId(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Unable to get payment URL. Please try again.
              </div>
            )}
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
