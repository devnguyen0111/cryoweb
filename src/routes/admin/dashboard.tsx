import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  Activity,
  ClipboardList,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Users,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";
import {
  createEmptyPaginatedResponse,
} from "@/utils/api-helpers";
import type {
  User,
  Appointment,
  TreatmentCycle,
} from "@/api/types";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardComponent,
});

function AdminDashboardComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const toastId = toast.loading("Refreshing dashboard data...");

    try {
      // Invalidate all queries to refresh dashboard data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "patients"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "treatment-cycles"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "samples"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] }),
      ]);
      toast.success("Dashboard refreshed successfully", { id: toastId });
    } catch (error) {
      toast.error("Failed to refresh dashboard", { id: toastId });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get dashboard statistics with proper error handling
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", { pageNumber: 1, pageSize: 1 }],
    queryFn: async () => {
      try {
        return await api.user.getUsers({ pageNumber: 1, pageSize: 1 });
      } catch (error) {
        console.error("Error fetching users:", error);
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<User>();
        }
        return createEmptyPaginatedResponse<User>();
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["admin", "appointments", { pageNumber: 1, pageSize: 1 }],
    queryFn: async () => {
      try {
        return await api.appointment.getAppointments({ pageNumber: 1, pageSize: 1 });
      } catch (error) {
        console.error("Error fetching appointments:", error);
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<Appointment>();
        }
        return createEmptyPaginatedResponse<Appointment>();
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ["admin", "patients", { pageNumber: 1, pageSize: 1 }],
    queryFn: async () => {
      try {
        return await api.patient.getPatients({ pageNumber: 1, pageSize: 1 });
      } catch (error) {
        console.error("Error fetching patients:", error);
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<any>();
        }
        return createEmptyPaginatedResponse<any>();
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: treatmentCyclesData, isLoading: treatmentCyclesLoading } = useQuery({
    queryKey: ["admin", "treatment-cycles", { pageNumber: 1, pageSize: 1 }],
    queryFn: async () => {
      try {
        return await api.treatmentCycle.getTreatmentCycles({ pageNumber: 1, pageSize: 1 });
      } catch (error) {
        console.error("Error fetching treatment cycles:", error);
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<TreatmentCycle>();
        }
        return createEmptyPaginatedResponse<TreatmentCycle>();
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: samplesData, isLoading: samplesLoading } = useQuery({
    queryKey: ["admin", "samples", { SampleType: "All", pageNumber: 1, pageSize: 1 }],
    queryFn: async () => {
      try {
        return await api.sample.getAllDetailSamples({ SampleType: "All", pageNumber: 1, pageSize: 1 });
      } catch (error) {
        console.error("Error fetching samples:", error);
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<any>();
        }
        return createEmptyPaginatedResponse<any>();
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin", "transactions", { pageNumber: 1, pageSize: 1 }],
    queryFn: async () => {
      try {
        return await api.transaction.getTransactions({ pageNumber: 1, pageSize: 1 });
      } catch (error) {
        console.error("Error fetching transactions:", error);
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<any>();
        }
        return createEmptyPaginatedResponse<any>();
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });



  // Dashboard statistics - Using fallback data for UI testing
  const dashboardStats = useMemo(() => [
    {
      title: "Total Users",
      value: usersLoading ? "..." : (
        usersData?.metaData?.totalCount ??
        usersData?.data?.length ??
        42 // Mock fallback for testing
      ),
      description: "Active accounts across all roles",
      icon: Users,
      action: () => {
        toast.info("Navigating to Users management");
        navigate({ to: "/admin/users" });
      },
      trend: { value: "+12%", direction: "up" as const },
    },
    {
      title: "Total Patients",
      value: patientsLoading ? "..." : (
        patientsData?.metaData?.totalCount ??
        patientsData?.data?.length ??
        156 // Mock fallback for testing
      ),
      description: "Registered patients in system",
      icon: Activity,
      action: () => {
        toast.info("Navigating to Patients overview");
        navigate({ to: "/admin/dashboard" });
      },
      trend: { value: "+8%", direction: "up" as const },
    },
    {
      title: "Total Appointments",
      value: appointmentsLoading ? "..." : (
        appointmentsData?.metaData?.totalCount ??
        appointmentsData?.data?.length ??
        89 // Mock fallback for testing
      ),
      description: "Scheduled appointments",
      icon: LayoutDashboard,
      action: () => {
        toast.info("Navigating to Appointments overview");
        navigate({ to: "/admin/dashboard" });
      },
      trend: { value: "+15%", direction: "up" as const },
    },
    {
      title: "Treatment Cycles",
      value: treatmentCyclesLoading ? "..." : (
        treatmentCyclesData?.metaData?.totalCount ??
        treatmentCyclesData?.data?.length ??
        23 // Mock fallback for testing
      ),
      description: "Active IVF/IUI cycles",
      icon: ClipboardList,
      action: () => {
        toast.info("Navigating to Treatment Cycles overview");
        navigate({ to: "/admin/dashboard" });
      },
      trend: { value: "+5%", direction: "up" as const },
    },
    {
      title: "Samples Stored",
      value: samplesLoading ? "..." : (
        samplesData?.metaData?.totalCount ??
        samplesData?.data?.length ??
        1_247 // Mock fallback for testing
      ),
      description: "Cryopreserved samples",
      icon: FileText,
      action: () => {
        toast.info("Navigating to Samples management");
        navigate({ to: "/admin/samples" });
      },
      trend: { value: "+20%", direction: "up" as const },
    },
    {
      title: "Transactions",
      value: transactionsLoading ? "..." : (
        transactionsData?.metaData?.totalCount ??
        transactionsData?.data?.length ??
        334 // Mock fallback for testing
      ),
      description: "Payment transactions",
      icon: TrendingUp,
      action: () => {
        toast.info("Navigating to Transactions management");
        navigate({ to: "/admin/transaction" });
      },
      trend: { value: "+18%", direction: "up" as const },
    },
  ], [
    usersData, usersLoading, patientsData, patientsLoading,
    appointmentsData, appointmentsLoading, treatmentCyclesData, treatmentCyclesLoading,
    samplesData, samplesLoading, transactionsData, transactionsLoading, navigate
  ]);


  // Quick actions for common admin workflows
  const quickActions = useMemo(() => [
    {
      icon: Users,
      label: "Manage Users",
      description: "Add, edit, or deactivate user accounts",
      action: () => {
        toast.info("Opening Users management");
        navigate({ to: "/admin/users" });
      },
    },
    {
      icon: ClipboardList,
      label: "Review Categories",
      description: "Update service categories and pricing",
      action: () => {
        toast.info("Opening Categories management");
        navigate({ to: "/admin/categories" });
      },
    },
    {
      icon: FileText,
      label: "View Reports",
      description: "Generate and view system reports",
      action: () => {
        toast.info("Opening Reports section");
        navigate({ to: "/admin/reports" });
      },
    },
    {
      icon: Settings,
      label: "System Settings",
      description: "Configure system preferences",
      action: () => {
        toast.info("Opening System Settings");
        navigate({ to: "/admin/dashboard" });
      },
    },
  ], [navigate]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Administrator Dashboard"
            description="Monitor system performance, user activity, and operational metrics."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Overview" },
            ]}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/admin/reports" })}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </>
            }
          >
            {/* Dashboard Statistics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {dashboardStats.map((stat, index) => (
                <Card key={`${stat.title}-${index}`} className="cursor-pointer hover:shadow-md transition-shadow" onClick={stat.action}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                      <Badge variant={stat.trend.direction === "up" ? "default" : "secondary"} className="text-xs">
                        {stat.trend.value}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AdminPageHeader>

          {/* Quick Actions Section */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.action}
                    className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <div className="rounded-full border bg-muted/30 p-3 text-primary">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground mb-1">
                        {action.label}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}