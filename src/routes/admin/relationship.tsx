import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { api } from "@/api/client";
import { toast } from "sonner";

import type { RelationshipType } from "@/api/types";

export const Route = createFileRoute("/admin/relationship")({
  component: AdminRelationshipPage,
});

type ModalMode = "none" | "view" | "create" | "edit" | "delete";

/**
 * Cố gắng lấy axios client từ `api` mà không phá cấu trúc dự án của bạn.
 * Nếu dự án bạn export axios instance là `api` -> dùng được luôn.
 * Nếu dự án bạn có `api.client` -> dùng `api.client`.
 */
function getHttpClient(): any {
  const anyApi = api as any;
  return anyApi?.client ?? anyApi;
}

/**
 * LIST ALL: GET /api/relationship  -> trong client sẽ là GET /relationship
 * Dạng response có thể là BaseResponse, DynamicResponse, hoặc array thẳng.
 * Mình normalize cho chắc.
 */
async function listAllRelationships(): Promise<any[]> {
  const client = getHttpClient();
  const res = await client.get("/relationship");
  const payload = res?.data;

  // normalize các kiểu thường gặp
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;

  return [];
}

function AdminRelationshipPage() {
  const queryClient = useQueryClient();

  // Search hiển thị trong ListToolbar (lọc local)
  const [searchTerm, setSearchTerm] = useState("");

  // PatientId filter (để gọi endpoint /relationship/patient/{patientId} nếu cần)
  const [patientIdFilter, setPatientIdFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );

  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedRelationship, setSelectedRelationship] = useState<any>(null);

  /**
   * Form tối thiểu, không nhét fromUserId/toUserId nữa vì model của bạn không có.
   * Bạn map field theo backend bằng 2 input "Payload JSON" là xong.
   */
  const [formData, setFormData] = useState<{
    relationshipType?: RelationshipType;
    note: string;
    isActive: boolean;
    payloadJson: string; // cho bạn paste payload đúng field backend
  }>({
    relationshipType: undefined,
    note: "",
    isActive: true,
    payloadJson: "",
  });

  const closeModal = () => {
    setModalMode("none");
    setSelectedRelationship(null);
  };

  const openCreate = () => {
    toast.info("Opening relationship creation form");
    setSelectedRelationship(null);
    setFormData({
      relationshipType: undefined,
      note: "",
      isActive: true,
      payloadJson: "",
    });
    setModalMode("create");
  };

  const openView = (item: any) => {
    toast.info("Loading relationship details");
    setSelectedRelationship(item);
    setFormData({
      relationshipType: item?.relationshipType as RelationshipType | undefined,
      note: item?.note ?? "",
      isActive: Boolean(item?.isActive),
      payloadJson: JSON.stringify(item ?? {}, null, 2),
    });
    setModalMode("view");
  };

  const openEdit = (item: any) => {
    toast.info("Loading relationship for editing");
    setSelectedRelationship(item);
    setFormData({
      relationshipType: item?.relationshipType as RelationshipType | undefined,
      note: item?.note ?? "",
      isActive: Boolean(item?.isActive),
      payloadJson: JSON.stringify(item ?? {}, null, 2),
    });
    setModalMode("edit");
  };

  const openDelete = (item: any) => {
    toast.info("Preparing to delete relationship");
    setSelectedRelationship(item);
    setModalMode("delete");
  };

  /**
   * Query:
   * - Nếu có patientIdFilter -> dùng api.relationship.getRelationships(patientId)
   * - Nếu không -> GET /relationship (list all)
   */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["relationships", { patientIdFilter }],
    queryFn: async () => {
      if (patientIdFilter.trim()) {
        const res = await api.relationship.getRelationships(patientIdFilter.trim());
        return (res as any)?.data ?? [];
      }
      return await listAllRelationships();
    },
  });

  const relationships = (data ?? []) as any[];

  const filteredRelationships = useMemo(() => {
    return relationships.filter((item) => {
      const type = String(item?.relationshipType ?? "").toLowerCase();
      const note = String(item?.note ?? "").toLowerCase();

      const matchesSearch =
        !searchTerm ||
        type.includes(searchTerm.toLowerCase()) ||
        note.includes(searchTerm.toLowerCase());

      const isActive = Boolean(item?.isActive);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [relationships, searchTerm, statusFilter]);

  function buildPayloadFromForm(): any {
    // payload cơ bản
    const basePayload: any = {
      relationshipType: formData.relationshipType,
      note: formData.note || undefined,
      isActive: formData.isActive,
    };

    // nếu user paste JSON thì merge vào
    const raw = formData.payloadJson?.trim();
    if (!raw) return basePayload;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { ...parsed, ...basePayload };
      }
      return basePayload;
    } catch {
      // JSON sai thì cứ gửi basePayload, đồng thời cảnh báo
      toast.error("Payload JSON không hợp lệ, hệ thống sẽ dùng dữ liệu cơ bản");
      return basePayload;
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayloadFromForm();
      return api.relationship.createRelationship(payload as any);
    },
    onSuccess: () => {
      toast.success("Created relationship successfully");
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Create failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const id = selectedRelationship?.id as string;
      const payload = buildPayloadFromForm();
      return api.relationship.updateRelationship(id, payload as any);
    },
    onSuccess: () => {
      toast.success("Updated relationship successfully");
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Update failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const id = selectedRelationship?.id as string;
      return api.relationship.deleteRelationship(id);
    },
    onSuccess: () => {
      toast.success("Deleted relationship successfully");
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Delete failed");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (item: any) => {
      return api.relationship.updateRelationship(item.id, {
        ...item,
        isActive: !Boolean(item?.isActive),
      } as any);
    },
    onSuccess: () => {
      toast.success("Relationship status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Toggle failed");
    },
  });

  const canSubmit =
    !!formData.relationshipType &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="User Relationship Management"
            description="Create and manage user relationships."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Relationships" },
            ]}
            actions={<Button onClick={openCreate}>New relationship</Button>}
          />

          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by relationship type or note"
            filters={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={patientIdFilter}
                  onChange={(e) => setPatientIdFilter(e.target.value)}
                  placeholder="Filter by Patient ID (optional)"
                />

                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as any)}
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ["relationships"] })
                  }
                  disabled={isFetching}
                >
                  Refresh
                </Button>
              </div>
            }
          />

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Relationship catalog</CardTitle>
              <p className="text-sm text-muted-foreground">
                List uses GET /relationship, you can optionally filter by patient via /relationship/patient or by local search.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading relationships…
                </div>
              ) : filteredRelationships.length === 0 ? (
                <EmptyState
                  title="No relationships match your filters"
                  description="Try broadening your search criteria."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setPatientIdFilter("");
                      }}
                    >
                      Reset filters
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Relationship
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Quick action
                        </th>
                        <th className="w-40 p-3 text-left font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRelationships.map((item) => {
                        const isActive = Boolean(item?.isActive);
                        return (
                          <tr
                            key={item.id}
                            className="border-t bg-background hover:bg-muted/30"
                          >
                            <td className="p-3">
                              <div className="font-medium text-foreground">
                                {String(item?.relationshipType ?? "-")}
                              </div>
                              {item?.note ? (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {String(item.note)}
                                </p>
                              ) : null}
                            </td>

                            <td className="p-3">
                              <StatusBadge
                                status={isActive ? "active" : "inactive"}
                                label={isActive ? "Active" : "Inactive"}
                              />
                            </td>

                            <td className="p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleActiveMutation.mutate(item)}
                                disabled={toggleActiveMutation.isPending}
                              >
                                {isActive ? "Disable" : "Enable"}
                              </Button>
                            </td>

                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openView(item)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(item)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDelete(item)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {modalMode !== "none" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold">
                      {modalMode === "create" && "Create relationship"}
                      {modalMode === "edit" && "Edit relationship"}
                      {modalMode === "view" && "Relationship details"}
                      {modalMode === "delete" && "Delete relationship"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {modalMode === "delete"
                        ? "This action cannot be undone."
                        : "Fill in the details below."}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={closeModal}>
                    Close
                  </Button>
                </div>

                {modalMode === "delete" ? (
                  <div className="space-y-4">
                    <div className="rounded-md border p-3 text-sm">
                      <div className="font-medium">
                        {String(selectedRelationship?.relationshipType ?? "-")}
                      </div>
                      {selectedRelationship?.note ? (
                        <div className="mt-1 text-muted-foreground">
                          {String(selectedRelationship.note)}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={closeModal}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                      >
                        Confirm delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 items-center gap-3">
                      <label className="col-span-4 text-sm font-medium">
                        Relationship type
                      </label>
                      <div className="col-span-8">
                        <input
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          value={String(formData.relationshipType ?? "")}
                          disabled={modalMode === "view"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              relationshipType: e.target.value as any,
                            }))
                          }
                          placeholder="Must match RelationshipType enum"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 items-start gap-3">
                      <label className="col-span-4 pt-2 text-sm font-medium">
                        Note
                      </label>
                      <div className="col-span-8">
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          rows={3}
                          value={formData.note}
                          disabled={modalMode === "view"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              note: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 items-center gap-3">
                      <label className="col-span-4 text-sm font-medium">
                        Active
                      </label>
                      <div className="col-span-8 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          disabled={modalMode === "view"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              isActive: e.target.checked,
                            }))
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          Enable relationship
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 items-start gap-3">
                      <label className="col-span-4 pt-2 text-sm font-medium">
                        Payload JSON
                      </label>
                      <div className="col-span-8">
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          rows={7}
                          value={formData.payloadJson}
                          disabled={modalMode === "view"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              payloadJson: e.target.value,
                            }))
                          }
                          placeholder='Paste extra fields needed by backend, example: {"patientId":"...","doctorId":"..."}'
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Nếu backend yêu cầu patientId, doctorId, relativeId thì paste vào đây.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      <Button variant="outline" onClick={closeModal}>
                        Cancel
                      </Button>

                      {modalMode === "create" ? (
                        <Button
                          onClick={() => createMutation.mutate()}
                          disabled={!canSubmit}
                        >
                          Create
                        </Button>
                      ) : modalMode === "edit" ? (
                        <Button
                          onClick={() => updateMutation.mutate()}
                          disabled={!canSubmit || !selectedRelationship?.id}
                        >
                          Save
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default AdminRelationshipPage;
