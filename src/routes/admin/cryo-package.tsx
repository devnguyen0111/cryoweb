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

export const Route = createFileRoute("/admin/cryo-package")({
  component: AdminCryoPackageComponent,
});

type ModalMode = "none" | "view" | "create" | "edit" | "delete";

type CryoPackageForm = {
  packageName: string;
  description: string;
  price: number;
  durationMonths: number;
  maxSamples: number;
  sampleType: "Oocyte" | "Sperm" | "Embryo";
  includesInsurance: boolean;
  insuranceAmount: number;
  isActive: boolean;
  benefits: string;
  notes: string;
};

function AdminCryoPackageComponent() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const [formData, setFormData] = useState<CryoPackageForm>({
    packageName: "",
    description: "",
    price: 0,
    durationMonths: 0,
    maxSamples: 0,
    sampleType: "Oocyte",
    includesInsurance: false,
    insuranceAmount: 0,
    isActive: true,
    benefits: "",
    notes: "",
  });

  const closeModal = () => {
    setModalMode("none");
    setSelectedPackage(null);
  };

  const openCreate = () => {
    setSelectedPackage(null);
    setFormData({
      packageName: "",
      description: "",
      price: 0,
      durationMonths: 0,
      maxSamples: 0,
      sampleType: "Oocyte",
      includesInsurance: false,
      insuranceAmount: 0,
      isActive: true,
      benefits: "",
      notes: "",
    });
    setModalMode("create");
  };

  const openView = (pkg: any) => {
    setSelectedPackage(pkg);
    setFormData({
      packageName: pkg.packageName ?? "",
      description: pkg.description ?? "",
      price: Number(pkg.price ?? 0),
      durationMonths: Number(pkg.durationMonths ?? 0),
      maxSamples: Number(pkg.maxSamples ?? 0),
      sampleType: pkg.sampleType ?? "Oocyte",
      includesInsurance: Boolean(pkg.includesInsurance),
      insuranceAmount: Number(pkg.insuranceAmount ?? 0),
      isActive: Boolean(pkg.isActive),
      benefits: pkg.benefits ?? "",
      notes: pkg.notes ?? "",
    });
    setModalMode("view");
  };

  const openEdit = (pkg: any) => {
    setSelectedPackage(pkg);
    openView(pkg);
    setModalMode("edit");
  };

  const openDelete = (pkg: any) => {
    setSelectedPackage(pkg);
    setModalMode("delete");
  };

  /* =========================
     QUERIES
  ========================= */

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["cyro-packages", { searchTerm }],
    queryFn: () =>
      api.cyroPackage.getCryoPackages({
        searchTerm: searchTerm || undefined,
      }),
  });

  const packages = (data?.data ?? []) as any[];

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const name = (pkg?.packageName ?? "") as string;
      const desc = (pkg?.description ?? "") as string;

      const matchesSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase());

      const isActive = Boolean(pkg?.isActive);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [packages, searchTerm, statusFilter]);

  /* =========================
     MUTATIONS
  ========================= */

  const createMutation = useMutation({
    mutationFn: async () =>
      api.cyroPackage.createCryoPackage({
        ...formData,
        price: Number(formData.price),
        durationMonths: Number(formData.durationMonths),
        maxSamples: Number(formData.maxSamples),
        insuranceAmount: Number(formData.insuranceAmount),
      }),
    onSuccess: () => {
      toast.success("Created cryo package successfully");
      queryClient.invalidateQueries({ queryKey: ["cyro-packages"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Create failed"),
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      api.cyroPackage.updateCryoPackage(selectedPackage.id, {
        ...formData,
        price: Number(formData.price),
        durationMonths: Number(formData.durationMonths),
        maxSamples: Number(formData.maxSamples),
        insuranceAmount: Number(formData.insuranceAmount),
      }),
    onSuccess: () => {
      toast.success("Updated cryo package successfully");
      queryClient.invalidateQueries({ queryKey: ["cyro-packages"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () =>
      api.cyroPackage.deleteCryoPackage(selectedPackage.id),
    onSuccess: () => {
      toast.success("Deleted cryo package successfully");
      queryClient.invalidateQueries({ queryKey: ["cyro-packages"] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const canSubmit =
    formData.packageName.trim().length > 0 &&
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
            title="Cryo Package Management"
            description="Manage cryo storage packages."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Cryo Packages" },
            ]}
            actions={<Button onClick={openCreate}>New package</Button>}
          />

          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by package name or description"
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
                      queryKey: ["cyro-packages"],
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
                Cryo package catalog
              </CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading packages…
                </div>
              ) : filteredPackages.length === 0 ? (
                <EmptyState
                  title="No packages found"
                  description="Try adjusting your filters."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left">Package</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Price</th>
                        <th className="p-3 text-left">Duration</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackages.map((pkg) => {
                        const isActive = Boolean(pkg?.isActive);

                        return (
                          <tr
                            key={pkg.id}
                            className="border-t hover:bg-muted/30"
                          >
                            <td className="p-3">
                              <div className="font-medium">
                                {pkg.packageName}
                              </div>
                              {pkg.description ? (
                                <p className="text-xs text-muted-foreground">
                                  {pkg.description}
                                </p>
                              ) : null}
                            </td>

                            <td className="p-3">{pkg.sampleType}</td>
                            <td className="p-3">{pkg.price}</td>
                            <td className="p-3">
                              {pkg.durationMonths} months
                            </td>

                            <td className="p-3">
                              <StatusBadge
                                status={
                                  isActive ? "active" : "inactive"
                                }
                                label={
                                  isActive ? "Active" : "Inactive"
                                }
                              />
                            </td>

                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openView(pkg)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEdit(pkg)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDelete(pkg)}
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
      </DashboardLayout>
      {modalMode !== "none" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-lg">
      {/* HEADER */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">
            {modalMode === "create" && "Create Cryo Package"}
            {modalMode === "edit" && "Edit Cryo Package"}
            {modalMode === "view" && "Cryo Package Details"}
            {modalMode === "delete" && "Delete Cryo Package"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {modalMode === "delete"
              ? "This action cannot be undone."
              : "Fill in the information below."}
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
              {selectedPackage?.packageName ?? "-"}
            </div>
            {selectedPackage?.description ? (
              <div className="mt-1 text-muted-foreground">
                {selectedPackage.description}
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
          {/* PACKAGE NAME */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">
              Package name
            </label>
            <div className="col-span-8">
              <input
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={formData.packageName}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    packageName: e.target.value,
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
                rows={3}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                value={formData.description}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* SAMPLE TYPE */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">
              Sample type
            </label>
            <div className="col-span-8">
              <select
                className="h-10 w-full rounded-md border border-input px-3 text-sm"
                value={formData.sampleType}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    sampleType: e.target.value as any,
                  }))
                }
              >
                <option value="Oocyte">Oocyte</option>
                <option value="Sperm">Sperm</option>
                <option value="Embryo">Embryo</option>
              </select>
            </div>
          </div>

          {/* PRICE */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">Price</label>
            <div className="col-span-8">
              <input
                type="number"
                min={0}
                className="h-10 w-full rounded-md border border-input px-3 text-sm"
                value={formData.price}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    price: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* DURATION */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">
              Duration (months)
            </label>
            <div className="col-span-8">
              <input
                type="number"
                min={0}
                className="h-10 w-full rounded-md border border-input px-3 text-sm"
                value={formData.durationMonths}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    durationMonths: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* MAX SAMPLES */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 text-sm font-medium">
              Max samples
            </label>
            <div className="col-span-8">
              <input
                type="number"
                min={0}
                className="h-10 w-full rounded-md border border-input px-3 text-sm"
                value={formData.maxSamples}
                disabled={modalMode === "view"}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    maxSamples: Number(e.target.value),
                  }))
                }
              />
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
                  setFormData((p) => ({
                    ...p,
                    isActive: e.target.checked,
                  }))
                }
              />
              <span className="text-sm text-muted-foreground">
                Enable package
              </span>
            </div>
          </div>

          {/* ACTIONS */}
          {modalMode !== "view" && (
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
              ) : (
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={!canSubmit || !selectedPackage?.id}
                >
                  Save
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}

    </ProtectedRoute>
  );
}
