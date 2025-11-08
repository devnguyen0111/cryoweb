import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/api/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { capitalize } from "@/utils/capitalize";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersComponent,
});

function AdminUsersComponent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["users", { Page: 1, Size: 20 }],
    queryFn: () => api.user.getUsers({ Page: 1, Size: 20 }),
  });

  const users = data?.data ?? [];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchTerm ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roleName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        roleFilter === "all" ||
        user.roleName?.toLowerCase() === roleFilter.toLowerCase() ||
        user.role?.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? user.status === true : user.status === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    users.forEach((user) => {
      if (user.roleName) {
        roles.add(user.roleName);
      }
    });
    return Array.from(roles);
  }, [users]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="User Management"
            description="Provision administrator access, manage permissions, and monitor role activity."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Users" },
            ]}
            actions={
              <>
                <Button variant="outline" onClick={() => alert("Bulk actions coming soon")}>
                  Bulk actions
                </Button>
                <Button
                  onClick={() =>
                    navigate({
                      to: "/admin/users/$userId",
                      params: { userId: "new" },
                      search: { mode: "edit" },
                    })
                  }
                >
                  New user
                </Button>
              </>
            }
          />

          <ListToolbar
            placeholder="Search by name, email, or role"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={
              <>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="all">All roles</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </>
            }
          />

          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">User directory</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredUsers.length} of {users.length} accounts visible
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Active: {users.filter((user) => user.status).length}
                </Badge>
                <Badge variant="outline">
                  Inactive: {users.filter((user) => user.status === false).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading users…</div>
              ) : filteredUsers.length === 0 ? (
                <EmptyState
                  title="No users found"
                  description="Try adjusting your filters or clear the search query."
                />
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="w-24 p-3 text-left font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-t bg-background hover:bg-muted/30">
                          <td className="truncate p-3 font-medium text-foreground">
                            {user.fullName || user.userName || "Unnamed account"}
                          </td>
                          <td className="truncate p-3 text-muted-foreground">{user.email}</td>
                          <td className="truncate p-3">
                            {user.roleName ? (
                              <Badge variant="outline">{capitalize(user.roleName)}</Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3">
                            <StatusBadge
                              status={user.status ? "active" : "inactive"}
                              label={user.status ? "Active" : "Inactive"}
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate({
                                    to: "/admin/users/$userId",
                                    params: { userId: user.id },
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
                                    to: "/admin/users/$userId",
                                    params: { userId: user.id },
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
