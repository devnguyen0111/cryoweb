/**
 * Notification Helper Utilities
 * Provides helper functions to send notifications to patients
 */

import { api } from "@/api/client";
import type { NotificationType } from "@/api/types";

/**
 * Send a notification to a patient
 * @param params - Notification parameters
 * @returns Promise that resolves when notification is created
 */
export async function sendPatientNotification(params: {
  patientId: string;
  title: string;
  content: string;
  type: NotificationType;
  userId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isImportant?: boolean;
  scheduledTime?: string;
  notes?: string;
}): Promise<void> {
  try {
    await api.notification.createNotification({
      title: params.title,
      content: params.content,
      type: params.type,
      patientId: params.patientId,
      ...(params.userId && { userId: params.userId }),
      ...(params.relatedEntityType && {
        relatedEntityType: params.relatedEntityType,
      }),
      ...(params.relatedEntityId && {
        relatedEntityId: params.relatedEntityId,
      }),
      isImportant: params.isImportant ?? false,
      ...(params.scheduledTime && { scheduledTime: params.scheduledTime }),
      ...(params.notes && { notes: params.notes }),
    });
  } catch (error) {
    // Log error but don't throw - notifications should not break the main flow
    console.error("Failed to send notification:", error);
  }
}

/**
 * Send appointment-related notification
 */
