import type { ReactNode } from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  children?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <AdminBreadcrumbs items={breadcrumbs} />
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="rounded-lg border bg-card p-4">{children}</div> : null}
    </div>
  );
}

