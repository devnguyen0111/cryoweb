// src/routes/lab-technician/dashboard.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { api } from "@/api/client";

/* =====================
   ROUTE
===================== */

export const Route = createFileRoute("/lab-technician/dashboard")({
  component: () => (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <LabTechnicianDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

/* =====================
   HELPERS
===================== */

const text = (v: any) => (v === null || v === undefined ? "" : String(v));

const isPending = (status: any) =>
  ["pending", "processing", "new", "created"].some((k) =>
    text(status).toLowerCase().includes(k)
  );

const isOverdue = (status: any) =>
  ["overdue", "expired", "late"].some((k) =>
    text(status).toLowerCase().includes(k)
  );

const formatDateTime = (v: any) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? text(v) : d.toLocaleString();
};

/* =====================
   PAGE
===================== */

function LabTechnicianDashboard() {
  const navigate = useNavigate();

  /* ===== API ===== */

  const samplesQuery = useQuery({
    queryKey: ["lab-dashboard", "samples"],
    queryFn: () => api.sample.getSamples({ Page: 1, Size: 100 } as any),
  });

  const cryoQuery = useQuery({
    queryKey: ["lab-dashboard", "cryo"],
    queryFn: () => api.cryoLocation.getInitialTree(undefined),
  });

  /* ===== DATA ===== */

  const samples: any[] = useMemo(() => {
    const d: any = samplesQuery.data;
    return d?.data ?? d?.items ?? [];
  }, [samplesQuery.data]);

  const overview = useMemo(() => {
    return {
      total: samples.length,
      pending: samples.filter((s) => isPending(s.status)).length,
      overdue: samples.filter((s) => isOverdue(s.status)).length,
    };
  }, [samples]);

  const recentSamples = useMemo(() => {
    return [...samples]
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
      )
      .slice(0, 8);
  }, [samples]);

  const cryoStats = useMemo(() => {
    const nodes: any[] = cryoQuery.data?.data ?? [];
    return {
      tanks: nodes.filter((n) => n.type === "Tank").length,
      canisters: nodes.filter((n) => n.type === "Canister").length,
      slots: nodes.filter((n) => n.type === "Slot").length,
    };
  }, [cryoQuery.data]);

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Lab Technician Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan công việc và tình trạng mẫu trong phòng lab
          </p>
        </div>

        <Button
          onClick={() => {
            samplesQuery.refetch();
            cryoQuery.refetch();
          }}
        >
          Refresh
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Samples</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {overview.total}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {overview.pending}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-red-600">
            {overview.overdue}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate({ to: "/lab-technician/receive-sample" })}>
            Receive Samples
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/lab-technician/quality-check" })}>
            Quality Control
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/lab-technician/artificial-insemination" })}>
            Artificial Insemination
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/lab-technician/thawing" })}>
            Thawing
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/lab-technician/cryostorage" })}>
            Cryostorage
          </Button>
        </CardContent>
      </Card>

      {/* Recent samples */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Recent Samples</CardTitle>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/lab-technician/receive-sample" })}
          >
            View all
          </Button>
        </CardHeader>

        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Sample Code</th>
                <th>Status</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {recentSamples.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                recentSamples.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">
                      {s.sampleCode ?? s.code ?? s.id}
                    </td>
                    <td>
                      <Badge
                        variant={
                          isOverdue(s.status)
                            ? "destructive"
                            : isPending(s.status)
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td>{formatDateTime(s.updatedAt ?? s.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Cryo */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Cryo Overview</CardTitle>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/lab-technician/cryostorage" })}
          >
            Open Cryostorage
          </Button>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm">
          <div>Tanks: <b>{cryoStats.tanks}</b></div>
          <div>Canisters: <b>{cryoStats.canisters}</b></div>
          <div>Slots: <b>{cryoStats.slots}</b></div>
        </CardContent>
      </Card>
    </div>
  );
}