export async function sendAppointmentNotification(
  patientId: string,
  action: "created" | "updated" | "cancelled" | "status_changed",
  appointmentData: {
    appointmentId: string;
    appointmentDate?: string;
    appointmentType?: string;
    status?: string;
    doctorName?: string;
  },
  userId?: string
): Promise<void> {
  let title = "";
  let content = "";

  switch (action) {
    case "created":
      title = "New Appointment Created";
      content = `Your appointment has been successfully created${
        appointmentData.appointmentDate
          ? ` on ${new Date(
              appointmentData.appointmentDate
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}`
          : ""
      }${
        appointmentData.appointmentType
          ? `. Type: ${appointmentData.appointmentType}`
          : ""
      }${
        appointmentData.doctorName
          ? `. Doctor: ${appointmentData.doctorName}`
          : ""
      }`;
      break;
    case "updated":
      title = "Appointment Updated";
      content = `Your appointment has been updated${
        appointmentData.appointmentDate
          ? `. New appointment date: ${new Date(
              appointmentData.appointmentDate
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}`
          : ""
      }`;
      break;
    case "cancelled":
      title = "Appointment Cancelled";
      content = `Your appointment has been cancelled${
        appointmentData.appointmentDate
          ? ` (scheduled for ${new Date(
              appointmentData.appointmentDate
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })})`
          : ""
      }`;
      break;
    case "status_changed":
      title = "Appointment Status Changed";
      content = `Your appointment status has been updated to: ${
        appointmentData.status || "new"
      }`;
      break;
  }

  await sendPatientNotification({
    patientId,
    title,
    content,
    type: "Appointment" as NotificationType,
    userId,
    relatedEntityType: "Appointment",
    relatedEntityId: appointmentData.appointmentId,
    isImportant: action === "cancelled" || action === "status_changed",
  });
}

/**
 * Send treatment cycle-related notification
 */
export async function sendTreatmentCycleNotification(
  patientId: string,
  action: "created" | "updated" | "started" | "completed" | "cancelled",
  cycleData: {
    cycleId: string;
    cycleName?: string;
    cycleNumber?: number;
    treatmentType?: string;
    status?: string;
  },
  userId?: string
): Promise<void> {
  let title = "";
  let content = "";

  switch (action) {
    case "created":
      title = "New Treatment Cycle Created";
      content = `A new treatment cycle has been created for you${
        cycleData.cycleName ? `: ${cycleData.cycleName}` : ""
      }${cycleData.cycleNumber ? ` (Cycle #${cycleData.cycleNumber})` : ""}${
        cycleData.treatmentType
          ? `. Treatment Type: ${cycleData.treatmentType}`
          : ""
      }`;
      break;
    case "updated":
      title = "Treatment Cycle Updated";
      content = `Your treatment cycle information has been updated${
        cycleData.cycleName ? `: ${cycleData.cycleName}` : ""
      }`;
      break;
    case "started":
      title = "Treatment Cycle Started";
      content = `Your treatment cycle has been started${
        cycleData.cycleName ? `: ${cycleData.cycleName}` : ""
      }`;
      break;
    case "completed":
      title = "Treatment Cycle Completed";
      content = `Your treatment cycle has been completed${
        cycleData.cycleName ? `: ${cycleData.cycleName}` : ""
      }`;
      break;
    case "cancelled":
      title = "Treatment Cycle Cancelled";
      content = `Your treatment cycle has been cancelled${
        cycleData.cycleName ? `: ${cycleData.cycleName}` : ""
      }`;
      break;
  }

  await sendPatientNotification({
    patientId,
    title,
    content,
    type: "Treatment" as NotificationType,
    userId,
    relatedEntityType: "TreatmentCycle",
    relatedEntityId: cycleData.cycleId,
    isImportant: true,
  });
}

/**
 * Send service request-related notification
 */
export async function sendServiceRequestNotification(
  patientId: string,
  action: "created" | "approved" | "rejected" | "completed" | "cancelled",
  serviceRequestData: {
    serviceRequestId: string;
    serviceName?: string;
    notes?: string;
  },
  userId?: string
): Promise<void> {
  let title = "";
  let content = "";

  switch (action) {
    case "created":
      title = "New Service Request Created";
      content = `A new service request has been created for you${
        serviceRequestData.serviceName
          ? `: ${serviceRequestData.serviceName}`
          : ""
      }`;
      break;
    case "approved":
      title = "Service Request Approved";
      content = `Your service request has been approved${
        serviceRequestData.serviceName
          ? `: ${serviceRequestData.serviceName}`
          : ""
      }`;
      break;
    case "rejected":
      title = "Service Request Rejected";
      content = `Your service request has been rejected${
        serviceRequestData.serviceName
          ? `: ${serviceRequestData.serviceName}`
          : ""
      }${
        serviceRequestData.notes ? `. Reason: ${serviceRequestData.notes}` : ""
      }`;
      break;
    case "completed":
      title = "Service Request Completed";
      content = `Your service request has been completed${
        serviceRequestData.serviceName
          ? `: ${serviceRequestData.serviceName}`
          : ""
      }`;
      break;
    case "cancelled":
      title = "Service Request Cancelled";
      content = `Your service request has been cancelled${
        serviceRequestData.serviceName
          ? `: ${serviceRequestData.serviceName}`
          : ""
      }`;
      break;
  }

  await sendPatientNotification({
    patientId,
    title,
    content,
    type: "Medication" as NotificationType,
    userId,
    relatedEntityType: "ServiceRequest",
    relatedEntityId: serviceRequestData.serviceRequestId,
    isImportant: action === "approved" || action === "rejected",
  });
}

/**
 * Send encounter/medical record notification
 */
export async function sendEncounterNotification(
  patientId: string,
  _action: "created",
  encounterData: {
    encounterId?: string;
    appointmentId?: string;
    diagnosis?: string;
  },
  userId?: string
): Promise<void> {
  const title = "New Medical Record Created";
  const content = `A new medical record has been created for you${
    encounterData.diagnosis ? `. Diagnosis: ${encounterData.diagnosis}` : ""
  }`;

  await sendPatientNotification({
    patientId,
    title,
    content,
    type: "Treatment" as NotificationType,
    userId,
    relatedEntityType: encounterData.encounterId
      ? "Encounter"
      : "MedicalRecord",
    relatedEntityId:
      encounterData.encounterId || encounterData.appointmentId || undefined,
    isImportant: false,
  });
}
