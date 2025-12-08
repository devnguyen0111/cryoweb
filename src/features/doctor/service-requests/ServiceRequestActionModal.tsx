import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { ServiceRequest } from "@/api/types";
import { getLast4Chars } from "@/utils/id-helpers";

interface ServiceRequestActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  action: "reject" | "complete" | null;
  onConfirm: () => void;
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
  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    onConfirm();
  };

  if (!action || !request) return null;

  const getActionInfo = () => {
    switch (action) {
      case "reject":
        return {
          title: "Reject Service Request",
          description: "Are you sure you want to reject this service request?",
          buttonText: "Reject",
          buttonVariant: "destructive" as const,
        };
      case "complete":
        return {
          title: "Complete Service Request",
          description: "Are you sure you want to mark this service request as completed?",
          buttonText: "Complete",
          buttonVariant: "default" as const,
        };
      default:
        return null;
    }
  };

  const actionInfo = getActionInfo();
  if (!actionInfo) return null;

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
                {request.requestCode ?? getLast4Chars(request.id)}
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

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={actionInfo.buttonVariant}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : actionInfo.buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

