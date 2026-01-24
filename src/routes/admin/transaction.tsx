import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { api } from "@/api/client";

/* ================= ROUTE ================= */

export const Route = createFileRoute("/admin/transaction")({
  component: AdminTransactionsPage,
});

/* ================= TYPES ================= */

type ModalMode = "none" | "view";
type TxStatusFilter = "all" | "Completed" | "Pending" | "Cancelled";

/* ================= HELPERS ================= */

const safeText = (v: any) => (v === null || v === undefined || v === "" ? "-" : String(v));

const formatMoney = (amount: any, currency?: string) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return safeText(amount);
  return `${Math.round(n).toLocaleString()} ${currency ?? ""}`.trim();
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

/**
 * StatusBadge props thường chỉ nhận union kiểu "active" | "inactive" | "pending"
 * Nên mình map Transaction status (Completed/Pending/Cancelled/others) sang 3 loại này.
 */
const mapTransactionStatusToBadge = (
  status?: string,
): "active" | "pending" | "inactive" => {
  switch (String(status)) {
    case "Completed":
      return "active";
    case "Pending":
      return "pending";
    default:
      return "inactive";
  }
};

/* ================= COMPONENT ================= */

function AdminTransactionsPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TxStatusFilter>("all");

  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const openView = (tx: any) => {
    toast.info("Loading transaction details");
    setSelectedTx(tx);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode("none");
    setSelectedTx(null);
  };

  /* ================= QUERY ================= */

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.transaction.getTransactions(),
  });

  // API trả về: { code, message, metaData, data: Transaction[] }
  const transactions = (data?.data ?? []) as any[];

  /* ================= FILTER ================= */

  const filteredTransactions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return transactions.filter((tx) => {
      const haystack = [
        tx?.transactionCode,
        tx?.referenceNumber,
        tx?.patientName,
        tx?.patientId,
        tx?.relatedEntityType,
        tx?.relatedEntityId,
        tx?.paymentMethod,
        tx?.paymentGateway,
        tx?.status,
      ]
        .map((x) => (x ?? "").toString().toLowerCase())
        .join(" ");

      const matchesSearch = !q || haystack.includes(q);

      const matchesStatus =
        statusFilter === "all" || String(tx?.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  /* ================= RENDER ================= */

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Transaction Viewer"
            description="Monitor payment transactions and transaction history."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Transactions" },
            ]}
          />

          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by transaction code, patient, patientId, reference, entity type"
            filters={
              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TxStatusFilter)}
                >
                  <option value="all">All status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <Button
                  variant="outline"
                  disabled={isFetching}
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["transactions"],
                    })
                  }
                >
                  Refresh
                </Button>
              </div>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction list</CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading transactions…
                </div>
              ) : filteredTransactions.length === 0 ? (
                <EmptyState
                  title="No transactions found"
                  description="Try adjusting your filters."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left">Transaction</th>
                        <th className="p-3 text-left">Patient</th>
                        <th className="p-3 text-left">Entity</th>
                        <th className="p-3 text-left">Amount</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Transaction date</th>
                        <th className="p-3 text-left">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div className="font-medium">
                              {safeText(tx.transactionCode)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Ref: {safeText(tx.referenceNumber)}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-medium">
                              {safeText(tx.patientName)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {safeText(tx.patientId)}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-medium">
                              {safeText(tx.relatedEntityType)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {safeText(tx.relatedEntityId)}
                            </div>
                          </td>

                          <td className="p-3">
                            {formatMoney(tx.amount, tx.currency)}
                          </td>

                          <td className="p-3">
                            <StatusBadge
                              status={mapTransactionStatusToBadge(tx.status)}
                              label={safeText(tx.status)}
                            />
                          </td>

                          <td className="p-3">
                            {formatDateTime(tx.transactionDate)}
                          </td>

                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openView(tx)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* VIEW MODAL */}
        {modalMode === "view" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-lg">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">Transaction details</div>
                  <div className="text-sm text-muted-foreground">Read-only information</div>
                </div>

                <Button variant="ghost" size="sm" onClick={closeModal}>
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-3 text-sm">
                  <div className="col-span-6 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Transaction code</div>
                    <div className="font-medium">{safeText(selectedTx?.transactionCode)}</div>
                  </div>

                  <div className="col-span-6 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Reference number</div>
                    <div className="font-medium">{safeText(selectedTx?.referenceNumber)}</div>
                  </div>

                  <div className="col-span-6 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Patient</div>
                    <div className="font-medium">{safeText(selectedTx?.patientName)}</div>
                    <div className="text-xs text-muted-foreground">{safeText(selectedTx?.patientId)}</div>
                  </div>

                  <div className="col-span-6 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="mt-1">
                      <StatusBadge
                        status={mapTransactionStatusToBadge(selectedTx?.status)}
                        label={safeText(selectedTx?.status)}
                      />
                    </div>
                  </div>

                  <div className="col-span-6 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="font-medium">
                      {formatMoney(selectedTx?.amount, selectedTx?.currency)}
                    </div>
                  </div>

                  <div className="col-span-6 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Transaction date</div>
                    <div className="font-medium">{formatDateTime(selectedTx?.transactionDate)}</div>
                  </div>

                  <div className="col-span-6 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Payment method</div>
                    <div className="font-medium">{safeText(selectedTx?.paymentMethod)}</div>
                    <div className="text-xs text-muted-foreground">
                      Gateway: {safeText(selectedTx?.paymentGateway)}
                    </div>
                  </div>

                  <div className="col-span-6 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Processed</div>
                    <div className="font-medium">{formatDateTime(selectedTx?.processedDate)}</div>
                    <div className="text-xs text-muted-foreground">
                      By: {safeText(selectedTx?.processedBy)}
                    </div>
                  </div>

                  <div className="col-span-12 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Related entity</div>
                    <div className="font-medium">
                      {safeText(selectedTx?.relatedEntityType)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {safeText(selectedTx?.relatedEntityId)}
                    </div>
                  </div>

                  <div className="col-span-12 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Description</div>
                    <div className="text-sm">{safeText(selectedTx?.description)}</div>
                  </div>

                  <div className="col-span-12 rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Notes</div>
                    <div className="text-sm">{safeText(selectedTx?.notes)}</div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={closeModal}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
