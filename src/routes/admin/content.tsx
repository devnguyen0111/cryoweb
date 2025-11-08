import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { ADMIN_CONTENT_MOCK, type AdminContentItem } from "@/features/admin/content/mockData";
import { toast } from "sonner";

const contentItems = ADMIN_CONTENT_MOCK;

export const Route = createFileRoute("/admin/content")({
  component: AdminContentComponent,
});

function AdminContentComponent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredContent = useMemo(() => {
    return contentItems.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, searchTerm, statusFilter]);

  const totals = useMemo(() => {
    return contentItems.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<AdminContentItem["status"], number>
    );
  }, [contentItems]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Content Management"
            description="Draft, approve, and publish updates for patients and staff."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Content" },
            ]}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Editorial calendar integration coming soon")}
                >
                  Editorial calendar
                </Button>
                <Button
                  onClick={() =>
                    navigate({
                      to: "/admin/content/$contentId",
                      params: { contentId: "new" },
                      search: { mode: "edit" },
                    })
                  }
                >
                  New content
                </Button>
              </>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="text-muted-foreground">Published</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {totals.published ?? 0}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="text-muted-foreground">Draft</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {totals.draft ?? 0}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="text-muted-foreground">Archived</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {totals.archived ?? 0}
                </div>
              </div>
            </div>
          </AdminPageHeader>

          <ListToolbar
            placeholder="Search by title or author"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={
              <>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="Blog">Blog</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Doctor profile">Doctor profile</option>
                </select>
              </>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Editorial queue</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredContent.length === 0 ? (
                <EmptyState
                  title="No content matches your filters"
                  description="Adjust filters or create a new entry."
                  action={
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate({
                          to: "/admin/content/$contentId",
                          params: { contentId: "new" },
                          search: { mode: "edit" },
                        })
                      }
                    >
                      Create content
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium text-muted-foreground">Title</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Category
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Author
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Updated
                        </th>
                        <th className="w-24 p-3 text-left font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContent.map((item) => (
                        <tr key={item.id} className="border-t bg-background hover:bg-muted/30">
                          <td className="p-3 font-medium text-foreground">{item.title}</td>
                          <td className="p-3">
                            <Badge variant="outline">{item.category}</Badge>
                          </td>
                          <td className="p-3">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{item.author}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate({
                                    to: "/admin/content/$contentId",
                                    params: { contentId: item.id },
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
                                    to: "/admin/content/$contentId",
                                    params: { contentId: item.id },
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

