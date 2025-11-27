import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { api } from "@/api/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { useMemo, useState, type ReactNode } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardComponent,
});

function AdminDashboardComponent() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: usersData } = useQuery({
    queryKey: ["users", { pageNumber: 1, pageSize: 1 }],
    queryFn: () => api.user.getUsers({ pageNumber: 1, pageSize: 1 }),
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments", { pageNumber: 1, pageSize: 1 }],
    queryFn: () => api.appointment.getAppointments({ pageNumber: 1, pageSize: 1 }),
  });

  const { data: patientsData } = useQuery({
    queryKey: ["patients", { pageNumber: 1, pageSize: 1 }],
    queryFn: () => api.patient.getPatients({ pageNumber: 1, pageSize: 1 }),
  });

  const mockActivities = useMemo(
    () => [
      {
        id: "activity-1",
        actor: "Dr. Tran Nguyen",
        action: "published new article",
        target: "Embryo Transfer Guidelines 2025",
        timestamp: "2 hours ago",
      },
      {
        id: "activity-2",
        actor: "System",
        action: "generated patient summary report",
        target: "Q3 Cryo Outcomes",
        timestamp: "6 hours ago",
      },
      {
        id: "activity-3",
        actor: "Admin",
        action: "updated service pricing",
        target: "IVF Cycle - Premium",
        timestamp: "1 day ago",
      },
    ],
    []
  );

  const filteredActivities = mockActivities.filter((activity) => {
    if (!searchTerm) {
      return true;
    }
    const lower = searchTerm.toLowerCase();
    return (
      activity.actor.toLowerCase().includes(lower) ||
      activity.action.toLowerCase().includes(lower) ||
      activity.target.toLowerCase().includes(lower)
    );
  });

  const notifications = useMemo(
    () => [
      {
        id: "notification-1",
        type: "storage",
        title: "Cryo storage reaching 85% capacity",
        description: "Center A - Cryo tank 02 requires review",
        status: "active" as const,
      },
      {
        id: "notification-2",
        type: "compliance",
        title: "Consent renewals due this week",
        description: "12 patient consents expiring within 7 days",
        status: "pending" as const,
      },
      {
        id: "notification-3",
        type: "system",
        title: "Security patch applied",
        description: "JWT token rotation updated at 02:30",
        status: "active" as const,
      },
    ],
    []
  );

  type QuickActionRoute =
    | "/admin/users"
    | "/admin/categories"
    | "/admin/content"
    | "/admin/settings";

  const quickActions = useMemo<
    Array<{
      icon: ReactNode;
      label: string;
      description: string;
      to: QuickActionRoute;
    }>
  >(
    () => [
      {
        icon: <Users className="h-4 w-4" />,
        label: "Invite user",
        description: "Provision new administrator, doctor, or staff account",
        to: "/admin/users",
      },
      {
        icon: <ClipboardList className="h-4 w-4" />,
        label: "Review categories",
        description: "Update pricing or freeze categories",
        to: "/admin/categories",
      },
      {
        icon: <FileText className="h-4 w-4" />,
        label: "Create announcement",
        description: "Publish blog, patient notice, or marketing content",
        to: "/admin/content",
      },
      {
        icon: <Settings className="h-4 w-4" />,
        label: "Adjust configurations",
        description: "Manage center info, reminders, and integrations",
        to: "/admin/settings",
      },
    ],
    []
  );

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-10">
          <AdminPageHeader
            title="Administrator Dashboard"
            description="Track cryo-center performance, user activity, and system health."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Overview" },
            ]}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/admin/reports" })}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export summary
                </Button>
                <Button onClick={() => navigate({ to: "/admin/settings" })}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure system
                </Button>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total users"
                value={usersData?.metaData?.totalCount ?? 0}
                subtitle="Across all roles"
                icon={<Users className="h-4 w-4" />}
                trend={{ label: "+8% vs last month", tone: "up" }}
              />
              <KpiCard
                title="Patients under care"
                value={patientsData?.metaData?.totalCount ?? 0}
                subtitle="Active treatment plans"
                icon={<Activity className="h-4 w-4" />}
                trend={{ label: "+3% vs last month", tone: "up" }}
              />
              <KpiCard
                title="Appointments scheduled"
                value={appointmentsData?.metaData?.totalCount ?? 0}
                subtitle="Rolling 30 days"
                icon={<LayoutDashboard className="h-4 w-4" />}
                trend={{ label: "-2% vs target", tone: "down" }}
              />
              <KpiCard
                title="System health"
                value="Operational"
                subtitle="JWT, storage, and integrations"
                icon={<Settings className="h-4 w-4" />}
                trend={{ label: "Last audit 4 hours ago", tone: "flat" }}
              />
            </div>
          </AdminPageHeader>

          <ListToolbar
            placeholder="Search activity, notifications, or quick actions..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-8">
              <CardHeader className="flex items-start justify-between">
                <div>
                  <CardTitle>Recent activity</CardTitle>
                  <CardDescription>
                    Logged administrator and system events in the past 48 hours.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/admin/logs" })}
                >
                  View audit logs
                </Button>
              </CardHeader>
              <CardContent>
                {filteredActivities.length === 0 ? (
                  <EmptyState
                    icon={<Activity className="h-8 w-8" />}
                    title="No activity found"
                    description="Adjust your filters or try a different search query."
                  />
                ) : (
                  <ul className="space-y-4">
                    {filteredActivities.map((activity) => (
                      <li key={activity.id} className="flex items-start gap-4 rounded-lg border p-4">
                        <div className="rounded-full border bg-muted/50 p-2">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium text-foreground">{activity.actor}</span>
                            <span className="text-muted-foreground">{activity.action}</span>
                            <span className="font-medium text-primary">{activity.target}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {activity.timestamp}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    System alerts and compliance reminders for your attention.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notifications.length === 0 ? (
                    <EmptyState
                      icon={<Bell className="h-8 w-8" />}
                      title="All clear"
                      description="You're fully up to date. We'll alert you when there's something new."
                    />
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-lg border bg-muted/30 p-4 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-foreground">
                              {notification.title}
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              {notification.description}
                            </p>
                          </div>
                          <StatusBadge status={notification.status} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick actions</CardTitle>
                  <CardDescription>
                    Shortcuts to the most common administrator workflows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => navigate({ to: action.to })}
                      className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <div className="rounded-full border bg-muted/30 p-2 text-primary">
                        {action.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{action.label}</div>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </button>
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
