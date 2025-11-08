import type { ChangeEvent, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface ListToolbarProps {
  placeholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ListToolbar({
  placeholder = "Search...",
  searchValue,
  onSearchChange,
  filters,
  actions,
  className,
}: ListToolbarProps) {
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(event.target.value);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="md:w-72">
          <Input
            placeholder={placeholder}
            value={searchValue ?? ""}
            onChange={handleInput}
          />
        </div>
        {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

