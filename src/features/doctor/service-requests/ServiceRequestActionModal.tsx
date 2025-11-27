import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ServiceRequest } from "@/api/types";

interface ServiceRequestActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  action: "approve" | "reject" | "complete" | "cancel" | null;
  onConfirm: (notes?: string) => void;
  isLoading?: boolean;
}

export function ServiceRequestActionModal({
  isOpen,
  onClose,
  request,
  action,
  onConfirm,
  isLoading = false,
}: ServiceRequestActionModalProps) {
  const [notes, setNotes] = useState("");

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  const handleSubmit = () => {
    onConfirm(notes || undefined);
    setNotes("");
  };

  if (!action || !request) return null;

  const getActionInfo = () => {
    switch (action) {
      case "approve":
        return {
          title: "Approve Service Request",
          description: "Approve this service request. You can add optional notes.",
          buttonText: "Approve",
          buttonVariant: "default" as const,
          placeholder: "Optional notes for approval...",
        };
      case "reject":
        return {
          title: "Reject Service Request",
          description: "Reject this service request. Please provide a reason.",
          buttonText: "Reject",
          buttonVariant: "destructive" as const,
          placeholder: "Please provide a reason for rejection...",
        };
      case "complete":
        return {
          title: "Complete Service Request",
          description: "Mark this service request as completed. You can add optional notes.",
          buttonText: "Complete",
          buttonVariant: "default" as const,
          placeholder: "Optional notes for completion...",
        };
      case "cancel":
        return {
          title: "Cancel Service Request",
          description: "Cancel this service request. Please provide a reason.",
          buttonText: "Cancel",
          buttonVariant: "outline" as const,
          placeholder: "Please provide a reason for cancellation...",
        };
      default:
        return null;
    }
  };

  const actionInfo = getActionInfo();
  if (!actionInfo) return null;

  const isRequired = action === "reject" || action === "cancel";

  return (
    <Modal
      title={actionInfo.title}
      description={actionInfo.description}
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Request Code:</span>{" "}
              <span className="text-gray-900">
                {request.requestCode ?? request.id.slice(0, 8)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>{" "}
              <span className="text-gray-900">{request.status}</span>
            </div>
            {request.requestDate && (
              <div>
                <span className="font-medium text-gray-700">Request Date:</span>{" "}
                <span className="text-gray-900">
                  {new Date(request.requestDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">
            {isRequired ? "Reason" : "Notes"} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={actionInfo.placeholder}
            rows={4}
            required={isRequired}
          />
          {isRequired && !notes.trim() && (
            <p className="text-sm text-red-500">
              Please provide a reason for {action === "reject" ? "rejection" : "cancellation"}.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={actionInfo.buttonVariant}
            onClick={handleSubmit}
            disabled={isLoading || (isRequired && !notes.trim())}
          >
            {isLoading ? "Processing..." : actionInfo.buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

