import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesComponent,
});

function AdminCategoriesComponent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["serviceCategories", { Page: 1, Size: 50 }],
    queryFn: () => api.serviceCategory.getServiceCategories({ Page: 1, Size: 50 }),
  });

  const categories = data?.data ?? [];

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch =
        !searchTerm ||
        category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        category.categoryType?.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [categories, searchTerm, typeFilter]);

  const categoryTypes = useMemo(() => {
    const types = new Set<string>();
    categories.forEach((category) => {
      if (category.categoryType) {
        types.add(category.categoryType);
      }
    });
    return Array.from(types);
  }, [categories]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Category Management"
            description="Maintain cryo-service groupings, pricing trails, and activation states."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Service categories" },
            ]}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Import via CSV is coming soon")}
                >
                  Import CSV
                </Button>
                <Button
                  onClick={() =>
                    navigate({
                      to: "/admin/categories/$categoryId",
                      params: { categoryId: "new" },
                      search: { mode: "edit" },
                    })
                  }
                >
                  New category
                </Button>
              </>
            }
          />

          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by category name or description"
            filters={
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="all">All types</option>
                {categoryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
                    <Button variant="outline" onClick={() => setTypeFilter("all")}>
                      Reset filters
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Category
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Type
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Updated
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="w-24 p-3 text-left font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((category) => (
                        <tr key={category.id} className="border-t bg-background hover:bg-muted/30">
                          <td className="p-3">
                            <div className="font-medium text-foreground">{category.name}</div>
                            {category.description ? (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {category.description}
                              </p>
                            ) : null}
                          </td>
                          <td className="p-3">
                            {category.categoryType ? (
                              <Badge variant="outline">{category.categoryType}</Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {category.updatedAt
                              ? new Date(category.updatedAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="p-3">
                            <StatusBadge
                              status={category.status === "active" ? "active" : "inactive"}
                              label={
                                category.status === "active" ? "Active" : "Inactive"
                              }
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate({
                                    to: "/admin/categories/$categoryId",
                                    params: { categoryId: category.id },
                                  })
                                }
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate({
                                    to: "/admin/categories/$categoryId",
                                    params: { categoryId: category.id },
                                    search: { mode: "edit" },
                                  })
                                }
                              >
                                Edit
                              </Button>
                            </div>
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}

