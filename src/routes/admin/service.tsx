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

export const Route = createFileRoute("/admin/service")({
  component: AdminServicesComponent,
});

type ModalMode = "none" | "view" | "create" | "edit" | "delete";

function AdminServicesComponent() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedService, setSelectedService] = useState<any>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: number;
    serviceCategoryId: string;
    isActive: boolean;
  }>({
    name: "",
    description: "",
    price: 0,
    serviceCategoryId: "",
    isActive: true,
  });

  const closeModal = () => {
    setModalMode("none");
    setSelectedService(null);
  };

  const openCreate = () => {
    toast.info("Opening service creation form");
    setSelectedService(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      serviceCategoryId: "",
      isActive: true,
    });
    setModalMode("create");
  };

  const openView = (service: any) => {
    toast.info("Loading service details");
    setSelectedService(service);
    setFormData({
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: Number(service?.price ?? 0),
      serviceCategoryId: service?.serviceCategoryId ?? "",
      isActive: Boolean(service?.isActive),
    });
    setModalMode("view");
  };

  const openEdit = (service: any) => {
    toast.info("Loading service for editing");
    setSelectedService(service);
    setFormData({
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: Number(service?.price ?? 0),
      serviceCategoryId: service?.serviceCategoryId ?? "",
      isActive: Boolean(service?.isActive),
    });
    setModalMode("edit");
  };

  const openDelete = (service: any) => {
    toast.info("Preparing to delete service");
    setSelectedService(service);
    setModalMode("delete");
  };

  /* =========================
     QUERIES
  ========================= */

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["services", { searchTerm }],
    queryFn: () =>
      api.service.getServices({
        searchTerm: searchTerm || undefined,
      }),
  });

  const { data: categoryData } = useQuery({
    queryKey: ["serviceCategories"],
    queryFn: () =>
      api.serviceCategory.getServiceCategories({
        Page: 1,
        Size: 100,
      }),
  });

  const services = (data?.data ?? []) as any[];
  const categories = (categoryData?.data ?? []) as any[];

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const name = (service?.name ?? "") as string;
      const desc = (service?.description ?? "") as string;

      const matchesSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase());

      const isActive = Boolean(service?.isActive);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [services, searchTerm, statusFilter]);

  /* =========================
     MUTATIONS
  ========================= */

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.service.createService({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        price: Number(formData.price),
        serviceCategoryId: formData.serviceCategoryId,
        isActive: formData.isActive,
      });
    },
    onSuccess: () => {
      toast.success("Created service successfully");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Create failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const id = selectedService?.id as string;
      return api.service.updateService(id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        price: Number(formData.price),
        serviceCategoryId: formData.serviceCategoryId,
        isActive: formData.isActive,
      });
    },
    onSuccess: () => {
      toast.success("Updated service successfully");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Update failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const id = selectedService?.id as string;
      return api.service.deleteService(id);
    },
    onSuccess: () => {
      toast.success("Deleted service successfully");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Delete failed");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (service: any) => {
      const id = service?.id as string;
      return api.service.updateService(id, {
        name: service.name,
        description: service.description,
        price: service.price,
        serviceCategoryId: service.serviceCategoryId,
        isActive: !Boolean(service.isActive),
      });
    },
    onSuccess: () => {
      toast.success("Service status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Toggle failed");
    },
  });

  const canSubmit =
    formData.name.trim().length > 0 &&
    formData.serviceCategoryId.length > 0 &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  /* =========================
     RENDER
  ========================= */

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Service Management"
            description="Manage services, pricing, categories, and activation state."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Services" },
            ]}
            actions={<Button onClick={openCreate}>New service</Button>}
          />

          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by service name or description"
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
                      queryKey: ["services"],
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
              <CardTitle className="text-base">Service catalog</CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading services…
                </div>
              ) : filteredServices.length === 0 ? (
                <EmptyState
                  title="No services found"
                  description="Try adjusting your filters."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left">Service</th>
                        <th className="p-3 text-left">Category</th>
                        <th className="p-3 text-left">Price</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Quick action</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.map((service) => {
                        const isActive = Boolean(service?.isActive);
                        const categoryName =
  categories.find(
    (c) => c.id === service.serviceCategoryId,
  )?.name ??
  categories.find(
    (c) => c.id === service.serviceCategoryId,
  )?.categoryName ??
  "-";

                        return (
                          <tr
                            key={service.id}
                            className="border-t hover:bg-muted/30"
                          >
                            <td className="p-3">
                              <div className="font-medium">
                                {service.name}
                              </div>
                              {service.description ? (
                                <p className="text-xs text-muted-foreground">
                                  {service.description}
                                </p>
                              ) : null}
                            </td>

                            <td className="p-3">{categoryName}</td>
                            <td className="p-3">{service.price}</td>

                            <td className="p-3">
                              <StatusBadge
                                status={isActive ? "active" : "inactive"}
                                label={isActive ? "Active" : "Inactive"}
                              />
                            </td>

                            <td className="p-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  toggleActiveMutation.mutate(service)
                                }
                              >
                                {isActive ? "Disable" : "Enable"}
                              </Button>
                            </td>

                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openView(service)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEdit(service)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDelete(service)}
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

          {/* MODAL giống category, chỉ khác field */}
          {/* Nếu bạn muốn, mình sẽ tách riêng modal cho bạn ở bước sau */}
        </div>
      </DashboardLayout>
      {modalMode !== "none" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
      {/* HEADER */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">
            {modalMode === "create" && "Create service"}
            {modalMode === "edit" && "Edit service"}
            {modalMode === "view" && "Service details"}
            {modalMode === "delete" && "Delete service"}
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

      {/* DELETE */}
      {modalMode === "delete" ? (
        <div className="space-y-4">
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium">
              {selectedService?.name ?? "-"}
            </div>
            {selectedService?.description ? (
              <div className="mt-1 text-muted-foreground">
                {String(selectedService.description)}
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
        /* CREATE / EDIT / VIEW */
        <div className="space-y-4">
          {/* NAME */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">Name</label>
            <div className="col-span-8">
              <input
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.name}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="grid grid-cols-12 items-start gap-3">
            <label className="col-span-4 pt-2 text-sm font-medium">
              Description
            </label>
            <div className="col-span-8">
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                rows={4}
                value={formData.description}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* PRICE */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">Price</label>
            <div className="col-span-8">
              <input
                type="number"
                min={0}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.price}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* CATEGORY */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">Category</label>
            <div className="col-span-8">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.serviceCategoryId}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    serviceCategoryId: e.target.value,
                  }))
                }
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c?.name ?? c?.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIVE */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">Active</label>
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
                Enable service
              </span>
            </div>
          </div>

          {/* ACTIONS */}
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
                disabled={!canSubmit || !selectedService?.id}
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

    </ProtectedRoute>
  );
}
