import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    label: string;
    tone: "up" | "down" | "flat";
  };
}

export function KpiCard({ title, value, subtitle, icon, trend }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <div className="mt-2 flex items-center text-xs text-muted-foreground">
          {trend ? (
            <span
              className={
                trend.tone === "up"
                  ? "text-emerald-600"
                  : trend.tone === "down"
                  ? "text-rose-600"
                  : "text-muted-foreground"
              }
            >
              {trend.label}
            </span>
          ) : null}
          {subtitle ? <span className="ml-2">{subtitle}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

