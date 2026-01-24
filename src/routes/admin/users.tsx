import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { api } from "@/api/client";
import type { User, UserDetailResponse, UpdateUserRequest } from "@/api/types";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersComponent,
});

type ModalMode = "none" | "view" | "edit" | "create";

type RoleOption = {
  roleId: string;
  roleName: string;
};

type AdminCreateAccountRequest = {
  username: string;
  email: string;
  location?: string;
  phone?: string;
  roleId: string;
  status: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatGender(v?: boolean) {
  if (v === true) return "Male";
  if (v === false) return "Female";
  return "-";
}

function formatDateISOToDisplay(iso?: string) {
  if (!iso) return "-";
  // iso có thể "2026-01-22" hoặc full datetime
  const d = iso.slice(0, 10);
  return d || "-";
}

function toInputDate(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function safeText(v?: string | null | undefined) {
  const s = (v ?? "").toString().trim();
  return s.length ? s : "-";
}

function fullName(u: Partial<UserDetailResponse> | Partial<User>) {
  const fn = (u.firstName ?? "").trim();
  const ln = (u.lastName ?? "").trim();
  const joined = `${fn} ${ln}`.trim();
  return joined || (u.userName ?? "").trim() || "Unnamed account";
}

function ModalShell(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
}) {
  const { open, title, onClose, children, footer, widthClassName } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cx(
            "w-full rounded-2xl bg-white shadow-xl",
            widthClassName ?? "max-w-3xl"
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-start justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-6">{children}</div>

          {footer ? (
            <div className="flex items-center justify-end gap-3 border-t px-6 py-5">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FieldRow(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 gap-4 py-3">
      <div className="col-span-5 text-lg text-slate-500">{props.label}</div>
      <div className="col-span-7 text-lg font-semibold text-slate-900">
        {props.value}
      </div>
    </div>
  );
}

function InputField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{props.label}</label>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        disabled={props.disabled}
        className={cx(
          "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none",
          "focus:border-slate-300 focus:ring-2 focus:ring-slate-200",
          props.disabled && "bg-slate-50 text-slate-500"
        )}
      />
    </div>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{props.label}</label>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        className={cx(
          "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none",
          "focus:border-slate-300 focus:ring-2 focus:ring-slate-200",
          props.disabled && "bg-slate-50 text-slate-500"
        )}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AdminUsersComponent() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<UserDetailResponse | null>(null);

  // Form state (Edit)
  const [editForm, setEditForm] = useState<UpdateUserRequest | null>(null);

  // Form state (Create)
  const [createForm, setCreateForm] = useState<AdminCreateAccountRequest>({
    username: "",
    email: "",
    location: "",
    phone: "",
    roleId: "",
    status: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["users", { pageNumber: 1, pageSize: 50 }],
    queryFn: () => api.user.getUsers({ pageNumber: 1, pageSize: 50 }),
  });

  const users: User[] = data?.data ?? [];

  const roleOptions: RoleOption[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      const rid = (u.roleId ?? "").trim();
      const rn = (u.roleName ?? u.role ?? "").toString().trim();
      if (rid && rn && !map.has(rid)) map.set(rid, rn);
    }
    return Array.from(map.entries()).map(([roleId, roleName]) => ({
      roleId,
      roleName,
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return users.filter((u) => {
      const name = fullName(u).toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const roleName = ((u.roleName ?? u.role ?? "") as string).toLowerCase();

      const matchesSearch =
        !q || name.includes(q) || email.includes(q) || roleName.includes(q);

      const matchesRole =
        roleFilter === "all" ||
        (u.roleName ?? u.role ?? "").toString().toLowerCase() ===
          roleFilter.toLowerCase();

      const statusValue = u.status ?? u.isActive ?? false;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? statusValue === true : statusValue === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const active = users.filter((u) => (u.status ?? u.isActive) === true).length;
    const inactive = users.filter((u) => (u.status ?? u.isActive) === false).length;
    return { active, inactive };
  }, [users]);

  async function openView(userId: string) {
    toast.info("Loading user details");
    setSelectedUserId(userId);
    setDetail(null);
    setEditForm(null);
    setModalMode("view");
    setDetailLoading(true);

    try {
      const res = await api.user.getUserById(userId);
      setDetail(res.data);
    } finally {
      setDetailLoading(false);
    }
  }

  async function openEdit(userId: string) {
    toast.info("Loading user for editing");
    setSelectedUserId(userId);
    setDetail(null);
    setEditForm(null);
    setModalMode("edit");
    setDetailLoading(true);

    try {
      const res = await api.user.getUserById(userId);
      const d = res.data;
      setDetail(d);

      // Map UserDetailResponse -> UpdateUserRequest (đúng swagger PUT /api/user/{userId})
      setEditForm({
        firstName: d.firstName ?? "",
        lastName: d.lastName ?? "",
        userName: d.userName ?? "",
        birthDate: d.dob ? d.dob.slice(0, 10) : undefined,
        gender: d.gender,
        phone: d.phone ?? d.phoneNumber ?? "",
        address: (d.location ?? "") || undefined,
        country: (d.country ?? "") || undefined,
        roleId: d.roleId ?? "",
        status: (d.status ?? d.isActive) === true,
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function openCreate() {
    toast.info("Opening user creation form");
    setSelectedUserId(null);
    setDetail(null);
    setEditForm(null);
    setCreateForm({
      username: "",
      email: "",
      location: "",
      phone: "",
      roleId: roleOptions[0]?.roleId ?? "",
      status: true,
    });
    setModalMode("create");
  }

  function closeModal() {
    setModalMode("none");
    setSelectedUserId(null);
    setDetail(null);
    setEditForm(null);
  }

  const updateMutation = useMutation({
    mutationFn: async (payload: { userId: string; data: UpdateUserRequest }) => {
      return api.user.updateUser(payload.userId, payload.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to update user");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: AdminCreateAccountRequest) => {
      return api.auth.createAdminAccount(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to create user");
    },
  });

  const uniqueRoleNames = useMemo(() => {
    const set = new Set<string>();
    for (const u of users) {
      const rn = (u.roleName ?? u.role ?? "").toString().trim();
      if (rn) set.add(rn);
    }
    return Array.from(set);
  }, [users]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="User Management"
            description="Provision administrator access, manage permissions, and monitor role activity."
            breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Users" }]}
            actions={
              <>
                <Button variant="outline" onClick={() => alert("Bulk actions coming soon")}>
                  Bulk actions
                </Button>
                <Button onClick={openCreate}>New user</Button>
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
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All roles</option>
                  {uniqueRoleNames.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                <Badge variant="secondary">Active: {counts.active}</Badge>
                <Badge variant="outline">Inactive: {counts.inactive}</Badge>
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
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="w-28 p-3 text-left font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const statusValue = (u.status ?? u.isActive) === true;
                        const roleLabel = (u.roleName ?? u.role ?? "").toString().trim();

                        return (
                          <tr key={u.id} className="border-t bg-background hover:bg-muted/30">
                            <td className="truncate p-3 font-medium text-foreground">{fullName(u)}</td>
                            <td className="truncate p-3 text-muted-foreground">{u.email}</td>
                            <td className="truncate p-3">
                              {roleLabel ? <Badge variant="outline">{roleLabel}</Badge> : "-"}
                            </td>
                            <td className="p-3">
                              <StatusBadge
                                status={statusValue ? "active" : "inactive"}
                                label={statusValue ? "Active" : "Inactive"}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openView(u.id)}>
                                  View
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openEdit(u.id)}>
                                  Edit
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

        {/* VIEW MODAL */}
        <ModalShell
          open={modalMode === "view"}
          title="User details"
          onClose={closeModal}
          widthClassName="max-w-2xl"
        >
          {detailLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
          ) : !detail ? (
            <div className="py-10 text-center text-sm text-slate-500">No data</div>
          ) : (
            <div className="divide-y">
              <FieldRow label="Full name" value={fullName(detail)} />
              <FieldRow label="Username" value={safeText(detail.userName)} />
              <FieldRow label="Email" value={safeText(detail.email)} />
              <FieldRow label="Phone" value={safeText(detail.phone ?? detail.phoneNumber)} />
              <FieldRow label="Birthday" value={formatDateISOToDisplay(detail.dob)} />
              <FieldRow label="Gender" value={formatGender(detail.gender)} />
              <FieldRow label="Address" value={safeText(detail.location)} />
              <FieldRow label="Country" value={safeText(detail.country)} />
              <FieldRow
                label="Role"
                value={
                  (detail.roleName ?? detail.role ?? "").toString().trim() ? (
                    <Badge className="rounded-full px-4 py-2 text-base" variant="secondary">
                      {(detail.roleName ?? detail.role ?? "").toString()}
                    </Badge>
                  ) : (
                    "-"
                  )
                }
              />
              <FieldRow
                label="Status"
                value={
                  <StatusBadge
                    status={(detail.status ?? detail.isActive) ? "active" : "inactive"}
                    label={(detail.status ?? detail.isActive) ? "Active" : "Inactive"}
                  />
                }
              />
            </div>
          )}
        </ModalShell>

        {/* EDIT MODAL */}
        <ModalShell
          open={modalMode === "edit"}
          title="Edit user"
          onClose={() => {
            if (!updateMutation.isPending) closeModal();
          }}
          widthClassName="max-w-3xl"
          footer={
            <>
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedUserId || !editForm) return;
                  // validate tối thiểu
                  if (!editForm.firstName.trim() || !editForm.lastName.trim()) return;
                  if (!editForm.userName.trim()) return;
                  if (!editForm.roleId.trim()) return;

                  updateMutation.mutate({
                    userId: selectedUserId,
                    data: {
                      ...editForm,
                      // normalize optional fields
                      birthDate: editForm.birthDate?.trim() ? editForm.birthDate : undefined,
                      address: editForm.address?.trim() ? editForm.address : undefined,
                      country: editForm.country?.trim() ? editForm.country : undefined,
                      phone: editForm.phone?.trim() ? editForm.phone : undefined,
                    },
                  });
                }}
                disabled={updateMutation.isPending || detailLoading || !editForm}
              >
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          {detailLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
          ) : !editForm ? (
            <div className="py-10 text-center text-sm text-slate-500">No data</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="First name"
                value={editForm.firstName}
                onChange={(v) => setEditForm({ ...editForm, firstName: v })}
              />
              <InputField
                label="Last name"
                value={editForm.lastName}
                onChange={(v) => setEditForm({ ...editForm, lastName: v })}
              />
              <InputField
                label="Username"
                value={editForm.userName}
                onChange={(v) => setEditForm({ ...editForm, userName: v })}
              />
              <InputField
                label="Email"
                value={detail?.email ?? ""}
                onChange={() => {}}
                disabled
              />

              <InputField
                label="Phone"
                value={editForm.phone ?? ""}
                onChange={(v) => setEditForm({ ...editForm, phone: v })}
              />

              <InputField
                label="Birthday"
                type="date"
                value={editForm.birthDate ? toInputDate(editForm.birthDate) : ""}
                onChange={(v) =>
                  setEditForm({ ...editForm, birthDate: v ? v : undefined })
                }
              />

              <SelectField
                label="Gender"
                value={
                  editForm.gender === true ? "male" : editForm.gender === false ? "female" : "na"
                }
                onChange={(v) => {
                  if (v === "male") setEditForm({ ...editForm, gender: true });
                  else if (v === "female") setEditForm({ ...editForm, gender: false });
                  else setEditForm({ ...editForm, gender: undefined });
                }}
                options={[
                  { value: "na", label: "-" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />

              <InputField
                label="Address"
                value={editForm.address ?? ""}
                onChange={(v) => setEditForm({ ...editForm, address: v })}
                placeholder="location / address"
              />

              <InputField
                label="Country"
                value={editForm.country ?? ""}
                onChange={(v) => setEditForm({ ...editForm, country: v })}
              />

              <SelectField
                label="Role"
                value={editForm.roleId}
                onChange={(v) => setEditForm({ ...editForm, roleId: v })}
                options={
                  roleOptions.length
                    ? roleOptions.map((r) => ({ value: r.roleId, label: r.roleName }))
                    : [{ value: "", label: "No roles" }]
                }
                disabled={!roleOptions.length}
              />

              <SelectField
                label="Status"
                value={editForm.status ? "active" : "inactive"}
                onChange={(v) => setEditForm({ ...editForm, status: v === "active" })}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />

              {updateMutation.isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Save failed, check API / payload.
                </div>
              ) : null}
            </div>
          )}
        </ModalShell>

        {/* CREATE MODAL */}
        <ModalShell
          open={modalMode === "create"}
          title="Create user"
          onClose={() => {
            if (!createMutation.isPending) closeModal();
          }}
          widthClassName="max-w-4xl"
          footer={
            <>
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!createForm.username.trim()) return;
                  if (!createForm.email.trim()) return;
                  if (!createForm.roleId.trim()) return;

                  createMutation.mutate({
                    username: createForm.username.trim(),
                    email: createForm.email.trim(),
                    location: createForm.location?.trim() || undefined,
                    phone: createForm.phone?.trim() || undefined,
                    roleId: createForm.roleId.trim(),
                    status: createForm.status,
                  });
                }}
                disabled={createMutation.isPending || !roleOptions.length}
              >
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <InputField
              label="Username"
              value={createForm.username}
              onChange={(v) => setCreateForm({ ...createForm, username: v })}
              placeholder="username"
            />
            <InputField
              label="Email"
              value={createForm.email}
              onChange={(v) => setCreateForm({ ...createForm, email: v })}
              placeholder="user@example.com"
              type="email"
            />
            <InputField
              label="Phone"
              value={createForm.phone ?? ""}
              onChange={(v) => setCreateForm({ ...createForm, phone: v })}
              placeholder="phone"
            />
            <InputField
              label="Address"
              value={createForm.location ?? ""}
              onChange={(v) => setCreateForm({ ...createForm, location: v })}
              placeholder="location / address"
            />
            <SelectField
              label="Role"
              value={createForm.roleId}
              onChange={(v) => setCreateForm({ ...createForm, roleId: v })}
              options={
                roleOptions.length
                  ? roleOptions.map((r) => ({ value: r.roleId, label: r.roleName }))
                  : [{ value: "", label: "No roles" }]
              }
              disabled={!roleOptions.length}
            />
            <SelectField
              label="Status"
              value={createForm.status ? "active" : "inactive"}
              onChange={(v) => setCreateForm({ ...createForm, status: v === "active" })}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />

            {createMutation.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Create failed, check API / payload.
              </div>
            ) : null}

            {!roleOptions.length ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Không lấy được roleId từ list user. Muốn create được thì list user phải có roleId/roleName để map ra dropdown.
              </div>
            ) : null}
          </div>
        </ModalShell>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
