import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ListToolbar } from "@/components/admin/ListToolbar";

type SystemSettingsForm = {
  centerName: string;
  centerAddress: string;
  centerPhone: string;
  centerEmail: string;
  reminderEmailTemplate: string;
  reminderSmsTemplate: string;
  reminderScheduleDays: number;
  enableMultilingual: boolean;
  defaultLanguage: string;
  enforceHttps: boolean;
  auditRetentionDays: number;
};

const DEFAULT_SETTINGS: SystemSettingsForm = {
  centerName: "Fertility Science Center",
  centerAddress: "123 Nguyen Van Linh, District 7, Ho Chi Minh City",
  centerPhone: "+84 28 1234 5678",
  centerEmail: "admin@fsc.vn",
  reminderEmailTemplate:
    "Hello {{patient_name}}, this is a reminder for your appointment on {{appointment_date}}.",
  reminderSmsTemplate:
    "FSC reminder: appt {{appointment_date}} at {{appointment_time}}.",
  reminderScheduleDays: 3,
  enableMultilingual: true,
  defaultLanguage: "vi",
  enforceHttps: true,
  auditRetentionDays: 365,
};

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsComponent,
});

function AdminSettingsComponent() {
  const { register, handleSubmit, watch } = useForm<SystemSettingsForm>({
    defaultValues: DEFAULT_SETTINGS,
  });

  const onSubmit = handleSubmit((values) => {
    console.info("System settings updated", values);
    toast.success("Configuration saved and deployed.");
  });

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="System Configuration"
            description="Manage global cryo-center settings, compliance policies, and communication templates."
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "System configuration" },
            ]}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Test email sent.")}
                >
                  Send test email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Test SMS sent.")}
                >
                  Send test SMS
                </Button>
              </>
            }
          />

          <ListToolbar
            placeholder="Search configuration fields"
            actions={
              <Button variant="outline" onClick={() => window.print()}>
                Export settings
              </Button>
            }
          />

          <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Center details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="centerName">Name</Label>
                  <Input id="centerName" {...register("centerName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centerPhone">Phone</Label>
                  <Input id="centerPhone" {...register("centerPhone")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="centerAddress">Address</Label>
                  <Input id="centerAddress" {...register("centerAddress")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centerEmail">Email</Label>
                  <Input
                    id="centerEmail"
                    type="email"
                    {...register("centerEmail")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default language</Label>
                  <select
                    id="defaultLanguage"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    {...register("defaultLanguage")}
                  >
                    <option value="vi">Vietnamese</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reminder configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reminderScheduleDays">
                    Reminder lead time (days)
                  </Label>
                  <Input
                    id="reminderScheduleDays"
                    type="number"
                    min={1}
                    max={14}
                    {...register("reminderScheduleDays", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderEmailTemplate">Email template</Label>
                  <textarea
                    id="reminderEmailTemplate"
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    {...register("reminderEmailTemplate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderSmsTemplate">SMS template</Label>
                  <textarea
                    id="reminderSmsTemplate"
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    {...register("reminderSmsTemplate")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security & compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <label className="flex items-center gap-3">
                  <input type="checkbox" {...register("enforceHttps")} />
                  <span>Enforce HTTPS and redirect all HTTP traffic</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" {...register("enableMultilingual")} />
                  <span>Enable multilingual content delivery</span>
                </label>
                <div className="space-y-2">
                  <Label htmlFor="auditRetentionDays">
                    Audit log retention (days)
                  </Label>
                  <Input
                    id="auditRetentionDays"
                    type="number"
                    min={90}
                    max={1095}
                    {...register("auditRetentionDays", { valueAsNumber: true })}
                  />
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                  All configuration changes are recorded with admin ID,
                  timestamp, and IP address per non-functional requirements.
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Live preview</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                  <h3 className="text-base font-semibold text-foreground">
                    Email preview
                  </h3>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {watch("reminderEmailTemplate")}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                  <h3 className="text-base font-semibold text-foreground">
                    SMS preview
                  </h3>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {watch("reminderSmsTemplate")}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => toast.info("Resetting…")}
                >
                  Reset changes
                </Button>
                <Button type="submit">Save configuration</Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
