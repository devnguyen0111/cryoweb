import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>({});

const Select = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onValueChange?: (value: string) => void;
  }
>(({ className, children, value, onValueChange, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        onOpenChange: setOpen,
      }}
    >
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
});
Select.displayName = "Select";

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={open}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      ref={ref}
      onClick={() => onOpenChange?.(!open)}
      {...props}
    >
      {children}
      {open ? (
        <ChevronUp className="h-4 w-4 opacity-50" />
      ) : (
        <ChevronDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string;
  }
>(({ className, placeholder, ...props }, ref) => {
  const { value } = React.useContext(SelectContext);

  return (
    <span
      ref={ref}
      className={cn("truncate", className)}
      {...props}
    >
      {value || placeholder}
    </span>
  );
});
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SelectContext);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange?.(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, onOpenChange, ref]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
        className
      )}
      {...props}
    >
      <div className="max-h-32 overflow-auto p-1">
        {children}
      </div>
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
  }
>(({ className, children, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange, onOpenChange } = React.useContext(SelectContext);

  const handleClick = () => {
    onValueChange?.(value);
    onOpenChange?.(false);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        selectedValue === value && "bg-accent text-accent-foreground",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {selectedValue === value && <Check className="h-3 w-3" />}
      </span>
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};