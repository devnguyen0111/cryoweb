import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const confirmButtonClass =
    variant === "destructive"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`min-w-[100px] ${confirmButtonClass}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

