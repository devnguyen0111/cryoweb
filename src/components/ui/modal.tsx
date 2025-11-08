import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  title?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
}

const sizeClassMap: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  title,
  description,
  isOpen,
  onClose,
  children,
  size = "lg",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${sizeClassMap[size]} rounded-lg bg-white shadow-xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
            {description ? (
              <p className="text-sm text-gray-500">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </Button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
