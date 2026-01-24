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

/* =====================
   ROUTE
===================== */

export const Route = createFileRoute("/admin/medicine")({
  component: AdminMedicinesComponent,
});

/* =====================
   TYPES
===================== */

type ModalMode = "none" | "view" | "create" | "edit" | "delete";

/* =====================
   COMPONENT
===================== */

function AdminMedicinesComponent() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);

  const [formData, setFormData] = useState<{
    name: string;
    dosage: string;
    unit: string;
    isActive: boolean;
  }>({
    name: "",
    dosage: "",
    unit: "",
    isActive: true,
  });

  /* =====================
     MODAL HANDLERS
  ===================== */

  const closeModal = () => {
    setModalMode("none");
    setSelectedMedicine(null);
  };

  const openCreate = () => {
    setSelectedMedicine(null);
    setFormData({
      name: "",
      dosage: "",
      unit: "",
      isActive: true,
    });
    setModalMode("create");
  };

  const openView = (medicine: any) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine?.name ?? "",
      dosage: medicine?.dosage ?? "",
      unit: medicine?.unit ?? "",
      isActive: Boolean(medicine?.isActive),
    });
    setModalMode("view");
  };

  const openEdit = (medicine: any) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine?.name ?? "",
      dosage: medicine?.dosage ?? "",
      unit: medicine?.unit ?? "",
      isActive: Boolean(medicine?.isActive),
    });
    setModalMode("edit");
  };

  const openDelete = (medicine: any) => {
    setSelectedMedicine(medicine);
    setModalMode("delete");
  };

  /* =====================
     QUERY
  ===================== */

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["medicines"],
    queryFn: () =>
      api.medicine.getMedicines({
        pageNumber: 1,
        pageSize: 100,
      }),
  });

  const medicines = (data?.data ?? []) as any[];

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const name = (m?.name ?? "").toLowerCase();
      const matchesSearch =
        !searchTerm || name.includes(searchTerm.toLowerCase());

      const isActive = Boolean(m?.isActive);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [medicines, searchTerm, statusFilter]);

  /* =====================
     MUTATIONS
  ===================== */

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.medicine.createMedicine({
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        isActive: formData.isActive,
      });
    },
    onSuccess: () => {
      toast.success("Created medicine successfully");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Create failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const id = selectedMedicine?.id as string;
      return api.medicine.updateMedicine(id, {
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        isActive: formData.isActive,
      });
    },
    onSuccess: () => {
      toast.success("Updated medicine successfully");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Update failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const id = selectedMedicine?.id as string;
      return api.medicine.deleteMedicine(id);
    },
    onSuccess: () => {
      toast.success("Deleted medicine successfully");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Delete failed");
    },
  });

  const canSubmit =
    formData.name.trim().length > 0 &&
    formData.dosage.trim().length > 0 &&
    formData.unit.trim().length > 0 &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  /* =====================
     RENDER
  ===================== */

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Medicine Management"
            description="Manage medicines, dosage, unit, and activation status."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Medicines" },
            ]}
            actions={<Button onClick={openCreate}>New medicine</Button>}
          />

          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by medicine name"
            filters={
              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as any)
                  }
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["medicines"],
                    })
                  }
                  disabled={isFetching}
                >
                  Refresh
                </Button>
              </div>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Medicine catalog
              </CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading medicines…
                </div>
              ) : filteredMedicines.length === 0 ? (
                <EmptyState
                  title="No medicines found"
                  description="Try adjusting your filters."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Dosage</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMedicines.map((m) => {
                        const isActive = Boolean(m?.isActive);

                        return (
                          <tr
                            key={m.id}
                            className="border-t hover:bg-muted/30"
                          >
                            <td className="p-3 font-medium">{m.name}</td>
                            <td className="p-3">{m.dosage}</td>
                            <td className="p-3">{m.unit}</td>
                            <td className="p-3">
                              <StatusBadge
                                status={isActive ? "active" : "inactive"}
                                label={isActive ? "Active" : "Inactive"}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openView(m)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEdit(m)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDelete(m)}
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
        </div>

        {/* MODAL */}
        {modalMode !== "none" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold">
                  {modalMode === "create" && "Create medicine"}
                  {modalMode === "edit" && "Edit medicine"}
                  {modalMode === "view" && "Medicine details"}
                  {modalMode === "delete" && "Delete medicine"}
                </div>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  Close
                </Button>
              </div>

              {modalMode === "delete" ? (
                <div className="space-y-4">
                  <div className="rounded-md border p-3 text-sm">
                    <div className="font-medium">
                      {selectedMedicine?.name}
                    </div>
                    <div className="text-muted-foreground">
                      {selectedMedicine?.dosage} {selectedMedicine?.unit}
                    </div>
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
                  {["name", "dosage", "unit"].map((key) => (
                    <div
                      key={key}
                      className="grid grid-cols-12 items-center gap-3"
                    >
                      <label className="col-span-4 text-sm font-medium capitalize">
                        {key}
                      </label>
                      <div className="col-span-8">
                        <input
                          className="h-10 w-full rounded-md border px-3 text-sm"
                          value={(formData as any)[key]}
                          disabled={modalMode === "view"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={closeModal}>
                      Cancel
                    </Button>
                    {modalMode === "create" && (
                      <Button
                        onClick={() => createMutation.mutate()}
                        disabled={!canSubmit}
                      >
                        Create
                      </Button>
                    )}
                    {modalMode === "edit" && (
                      <Button
                        onClick={() => updateMutation.mutate()}
                        disabled={!canSubmit}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
