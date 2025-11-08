import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface AuditLogEntry {
  id: string;
  actor: string;
  role: string;
  action: "create" | "update" | "delete" | "login" | "export";
  entity: string;
  entityId: string;
  timestamp: string;
  status: "success" | "error";
  ip: string;
  details: string;
}

const MOCK_LOGS: AuditLogEntry[] = [
  {
    id: "log-001",
    actor: "admin@fsc.vn",
    role: "Admin",
    action: "update",
    entity: "User",
    entityId: "USR-202",
    timestamp: "2025-11-07T14:32:00Z",
    status: "success",
    ip: "10.0.0.21",
    details: "Updated permissions for doctor account.",
  },
  {
    id: "log-002",
    actor: "system",
    role: "System",
    action: "export",
    entity: "Report",
    entityId: "RPT-882",
    timestamp: "2025-11-07T09:10:00Z",
    status: "success",
    ip: "127.0.0.1",
    details: "Generated treatment success report (PDF).",
  },
  {
    id: "log-003",
    actor: "admin@fsc.vn",
    role: "Admin",
    action: "delete",
    entity: "Content",
    entityId: "CNT-142",
    timestamp: "2025-11-06T18:44:00Z",
    status: "success",
    ip: "10.0.0.21",
    details: "Archived announcement 'Cryo tank maintenance'.",
  },
  {
    id: "log-004",
    actor: "dr.tran@fsc.vn",
    role: "Doctor",
    action: "login",
    entity: "Auth",
    entityId: "AUTH-001",
    timestamp: "2025-11-06T07:05:00Z",
    status: "success",
    ip: "10.0.0.53",
    details: "JWT issued for doctor dashboard access.",
  },
];

export const Route = createFileRoute("/admin/logs")({
  component: AdminAuditLogsComponent,
});

function AdminAuditLogsComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      const matchesSearch =
        !searchTerm ||
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [actionFilter, searchTerm, statusFilter]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Audit Logs"
            description="Review immutable audit trails for privileged actions. Logs are retained per compliance policy."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Audit logs" },
            ]}
            actions={
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  Export PDF
                </Button>
                <Button variant="outline" onClick={() => alert("CSV export queued.")}>
                  Export CSV
                </Button>
              </>
            }
          />

          <ListToolbar
            placeholder="Search by user, entity, or details"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={
              <>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                >
                  <option value="all">All actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                  <option value="export">Export</option>
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </>
            }
            actions={
              <Button variant="outline" onClick={() => alert("Log retention review scheduled.")}>
                Review retention policy
              </Button>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity log</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <EmptyState
                  title="No logs match your filters"
                  description="Adjust the filters or date range to view more activity."
                />
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium text-muted-foreground">Timestamp</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Actor</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Action</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Entity</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Details
                        </th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-t bg-background hover:bg-muted/30">
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">{log.actor}</div>
                            <div className="text-xs text-muted-foreground">{log.role}</div>
                          </td>
                          <td className="p-3 text-muted-foreground">{log.action}</td>
                          <td className="p-3 text-muted-foreground">
                            {log.entity} • {log.entityId}
                          </td>
                          <td className="p-3 text-muted-foreground">{log.details}</td>
                          <td className="p-3">
                            <StatusBadge
                              status={log.status === "success" ? "active" : "error"}
                              label={log.status === "success" ? "Success" : "Error"}
                            />
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

