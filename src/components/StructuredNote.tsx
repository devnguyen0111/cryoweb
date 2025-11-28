import { cn } from "@/utils/cn";

interface StructuredPhase {
  id?: string;
  phaseName?: string;
  phaseType?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  goals?: string;
  status?: string;
  cycleNumber?: number;
}

interface StructuredNoteData {
  estimatedDuration?: string;
  phases?: StructuredPhase[];
  additionalNotes?: string;
  doctorSigned?: boolean;
  doctorSignedDate?: string;
  doctorSignedBy?: string;
  patientSigned?: boolean;
  [key: string]: unknown;
}

const isStructuredNote = (value: unknown): value is StructuredNoteData => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.phases) ||
    "estimatedDuration" in record ||
    "additionalNotes" in record ||
    "doctorSigned" in record ||
    "patientSigned" in record
  );
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function StructuredNote({
  note,
  className,
  agreement,
}: {
  note?: string | null;
  className?: string;
  agreement?: {
    signedByDoctor?: boolean;
    doctorSigned?: boolean;
    signedByPatient?: boolean;
    patientSigned?: boolean;
  } | null;
}) {
  if (!note) {
    return null;
  }

  let parsed: StructuredNoteData | null = null;
  if (typeof note === "string") {
    try {
      const candidate = JSON.parse(note);
      if (isStructuredNote(candidate)) {
        parsed = candidate;
      }
    } catch {
      parsed = null;
    }
  } else if (isStructuredNote(note)) {
    parsed = note;
  }

  if (!parsed) {
    return (
      <p
        className={cn(
          "whitespace-pre-wrap break-words text-sm text-gray-900",
          className
        )}
      >
        {note}
      </p>
    );
  }

  return (
    <div className={cn("space-y-3 text-sm text-gray-700", className)}>
      {parsed.estimatedDuration && (
        <p className="flex flex-wrap gap-1">
          <span className="font-semibold text-gray-900">
            Estimated duration:
          </span>
          <span>{parsed.estimatedDuration}</span>
        </p>
      )}

      {Array.isArray(parsed.phases) && parsed.phases.length > 0 && (
        <div className="space-y-3">
          {parsed.phases.map((phase, index) => (
            <div
              key={phase.id ?? index}
              className="rounded-lg border border-gray-200 bg-white/60 p-3"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {phase.phaseName || `Phase ${index + 1}`}
                  </p>
                  <p className="text-xs uppercase text-gray-500">
                    {phase.phaseType || "Treatment phase"}
                    {phase.cycleNumber !== undefined
                      ? ` • Cycle #${phase.cycleNumber}`
                      : ""}
                  </p>
                </div>
                {phase.status && (
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {phase.status}
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {(phase.startDate || phase.endDate) && (
                  <p className="font-medium text-gray-700">
                    {formatDate(phase.startDate)} → {formatDate(phase.endDate)}
                  </p>
                )}
                {phase.description && (
                  <p className="whitespace-pre-wrap">{phase.description}</p>
                )}
                {phase.goals && (
                  <p className="whitespace-pre-wrap">
                    <span className="font-semibold text-gray-900">Goals:</span>{" "}
                    {phase.goals}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {parsed.additionalNotes && (
        <p className="whitespace-pre-wrap">
          <span className="font-semibold text-gray-900">Additional notes:</span>{" "}
          {parsed.additionalNotes}
        </p>
      )}

      {(() => {
        // Use agreement data if available (more accurate), otherwise use parsed notes data
        // Priority: agreement data > parsed notes data
        // Only use parsed data if agreement doesn't have the field (undefined)
        // Handle both boolean and string "true"/"false" values
        const normalizeBoolean = (value: unknown): boolean | undefined => {
          if (
            value === true ||
            value === "true" ||
            value === 1 ||
            value === "1"
          )
            return true;
          if (
            value === false ||
            value === "false" ||
            value === 0 ||
            value === "0" ||
            value === null
          )
            return false;
          return undefined;
        };

        // Get values from agreement first (most accurate), then fallback to parsed
        const doctorSignedValue =
          agreement?.signedByDoctor !== undefined
            ? agreement.signedByDoctor
            : agreement?.doctorSigned !== undefined
              ? agreement.doctorSigned
              : parsed.doctorSigned;
        const patientSignedValue =
          agreement?.signedByPatient !== undefined
            ? agreement.signedByPatient
            : agreement?.patientSigned !== undefined
              ? agreement.patientSigned
              : parsed.patientSigned;

        const doctorSigned = normalizeBoolean(doctorSignedValue);
        const patientSigned = normalizeBoolean(patientSignedValue);

        // Only show signature status if we have data from either source
        if (
          doctorSigned === undefined &&
          patientSigned === undefined &&
          parsed.doctorSigned === undefined &&
          parsed.patientSigned === undefined
        ) {
          return null;
        }

        return (
          <div className="text-xs text-gray-500">
            {(doctorSigned !== undefined ||
              parsed.doctorSigned !== undefined) && (
              <p>Doctor {doctorSigned === true ? "signed" : "not signed"}.</p>
            )}
            {(patientSigned !== undefined ||
              parsed.patientSigned !== undefined) && (
              <p>Patient {patientSigned === true ? "signed" : "not signed"}.</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
