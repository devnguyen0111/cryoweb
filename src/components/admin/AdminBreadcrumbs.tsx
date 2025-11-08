import { Link } from "@tanstack/react-router";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <nav className="flex items-center text-sm text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.href) {
          return (
            <span key={item.label} className={isLast ? "font-medium text-foreground" : undefined}>
              {item.label}
            </span>
          );
        }

        return (
          <span key={item.href} className="flex items-center gap-2">
            <Link
              to={item.href}
              className="transition-colors hover:text-foreground"
              aria-label={item.label}
            >
              {item.label}
            </Link>
            <span className="text-muted-foreground">/</span>
          </span>
        );
      })}
    </nav>
  );
}

