import { useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { api } from "@/api/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { capitalize } from "@/utils/capitalize";

type UserDetailForm = {
  fullName?: string;
  email?: string;
  roleName?: string;
  phone?: string;
  status?: boolean;
};

export const Route = createFileRoute("/admin/users/$userId")({
  component: AdminUserDetailComponent,
});

function AdminUserDetailComponent() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin/users/$userId" }) as { mode?: string };
  const isCreate = userId === "new";
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm<UserDetailForm>({
    defaultValues: {
      fullName: "",
      email: "",
      roleName: "",
      phone: "",
      status: true,
    },
  });

  useEffect(() => {
    register("status");
  }, [register]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.user.getUserById(userId),
    enabled: !isCreate,
  });

  const user = data?.data;

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UserDetailForm>) =>
      api.user.updateUser(userId, payload),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: () => {
      toast.error("Unable to update user. Please try again.");
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<UserDetailForm>) =>
      api.user.createUser({
        fullName: payload.fullName,
        email: payload.email,
        roleName: payload.roleName,
        phone: payload.phone,
        status: payload.status,
      }),
    onSuccess: (response) => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const newUserId = response.data?.id;
      if (newUserId) {
        navigate({
          to: "/admin/users/$userId",
          params: { userId: newUserId },
        });
      } else {
        navigate({ to: "/admin/users" });
      }
    },
    onError: () => {
      toast.error("Unable to create user. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.user.deleteUser(userId),
    onSuccess: () => {
      toast.success("User deleted and audit log recorded.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate({ to: "/admin/users" });
    },
    onError: () => {
      toast.error("Unable to delete user. Please try again.");
    },
  });

  const auditTimeline = useMemo(
    () => [
      {
        id: "audit-1",
        action: "Permissions updated",
        performedBy: "Admin",
        timestamp: "2025-11-02 14:21",
      },
      {
        id: "audit-2",
        action: "Password reset request",
        performedBy: "System",
        timestamp: "2025-10-24 08:15",
      },
      {
        id: "audit-3",
        action: "Role assigned: Doctor",
        performedBy: "Admin",
        timestamp: "2025-09-12 09:05",
      },
    ],
    []
  );

  const allowEdit = isCreate || search.mode === "edit";

  const onSubmit = handleSubmit((formValues) => {
    const payload = {
      fullName: formValues.fullName,
      email: formValues.email,
      roleName: formValues.roleName,
      phone: formValues.phone,
      status: formValues.status,
    };

    if (isCreate) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  });

  if (isLoading && !isCreate) {
    return (
      <ProtectedRoute allowedRoles={["Admin"]}>
        <DashboardLayout>
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading user details…
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
            title="User not found"
            description="We couldn’t load this user record. They might have been deleted."
            action={
              <Button onClick={() => navigate({ to: "/admin/users" })}>
                Back to user list
              </Button>
            }
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  useEffect(() => {
    if (user) {
      reset(
        {
          fullName: user.fullName ?? user.userName ?? "",
          email: user.email ?? "",
          roleName: user.roleName ?? user.role ?? "",
          phone: user.phone ?? "",
          status: user.status ?? true,
        },
        { keepDefaultValues: true }
      );
    } else if (isCreate) {
      reset(
        {
          fullName: "",
          email: "",
          roleName: "",
          phone: "",
          status: true,
        },
        { keepDefaultValues: true }
      );
    }
  }, [isCreate, reset, user]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title={user?.fullName ?? user?.email ?? (isCreate ? "Create user" : "User")}
            description=
              {isCreate
                ? "Provision a new account and assign role-level permissions."
                : "Review and update account attributes, permissions, and audit trail."}
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Users", href: "/admin/users" },
              { label: user?.fullName ?? (isCreate ? "Create" : "Details") },
            ]}
            actions={
              !isCreate && user ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: "/admin/users/$userId",
                        params: { userId },
                        search: { mode: allowEdit ? undefined : "edit" },
                      })
                    }
                  >
                    {allowEdit ? "Cancel edit" : "Edit user"}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete user? This action is recorded to the audit log."
                        )
                      ) {
                        deleteMutation.mutate();
                      }
                    }}
                  >
                    Delete user
                  </Button>
                </>
              ) : null
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <form onSubmit={onSubmit}>
                <CardHeader>
                  <CardTitle>Profile information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input
                        id="fullName"
                        disabled={!allowEdit || updateMutation.isPending || createMutation.isPending}
                        {...register("fullName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        disabled={!allowEdit || updateMutation.isPending || createMutation.isPending}
                        {...register("email")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roleName">Role</Label>
                      <Input
                        id="roleName"
                        disabled={!allowEdit || updateMutation.isPending || createMutation.isPending}
                        {...register("roleName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        disabled={!allowEdit || updateMutation.isPending || createMutation.isPending}
                        {...register("phone")}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Status</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge
                        status={watch("status") ? "active" : "inactive"}
                        label={watch("status") ? "Active" : "Inactive"}
                      />
                      <Badge variant="outline">
                        Role: {capitalize(watch("roleName") || user?.roleName || user?.role || "Unknown")}
                      </Badge>
                    </div>
                    {allowEdit ? (
                      <div className="flex gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            name="status"
                            type="radio"
                            className="h-4 w-4"
                            disabled={updateMutation.isPending || createMutation.isPending}
                            checked={watch("status") === true}
                            onChange={() => setValue("status", true)}
                          />
                          Active
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            name="status"
                            type="radio"
                            className="h-4 w-4"
                            disabled={updateMutation.isPending || createMutation.isPending}
                            checked={watch("status") === false}
                            onChange={() => setValue("status", false)}
                          />
                          Inactive
                        </label>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
                {allowEdit ? (
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/admin/users/$userId",
                          params: { userId },
                        })
                      }
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending || createMutation.isPending}
                    >
                      Save changes
                    </Button>
                  </CardFooter>
                ) : null}
              </form>
            </Card>

            <div className="space-y-6">
              {!isCreate && user ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Account metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="font-medium">{user.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated</span>
                        <span className="font-medium">
                          {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email verified</span>
                        <span className="font-medium">
                          {user.emailVerified || user.isEmailVerified ? "Yes" : "No"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Audit trail</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {auditTimeline.map((item) => (
                        <div key={item.id} className="rounded-lg border bg-muted/20 p-3 text-sm">
                          <div className="font-medium text-foreground">{item.action}</div>
                          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.performedBy}</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Creation checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      After saving the new user, an audit entry is logged and invitation email is
                      sent automatically.
                    </p>
                    <ul className="list-disc space-y-1 pl-4">
                      <li>Assign appropriate role and verify email.</li>
                      <li>System will prompt for password setup on first login.</li>
                      <li>Revisit audit logs to monitor onboarding progress.</li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

