import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { Button } from "@/components/ui/button";
import { Download, LineChart, PieChart } from "lucide-react";
import { EmptyState } from "@/components/admin/EmptyState";

type ReportType =
  | "patient-count"
  | "revenue"
  | "treatment-success"
  | "sample-quality";

const REPORT_OPTIONS: { id: ReportType; label: string; description: string }[] = [
  {
    id: "patient-count",
    label: "Patient count",
    description: "Active patients, new registrations, and discharge totals.",
  },
  {
    id: "revenue",
    label: "Revenue",
    description: "Billed vs collected and average revenue per treatment cycle.",
  },
  {
    id: "treatment-success",
    label: "Treatment success",
    description: "Clinical pregnancy rates, live birth outcomes, and IUI/IVF KPIs.",
  },
  {
    id: "sample-quality",
    label: "Sample quality",
    description: "Cryo sample survival rates, motility, and MII oocyte percentages.",
  },
];

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsComponent,
});

function AdminReportsComponent() {
  const [reportType, setReportType] = useState<ReportType>("patient-count");
  const [dateRange, setDateRange] = useState("last-90-days");

  const reportSummary = useMemo(() => {
    switch (reportType) {
      case "patient-count":
        return {
          icon: <PieChart className="h-5 w-5 text-primary" />,
          title: "Patient population overview",
          narrative:
            "132 active patients across IVF, IUI, and fertility preservation programs. New registrations increased 6% compared to the previous quarter.",
          stats: [
            { label: "Active patients", value: "132", context: "+6% QoQ" },
            { label: "New registrations", value: "48", context: "24% IVF" },
            { label: "Discharges", value: "12", context: "83% treatment complete" },
          ],
        };
      case "revenue":
        return {
          icon: <LineChart className="h-5 w-5 text-primary" />,
          title: "Revenue performance",
          narrative:
            "Revenue grew 12% driven by advanced cryo services. IVF premium packages represent 54% of total revenue.",
          stats: [
            { label: "Total revenue", value: "4.2B ₫", context: "+12% QoQ" },
            { label: "Average per cycle", value: "32M ₫", context: "+8% QoQ" },
            { label: "Outstanding AR", value: "280M ₫", context: "within SLA" },
          ],
        };
      case "treatment-success":
        return {
          icon: <PieChart className="h-5 w-5 text-primary" />,
          title: "Treatment success KPIs",
          narrative:
            "Clinical pregnancy rate improved to 54% and embryo thaw survival holds at 92%.",
          stats: [
            { label: "Clinical pregnancy", value: "54%", context: "+3 pts" },
            { label: "Live birth rate", value: "38%", context: "+1.5 pts" },
            { label: "Embryo thaw survival", value: "92%", context: "Target 90%" },
          ],
        };
      case "sample-quality":
        return {
          icon: <LineChart className="h-5 w-5 text-primary" />,
          title: "Cryo sample quality",
          narrative:
            "Post-thaw motility rates and MII oocyte percentages meet ISO benchmarks. Alert triggered for Tank 4 review.",
          stats: [
            { label: "MII oocytes", value: "84%", context: "Stable" },
            { label: "Motility > 70%", value: "76%", context: "+4 pts" },
            { label: "Tank alerts", value: "1", context: "Tank 4 review" },
          ],
        };
      default:
        return null;
    }
  }, [reportType]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Reports & Analytics"
            description="Generate oversight reports for leadership, compliance, and medical committees."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Reports & analytics" },
            ]}
            actions={
              <>
                <Button variant="outline" onClick={() => {
                  toast.info("Preparing PDF export");
                  window.print();
                  toast.success("PDF export initiated");
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.success("CSV export queued and sent to your email");
                  }}
                >
                  Export CSV
                </Button>
              </>
            }
          />

          <ListToolbar
            placeholder="Search saved reports"
            filters={
              <>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value as ReportType)}
                >
                  {REPORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={dateRange}
                  onChange={(event) => setDateRange(event.target.value)}
                >
                  <option value="last-30-days">Last 30 days</option>
                  <option value="last-90-days">Last 90 days</option>
                  <option value="ytd">Year to date</option>
                  <option value="custom">Custom…</option>
                </select>
              </>
            }
          />

          {reportSummary ? (
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border bg-muted/30 p-2">{reportSummary.icon}</span>
                    <CardTitle>{reportSummary.title}</CardTitle>
                  </div>
                  <CardDescription>{REPORT_OPTIONS.find((item) => item.id === reportType)?.description}</CardDescription>
                  <p className="text-sm text-muted-foreground">{reportSummary.narrative}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {reportSummary.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border bg-muted/20 p-3 text-sm"
                    >
                      <div className="text-muted-foreground">{stat.label}</div>
                      <div className="text-xl font-semibold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.context}</div>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  Interactive charts pending integration. Data for {dateRange.split("-").join(" ")} displayed in table below.
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium text-muted-foreground">Metric</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Value</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Variance</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportSummary.stats.map((stat) => (
                        <tr key={stat.label} className="border-t bg-background hover:bg-muted/30">
                          <td className="p-3 font-medium text-foreground">{stat.label}</td>
                          <td className="p-3 text-muted-foreground">{stat.value}</td>
                          <td className="p-3 text-muted-foreground">{stat.context}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            Audit logged with report ID #{reportType}-2025
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="Select a report type"
              description="Choose a metric to generate data visualizations and export files."
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
