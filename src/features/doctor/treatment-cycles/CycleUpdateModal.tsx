/**
 * Cycle Update Modal Component
 * Modal form for updating treatment cycle progress, creating medical records,
 * and advancing to next treatment stage
 */

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CycleUpdateForm } from "./CycleUpdateForm";
import type { TreatmentCycle } from "@/api/types";

interface CycleUpdateModalProps {
  cycle: TreatmentCycle;
  isOpen: boolean;
  onClose: () => void;
}

export function CycleUpdateModal({
  cycle,
  isOpen,
  onClose,
}: CycleUpdateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Update Treatment Record</h2>
            <p className="text-sm text-gray-600">
              Cycle: {cycle.cycleName || `Cycle ${cycle.cycleNumber}`} | Type:{" "}
              {cycle.treatmentType || "N/A"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 100px)" }}>
          <CycleUpdateForm
            cycle={cycle}
            onStepAdvanced={() => {
              // Close modal after advancing step
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

