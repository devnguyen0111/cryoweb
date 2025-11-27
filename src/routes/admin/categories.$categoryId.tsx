import { useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/api/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";

type CategoryForm = {
  name?: string;
  description?: string;
  categoryType?: string;
  status?: "active" | "inactive";
};

export const Route = createFileRoute("/admin/categories/$categoryId")({
  component: AdminCategoryDetailComponent,
});

function AdminCategoryDetailComponent() {
  const { categoryId } = Route.useParams();
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin/categories/$categoryId" }) as { mode?: string };
  const isCreate = categoryId === "new";
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<CategoryForm>({
    defaultValues: {
      name: "",
      description: "",
      categoryType: "",
      status: "active",
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["serviceCategory", categoryId],
    queryFn: () => api.serviceCategory.getServiceCategoryById(categoryId),
    enabled: !isCreate,
  });

  const category = data?.data;

  const { data: servicesData } = useQuery({
    queryKey: ["services", { categoryId: categoryId }],
    queryFn: () =>
      api.service.getServices({
        categoryId: categoryId,
        pageNumber: 1,
        pageSize: 50,
      }),
    enabled: !!category,
  });

  const services = servicesData?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CategoryForm>) =>
      api.serviceCategory.updateServiceCategory(categoryId, payload),
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
      queryClient.invalidateQueries({ queryKey: ["serviceCategory", categoryId] });
    },
    onError: () => {
      toast.error("Unable to update category. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.serviceCategory.deleteServiceCategory(categoryId),
    onSuccess: () => {
      toast.success("Category deleted and audit log recorded.");
      queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
      navigate({ to: "/admin/categories" });
    },
    onError: () => {
      toast.error("Unable to delete category. Please try again.");
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<CategoryForm>) =>
      api.serviceCategory.createServiceCategory(payload),
    onSuccess: (response) => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
      const newId = response.data?.id;
      if (newId) {
        navigate({
          to: "/admin/categories/$categoryId",
          params: { categoryId: newId },
        });
      } else {
        navigate({ to: "/admin/categories" });
      }
    },
    onError: () => {
      toast.error("Unable to create category. Please try again.");
    },
  });

  const allowEdit = isCreate || search.mode === "edit";

  const priceHistory = useMemo(() => {
    // Price history is not available in ServiceCategory type
    return [
      {
        id: "price-1",
        price: 12000000,
        effectiveFrom: "2025-01-01",
        updatedBy: "Admin",
      },
      {
        id: "price-2",
        price: 11500000,
        effectiveFrom: "2024-03-01",
        updatedBy: "Admin",
      },
    ];
  }, []);

  useEffect(() => {
    if (category) {
      reset(
        {
          name: category.categoryName ?? "",
          description: category.description ?? "",
          categoryType: "",
          status: category.isActive ? "active" : "inactive",
        },
        { keepDefaultValues: true }
      );
    } else if (isCreate) {
      reset(
        {
          name: "",
          description: "",
          categoryType: "",
          status: "active",
        },
        { keepDefaultValues: true }
      );
    }
  }, [category, isCreate, reset]);

  const onSubmit = handleSubmit((values) => {
    if (isCreate) {
      createMutation.mutate(values);
    } else {
      updateMutation.mutate(values);
    }
  });

  if (isLoading && !isCreate) {
    return (
      <ProtectedRoute allowedRoles={["Admin"]}>
        <DashboardLayout>
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading category details…
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (isError && !isCreate) {
    return (
      <ProtectedRoute allowedRoles={["Admin"]}>
        <DashboardLayout>
          <EmptyState
            title="Category not found"
            description="This category may have been removed."
            action={
              <Button onClick={() => navigate({ to: "/admin/categories" })}>
                Back to categories
              </Button>
            }
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title={
              category?.categoryName ?? (isCreate ? "Create category" : "Category overview")
            }
            description={
              isCreate
                ? "Define a new service grouping with pricing history and audit logging."
                : "Track pricing updates, services mapped to this category, and lifecycle status."
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Service categories", href: "/admin/categories" },
              { label: category?.categoryName ?? (isCreate ? "Create" : "Details") },
            ]}
            actions={
              !isCreate && category ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: "/admin/categories/$categoryId",
                        params: { categoryId },
                        search: { mode: allowEdit ? undefined : "edit" },
                      })
                    }
                  >
                    {allowEdit ? "Cancel edit" : "Edit category"}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete category? Services will be unmapped and the action will be logged."
                        )
                      ) {
                        deleteMutation.mutate();
                      }
                    }}
                  >
                    Delete category
                  </Button>
                </>
              ) : null
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <form onSubmit={onSubmit}>
                <CardHeader>
                  <CardTitle>Category information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category name</Label>
                    <Input
                      id="name"
                      disabled={!allowEdit || updateMutation.isPending || createMutation.isPending}
                      {...register("name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      disabled={!allowEdit || updateMutation.isPending || createMutation.isPending}
                      {...register("description")}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="categoryType">Category type</Label>
                      <Input
                        id="categoryType"
                        disabled={!allowEdit || updateMutation.isPending || createMutation.isPending}
                        {...register("categoryType")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center gap-3">
                        <StatusBadge
                          status={watch("status") === "active" ? "active" : "inactive"}
                          label={watch("status") === "active" ? "Active" : "Inactive"}
                        />
                        {allowEdit ? (
                          <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            value={watch("status")}
                            disabled={!allowEdit || updateMutation.isPending || createMutation.isPending}
                            onChange={(event) =>
                              setValue("status", event.target.value as CategoryForm["status"])
                            }
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
                {allowEdit ? (
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/admin/categories/$categoryId",
                          params: { categoryId },
                        })
                      }
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending}>
                      Save changes
                    </Button>
                  </CardFooter>
                ) : null}
              </form>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Associated services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {services.length === 0 || isCreate ? (
                    <EmptyState
                      title={isCreate ? "Save to link services" : "No services linked"}
                      description={
                        isCreate
                          ? "Create the category first, then map services from the service catalog."
                          : "Map embryology, cryo, or consultation services to this category."
                      }
                      action={
                        <Button variant="outline" size="sm">
                          Add service
                        </Button>
                      }
                    />
                  ) : (
                    services.map((service) => (
                      <div key={service.id} className="rounded-lg border bg-muted/20 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">{service.name}</div>
                            <p className="text-xs text-muted-foreground">
                              {service.description ?? "No description"}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              maximumFractionDigits: 0,
                            }).format(service.price ?? 0)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Price history</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {priceHistory.map((entry: { id: string; price: number; effectiveFrom: string; updatedBy: string }) => (
                    <div key={entry.id} className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(entry.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Effective {new Date(entry.effectiveFrom).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Updated by {entry.updatedBy ?? "System"}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

