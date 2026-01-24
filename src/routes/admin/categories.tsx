import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesComponent,
});

type ModalMode = "none" | "view" | "create" | "edit" | "delete";

function AdminCategoriesComponent() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );

  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    isActive: boolean;
  }>({
    name: "",
    description: "",
    isActive: true,
  });

  const closeModal = () => {
    setModalMode("none");
    setSelectedCategory(null);
  };

  const openCreate = () => {
    toast.info("Opening category creation form");
    setSelectedCategory(null);
    setFormData({ name: "", description: "", isActive: true });
    setModalMode("create");
  };

  const openView = (category: any) => {
    toast.info("Loading category details");
    setSelectedCategory(category);
    setFormData({
      name: (category?.name ?? category?.categoryName ?? "") as string,
      description: (category?.description ?? "") as string,
      isActive: Boolean(category?.isActive ?? true),
    });
    setModalMode("view");
  };

  const openEdit = (category: any) => {
    toast.info("Loading category for editing");
    setSelectedCategory(category);
    setFormData({
      name: (category?.name ?? category?.categoryName ?? "") as string,
      description: (category?.description ?? "") as string,
      isActive: Boolean(category?.isActive ?? true),
    });
    setModalMode("edit");
  };

  const openDelete = (category: any) => {
    toast.info("Preparing to delete category");
    setSelectedCategory(category);
    setModalMode("delete");
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["serviceCategories", { SearchTerm: searchTerm }],
    queryFn: () =>
      api.serviceCategory.getServiceCategories({
        Page: 1,
        Size: 50,
        SearchTerm: searchTerm || undefined,
      }),
  });

  const categories = (data?.data ?? []) as any[];

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const name = (category?.name ?? category?.categoryName ?? "") as string;
      const desc = (category?.description ?? "") as string;

      const matchesSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase());

      const isActive = Boolean(category?.isActive);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name?.trim(),
        categoryName: formData.name?.trim(),
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      } as any;

      return api.serviceCategory.createServiceCategory(payload);
    },
    onSuccess: () => {
      toast.success("Created category successfully");
      queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Create failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const id = selectedCategory?.id as string;
      const payload = {
        name: formData.name?.trim(),
        categoryName: formData.name?.trim(),
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      } as any;

      return api.serviceCategory.updateServiceCategory(id, payload);
    },
    onSuccess: () => {
      toast.success("Updated category successfully");
      queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Update failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const id = selectedCategory?.id as string;
      return api.serviceCategory.deleteServiceCategory(id);
    },
    onSuccess: () => {
      toast.success("Deleted category successfully");
      queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Delete failed");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (category: any) => {
      const id = category?.id as string;
      const nextIsActive = !Boolean(category?.isActive);

      const name = (category?.name ?? category?.categoryName ?? "") as string;

      const payload = {
        name: name,
        categoryName: name,
        description: (category?.description ?? "") as string,
        isActive: nextIsActive,
      } as any;

      return api.serviceCategory.updateServiceCategory(id, payload);
    },
    onSuccess: () => {
      toast.success("Category status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Toggle failed");
    },
  });

  const canSubmit =
    formData.name.trim().length > 0 &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Category Management"
            description="Maintain service groupings, descriptions, and activation states."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Service categories" },
            ]}
            actions={
              <>
                <Button onClick={openCreate}>New category</Button>
              </>
            }
          />

          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by category name or description"
            filters={
              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as any)
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
                      queryKey: ["serviceCategories"],
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
              <CardTitle className="text-base">Category catalog</CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading categories…
                </div>
              ) : filteredCategories.length === 0 ? (
                <EmptyState
                  title="No categories match your filters"
                  description="Try broadening your search criteria."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                    >
                      Reset filters
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Category
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
                      {filteredCategories.map((category) => {
                        const name = (category?.name ??
                          category?.categoryName ??
                          "-") as string;

                        const isActive = Boolean(category?.isActive);

                        return (
                          <tr
                            key={category.id}
                            className="border-t bg-background hover:bg-muted/30"
                          >
                            <td className="p-3">
                              <div className="font-medium text-foreground">
                                {name}
                              </div>
                              {category?.description ? (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {category.description}
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
                                onClick={() => toggleActiveMutation.mutate(category)}
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
                                  onClick={() => openView(category)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(category)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDelete(category)}
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
                      {modalMode === "create" && "Create category"}
                      {modalMode === "edit" && "Edit category"}
                      {modalMode === "view" && "Category details"}
                      {modalMode === "delete" && "Delete category"}
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
                        {(selectedCategory?.name ??
                          selectedCategory?.categoryName ??
                          "-") as string}
                      </div>
                      {selectedCategory?.description ? (
                        <div className="mt-1 text-muted-foreground">
                          {String(selectedCategory.description)}
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
                        Name
                      </label>
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
                          Enable category
                        </span>
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
                          disabled={!canSubmit || !selectedCategory?.id}
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
